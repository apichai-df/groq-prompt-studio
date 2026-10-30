'use client';

import { useEffect, useMemo, useState } from 'react';

const emptyForm = {
  goal: '', role: '', audience: '', context: '', constraints: '',
  outputFormat: 'หัวข้อแบบเป็นขั้นตอน', tone: 'มืออาชีพ', language: 'ไทย'
};

const examples = [
  { label: 'เขียนคอนเทนต์', goal: 'สร้างโพสต์ Facebook โปรโมตร้านกาแฟเปิดใหม่', role: 'นักเขียนโฆษณา', audience: 'คนทำงานอายุ 22-40 ปี', context: 'ร้านเน้นกาแฟสเปเชียลตี้และบรรยากาศสงบ', constraints: 'ไม่เกิน 180 คำ มี CTA และไม่กล่าวอ้างเกินจริง', outputFormat: 'โพสต์พร้อมหัวข้อและแฮชแท็ก', tone: 'เป็นกันเอง' },
  { label: 'วิเคราะห์ข้อมูล', goal: 'วิเคราะห์ยอดขายรายเดือนและหาแนวโน้มที่ควรจับตา', role: 'นักวิเคราะห์ธุรกิจ', audience: 'ผู้บริหาร', context: 'ข้อมูลจะถูกแนบเป็นไฟล์ CSV', constraints: 'ระบุสมมติฐาน แยกข้อเท็จจริงจากข้อเสนอแนะ', outputFormat: 'Executive summary และ bullet points', tone: 'กระชับ' },
  { label: 'ช่วยเขียนโค้ด', goal: 'สร้าง REST API สำหรับระบบจัดการงาน', role: 'Senior Backend Developer', audience: 'ทีมพัฒนาซอฟต์แวร์', context: 'ใช้ Node.js และ PostgreSQL', constraints: 'ต้องมี validation, error handling, tests และ security notes', outputFormat: 'โครงสร้างไฟล์และโค้ดพร้อมคำอธิบาย', tone: 'เชิงเทคนิค' }
];

