import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, Send, Mic, Command, 
  Sparkles, Zap, ShieldAlert, 
  Terminal, ArrowRight, BrainCircuit
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const suggestions = [
  "Turn off all lights in Lab 101",
  "Explain the last gas alert",
  "How much energy was used today?",
  "Arm the laboratory for the night",
  "Check motion sensor in Bio Lab"
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "LabOS Core Intelligence active. How can I assist with your operations today?" }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    
    // Simulate AI thinking
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "assistant", text: `I have processed your request: "${input}". Initiating system sequence...` }]);
    }, 1000);
  };

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col gap-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase flex items-center gap-4">
            <BrainCircuit className="h-8 w-8 text-primary" />
            Neural Core AI
          </h1>
          <p className="text-xs font-bold text-white/30 uppercase tracking-[0.3em]">Autonomous Intelligent Agent (Ollama Interface)</p>
        </div>
        <div className="status-badge bg-primary/10 text-primary px-4 py-2">
          <Sparkles className="h-3 w-3" />
          Quantum Thread Ready
        </div>
      </header>

      <div className="flex-1 flex flex-col xl:flex-row gap-6 min-h-0">
        {/* Chat Interface */}
        <div className="flex-1 industrial-card flex flex-col p-0 overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-3">
            <Terminal className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Secure Kernel Bridge</span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
            {messages.map((m, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={i} 
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                  m.role === 'user' 
                    ? 'bg-primary/10 border border-primary/20 text-white rounded-tr-none' 
                    : 'bg-white/5 border border-white/5 text-white/80 rounded-tl-none'
                }`}>
                  <p className="text-xs font-medium leading-relaxed">{m.text}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="p-6 border-t border-white/5 bg-background">
            <div className="relative">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Enter operational command or query..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-6 pr-24 text-xs focus:border-primary/50 transition-all outline-none"
              />
              <div className="absolute right-2 top-2 flex gap-2">
                <button className="p-2 text-white/40 hover:text-white transition-colors"><Mic className="h-5 w-5" /></button>
                <button 
                  onClick={handleSend}
                  className="bg-primary text-primary-foreground p-2 rounded-lg hover:scale-105 transition-all shadow-lg"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Intelligence Sidebar */}
        <div className="xl:w-96 flex flex-col gap-6">
          <div className="industrial-card p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Command className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-black uppercase tracking-wider">Quick Directives</h2>
            </div>
            <div className="space-y-2">
              {suggestions.map(s => (
                <button 
                  key={s} 
                  onClick={() => setInput(s)}
                  className="w-full text-left p-3 rounded-lg bg-white/5 border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-wider flex items-center justify-between group"
                >
                  {s}
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
              ))}
            </div>
          </div>

          <div className="industrial-card p-6 space-y-6 flex-1">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-black uppercase tracking-wider">Neural Insights</h2>
            </div>
            <div className="space-y-4">
              <InsightBlock 
                icon={Zap} 
                title="Efficiency Potential" 
                text="Automating Lab 102 cooling cycles could reduce HVAC costs by 14%."
              />
              <InsightBlock 
                icon={ShieldAlert} 
                title="Security Advisory" 
                text="Anomaly detected in after-hours access patterns for Sector B."
              />
              <div className="pt-4 border-t border-white/5 flex justify-center">
                <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] animate-pulse">Processing Core Metrics...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightBlock({ icon: Icon, title, text }: any) {
  return (
    <div className="space-y-2 p-4 rounded-xl bg-white/5 border border-white/5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-[10px] font-black text-white uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-[10px] font-bold text-white/40 leading-relaxed uppercase tracking-tighter">
        {text}
      </p>
    </div>
  );
}
