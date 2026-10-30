import './globals.css';

export const metadata = {
  title: 'PromptSmith AI',
  description: 'ผู้ช่วยออกแบบ Prompt ด้วย Groq'
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