export default function Home() {
  const [form, setForm] = useState(emptyForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('main');

  useEffect(() => {
    try { setHistory(JSON.parse(localStorage.getItem('promptsmith-history') || '[]')); } catch {}
  }, []);

  const activePrompt = useMemo(() => {
    if (!result) return '';
    if (tab === 'main') return result.optimizedPrompt || '';
    return result.alternatives?.[Number(tab)]?.prompt || '';
  }, [result, tab]);

  function update(key, value) { setForm((f) => ({ ...f, [key]: value })); }

  async function submit(e) {
    e.preventDefault(); setError(''); setResult(null); setLoading(true); setTab('main');
    try {
      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');
      setResult(data);
      const next = [{ id: Date.now(), goal: form.goal, prompt: data.optimizedPrompt }, ...history].slice(0, 8);
      setHistory(next); localStorage.setItem('promptsmith-history', JSON.stringify(next));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function copy(text, key='main') {
    await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1600);
  }

  return (
    <main className="shell">
      <header className="hero">
        <div className="brand"><span className="logo">P</span><span>PromptSmith <b>AI</b></span></div>
        <div className="badge">Powered by Groq</div>
        <h1>เปลี่ยนไอเดียให้เป็น <span>Prompt ที่ใช้งานได้จริง</span></h1>
        <p>ระบุสิ่งที่ต้องการ แล้วให้ AI จัดโครงสร้าง เพิ่มบริบท และสร้าง Prompt พร้อมใช้งานให้คุณ</p>
      </header>

      <section className="quick">
        <span>เริ่มจากตัวอย่าง:</span>
        {examples.map((x) => <button key={x.label} type="button" onClick={() => setForm({ ...emptyForm, ...x })}>{x.label}</button>)}
      </section>

      <div className="grid">
        <form className="panel form" onSubmit={submit}>
          <div className="panelTitle"><span>01</span><div><h2>บอกความต้องการ</h2><p>ข้อมูลละเอียดขึ้น ผลลัพธ์จะแม่นยำขึ้น</p></div></div>
          <label>เป้าหมายของ Prompt <em>*</em><textarea required maxLength={4000} rows={4} value={form.goal} onChange={(e)=>update('goal',e.target.value)} placeholder="เช่น ช่วยสร้างแผนการตลาดสำหรับร้านกาแฟ..." /></label>
          <div className="two">
            <label>บทบาทที่ต้องการให้ AI เป็น<input value={form.role} onChange={(e)=>update('role',e.target.value)} placeholder="เช่น นักการตลาดมืออาชีพ" /></label>
            <label>กลุ่มเป้าหมาย<input value={form.audience} onChange={(e)=>update('audience',e.target.value)} placeholder="เช่น เจ้าของธุรกิจขนาดเล็ก" /></label>
          </div>
          <label>บริบทเพิ่มเติม<textarea rows={3} value={form.context} onChange={(e)=>update('context',e.target.value)} placeholder="ข้อมูลพื้นฐาน สถานการณ์ หรือสิ่งที่ AI ควรรู้" /></label>
          <label>ข้อจำกัด / สิ่งที่ต้องมี<textarea rows={3} value={form.constraints} onChange={(e)=>update('constraints',e.target.value)} placeholder="เช่น ไม่เกิน 500 คำ ต้องมีตัวอย่าง 3 ข้อ" /></label>
          <div className="three">
            <label>รูปแบบผลลัพธ์<select value={form.outputFormat} onChange={(e)=>update('outputFormat',e.target.value)}><option>หัวข้อแบบเป็นขั้นตอน</option><option>ตาราง</option><option>บทความ</option><option>JSON</option><option>โค้ดพร้อมคำอธิบาย</option></select></label>
            <label>โทน<select value={form.tone} onChange={(e)=>update('tone',e.target.value)}><option>มืออาชีพ</option><option>เป็นกันเอง</option><option>กระชับ</option><option>เชิงเทคนิค</option><option>สร้างสรรค์</option></select></label>
            <label>ภาษา<select value={form.language} onChange={(e)=>update('language',e.target.value)}><option>ไทย</option><option>อังกฤษ</option><option>ไทยและอังกฤษ</option></select></label>
          </div>
          {error && <div className="error" role="alert">{error}</div>}
          <button className="primary" disabled={loading}>{loading ? <><i className="spinner"/> กำลังออกแบบ Prompt...</> : '✦ สร้าง Prompt อัจฉริยะ'}</button>
        </form>

        <section className="panel output">
          <div className="panelTitle"><span>02</span><div><h2>Prompt ที่ปรับปรุงแล้ว</h2><p>ตรวจสอบ แก้ไข หรือคัดลอกไปใช้งาน</p></div></div>
          {!result && !loading && <div className="empty"><div>✦</div><h3>Prompt ของคุณจะปรากฏที่นี่</h3><p>กรอกข้อมูลด้านซ้าย แล้วกด “สร้าง Prompt อัจฉริยะ”</p></div>}
          {loading && <div className="empty"><i className="spinner big"/><h3>กำลังคิดและจัดโครงสร้าง...</h3><p>Groq กำลังสร้าง Prompt ที่เหมาะกับงานของคุณ</p></div>}
          {result && <div className="result">
            <div className="tabs"><button className={tab==='main'?'active':''} onClick={()=>setTab('main')}>Prompt หลัก</button>{(result.alternatives||[]).map((x,i)=><button key={i} className={tab===String(i)?'active':''} onClick={()=>setTab(String(i))}>{x.name}</button>)}</div>
            <pre>{activePrompt}</pre>
            <button className="copy" onClick={()=>copy(activePrompt,tab)}>{copied===tab?'✓ คัดลอกแล้ว':'คัดลอก Prompt'}</button>
            <div className="why"><h3>ทำไม Prompt นี้จึงทำงานได้ดี</h3><ul>{(result.whyItWorks||[]).map((x,i)=><li key={i}>{x}</li>)}</ul></div>
            <div className="check"><h3>เช็กลิสต์ก่อนใช้งาน</h3>{(result.checklist||[]).map((x,i)=><p key={i}>□ {x}</p>)}</div>
          </div>}
        </section>
      </div>

      {history.length > 0 && <section className="history"><div className="historyHead"><h2>ประวัติล่าสุด</h2><button onClick={()=>{setHistory([]);localStorage.removeItem('promptsmith-history')}}>ล้างประวัติ</button></div><div className="historyGrid">{history.map(x=><article key={x.id}><h3>{x.goal}</h3><p>{x.prompt}</p><button onClick={()=>copy(x.prompt,String(x.id))}>{copied===String(x.id)?'คัดลอกแล้ว':'คัดลอก'}</button></article>)}</div></section>}
      <footer>PromptSmith AI • API Key ถูกเก็บไว้ฝั่งเซิร์ฟเวอร์เท่านั้น</footer>
    </main>
  );
}
