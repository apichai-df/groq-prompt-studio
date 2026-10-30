import Groq from 'groq-sdk';

export const runtime = 'nodejs';

const schemaInstruction = `ตอบกลับเป็น JSON เท่านั้น โดยมีโครงสร้างนี้:
{
  "optimizedPrompt": "prompt ฉบับสมบูรณ์",
  "whyItWorks": ["เหตุผล 1", "เหตุผล 2", "เหตุผล 3"],
  "checklist": ["สิ่งที่ควรตรวจ 1", "สิ่งที่ควรตรวจ 2"],
  "alternatives": [
    {"name": "แบบกระชับ", "prompt": "..."},
    {"name": "แบบละเอียด", "prompt": "..."}
  ]
}`;

export async function POST(request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return Response.json({ error: 'ยังไม่ได้ตั้งค่า GROQ_API_KEY' }, { status: 500 });
    }

    const body = await request.json();
    const fields = ['goal', 'role', 'audience', 'context', 'constraints', 'outputFormat', 'tone', 'language'];
    const data = Object.fromEntries(fields.map((key) => [key, String(body[key] || '').trim()]));

    if (!data.goal) {
      return Response.json({ error: 'กรุณาระบุเป้าหมายของ Prompt' }, { status: 400 });
    }
    if (data.goal.length > 4000) {
      return Response.json({ error: 'เป้าหมายยาวเกินไป (สูงสุด 4,000 ตัวอักษร)' }, { status: 400 });
    }

    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await client.chat.completions.create({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
      temperature: 0.35,
      max_completion_tokens: 3000,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `คุณคือ Senior Prompt Engineer ออกแบบ Prompt ที่นำไปใช้ได้จริง ชัดเจน ไม่แต่งข้อมูลที่ผู้ใช้ไม่ได้ให้มา หากข้อมูลไม่พอให้ใส่ placeholder เช่น [ระบุข้อมูล] Prompt ต้องมีบทบาท เป้าหมาย บริบท ข้อจำกัด กระบวนการตรวจสอบ และรูปแบบผลลัพธ์ หลีกเลี่ยงคำฟุ่มเฟือย ${schemaInstruction}`
        },
        {
          role: 'user',
          content: `ช่วยสร้าง Prompt จากข้อมูลต่อไปนี้
เป้าหมาย: ${data.goal}
บทบาท AI: ${data.role || 'ให้เลือกบทบาทที่เหมาะสม'}
กลุ่มเป้าหมาย: ${data.audience || 'ไม่ระบุ'}
บริบท: ${data.context || 'ไม่ระบุ'}
ข้อจำกัด: ${data.constraints || 'ไม่ระบุ'}
รูปแบบผลลัพธ์: ${data.outputFormat || 'ให้เลือกที่เหมาะสม'}
โทน: ${data.tone || 'มืออาชีพ'}
ภาษาของ Prompt: ${data.language || 'ไทย'}`
        }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) throw new Error('Groq ไม่ได้ส่งผลลัพธ์กลับมา');

    let result;
    try { result = JSON.parse(raw); }
    catch { return Response.json({ error: 'โมเดลส่งข้อมูลที่อ่านไม่ได้ กรุณาลองอีกครั้ง' }, { status: 502 }); }

    if (!result.optimizedPrompt) {
      return Response.json({ error: 'ผลลัพธ์ไม่ครบถ้วน กรุณาลองอีกครั้ง' }, { status: 502 });
    }
    return Response.json(result);
  } catch (error) {
    console.error(error);
    const status = error?.status === 429 ? 429 : 500;
    return Response.json({
      error: status === 429 ? 'มีคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่' : 'สร้าง Prompt ไม่สำเร็จ กรุณาตรวจสอบ API Key และ Model'
    }, { status });
  }
}
