import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Bot } from 'lucide-react';

const RESPONSES: { keywords: string[]; reply: string; suggestions?: string[] }[] = [
  { keywords: ['hello', 'hi', 'hey', 'start'], reply: "Hi there! I'm Iris — your CampusIQ assistant. I can help with attendance, fees, timetables, exam schedules, library, hostel, transport, and more. What do you need?", suggestions: ['View my attendance', 'Pay my fees', 'Show timetable', 'Library hours'] },
  { keywords: ['attendance', 'absent', 'present'], reply: "You can track attendance under 'Attendance' in the sidebar. The minimum required is 75%. Faculty can mark attendance from the same page in faculty mode.", suggestions: ['My attendance %', 'Exam eligibility', 'Leave request'] },
  { keywords: ['fee', 'payment', 'tuition', 'pay'], reply: "Head to the Fees page to view your current balance, past receipts, and pay online via UPI, card, or net banking. Receipts are auto-generated.", suggestions: ['Next due date', 'Scholarship status'] },
  { keywords: ['timetable', 'schedule', 'class', 'classes'], reply: "Your weekly timetable is available on the Timetable page, showing subject, faculty, room, and time for each slot.", suggestions: ["Today's classes", 'Free slots'] },
  { keywords: ['exam', 'test', 'grade', 'marks', 'result'], reply: "Exam dates and results appear on the Exams & Grades page. Click any exam to see topic-wise performance and class rank.", suggestions: ['Next exam', 'My CGPA'] },
  { keywords: ['library', 'book', 'books'], reply: "The Library module lets you browse catalog, reserve books, and track dues. Max 4 books at once; borrowing window is 14 days.", suggestions: ['Reserve a book', 'My borrowed list'] },
  { keywords: ['hostel', 'room', 'dorm'], reply: "Hostel info (block, room, warden contact, mess menu) is on the Hostel page. Raise complaints and leave requests from there.", suggestions: ['Mess menu', 'Raise complaint'] },
  { keywords: ['transport', 'bus', 'route'], reply: "Transport shows your bus route, pickup point, driver, and live status. Change route via Workflow Approvals.", suggestions: ['Route change', 'Driver contact'] },
  { keywords: ['assignment', 'homework', 'submit'], reply: "Assignments are listed with deadlines on the Assignments page. Upload files directly; late submissions get auto-flagged.", suggestions: ['Pending assignments', 'Past submissions'] },
  { keywords: ['admission', 'apply'], reply: "Prospective students can apply via the public admissions form. Admins track, shortlist, and approve applications under Admissions.", suggestions: ['Application status', 'Documents required'] },
  { keywords: ['password', 'login', 'otp'], reply: "Login uses email + password with OTP verification. Forgot password? Click 'Forgot password' on the login page to receive an OTP on email.", suggestions: ['Reset password', '2FA setup'] },
  { keywords: ['help', 'support', 'contact'], reply: "You can reach the CampusIQ helpdesk via Messages, or email support@campusiq.edu. Admins handle queries through the Workflows module." },
  { keywords: ['thanks', 'thank you', 'thx'], reply: "Anytime! Ping me whenever you need help navigating CampusIQ." },
];

const FALLBACK = { reply: "I'm a mini assistant trained on CampusIQ basics. Try asking about attendance, fees, timetable, exams, library, hostel, transport, assignments, or admissions.", suggestions: ['Show timetable', 'My attendance', 'Pay fees', 'Library hours'] };

function match(text: string) {
  const t = text.toLowerCase();
  for (const r of RESPONSES) { if (r.keywords.some(k => t.includes(k))) return r; }
  return FALLBACK;
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<{ from: 'bot' | 'me'; text: string; suggestions?: string[] }[]>([
    { from: 'bot', text: "Hi! I'm Iris — your CampusIQ assistant. Ask me anything about the portal.", suggestions: ['My attendance', 'Timetable', 'Fees due', 'Library'] },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }); }, [msgs, open, typing]);

  const send = (text?: string) => {
    const q = (text ?? input).trim(); if (!q) return;
    setInput('');
    setMsgs(m => [...m, { from: 'me', text: q }]);
    setTyping(true);
    setTimeout(() => {
      const r = match(q);
      setTyping(false);
      setMsgs(m => [...m, { from: 'bot', text: r.reply, suggestions: r.suggestions }]);
    }, 600);
  };

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-600 text-white shadow-2xl shadow-cyan-500/40 flex items-center justify-center hover:scale-110 transition-transform group"
        aria-label="Open assistant"
      >
        {open ? <X size={22} /> : <Bot size={22} className="group-hover:rotate-12 transition-transform" />}
        {!open && (
          <>
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white dark:border-[#050811]" />
            <span className="absolute inset-0 rounded-full ring-2 ring-cyan-400/50 animate-ping" />
          </>
        )}
      </button>
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-8rem)] rounded-3xl bg-white dark:bg-[#0a0f1e] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden scale-in">
          {/* Header */}
          <div className="relative p-4 bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-700 text-white flex items-center gap-3 overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-20" />
            <div className="relative w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/20"><Sparkles size={19} /></div>
            <div className="relative flex-1">
              <div className="font-bold tracking-tight">Iris · CampusIQ Assistant</div>
              <div className="text-[11px] opacity-90 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block pulse-dot" /> Online · typically replies instantly</div>
            </div>
          </div>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-50/80 to-white dark:from-slate-950/50 dark:to-[#0a0f1e]">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'} fade-in`}>
                <div className={`max-w-[85%] ${m.from === 'me' ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-2xl rounded-br-md' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-bl-md border border-slate-200 dark:border-slate-700'} px-4 py-2.5 text-[13.5px] shadow-sm leading-relaxed`}>
                  {m.text}
                  {m.suggestions && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {m.suggestions.map(s => (
                        <button key={s} onClick={() => send(s)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${m.from === 'me'
                              ? 'bg-white/15 text-white border border-white/25 hover:bg-white/25'
                              : 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25 hover:bg-cyan-500/20'
                            }`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start fade-in">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            )}
          </div>
          {/* Input */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0f1e]">
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Ask about fees, attendance…" className="flex-1 !text-[13.5px]" />
              <button onClick={() => send()} className="btn-primary !px-3.5" aria-label="Send"><Send size={15} /></button>
            </div>
            <div className="text-[10px] text-slate-400 mt-1.5 text-center">Iris is a mini knowledge-base assistant · responses are canned</div>
          </div>
        </div>
      )}
    </>
  );
}
