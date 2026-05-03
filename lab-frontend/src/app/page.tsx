"use client";

import React, { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Shield, 
  Thermometer, 
  Droplets, 
  Lightbulb, 
  Cpu, 
  Bot,
  Send,
  User,
  Zap,
  Lock,
  Scan,
  Activity
} from 'lucide-react';

// Sample data for sparklines
const sparkData = [
  { value: 40 }, { value: 30 }, { value: 45 }, { value: 35 }, 
  { value: 55 }, { value: 40 }, { value: 50 }
];

interface Message {
  role: 'user' | 'ai';
  text: string;
}

const Dashboard = () => {
  const [cameraState, setCameraState] = useState({
    face_detected: false,
    distance: 1.4,
    zone: "Workstation"
  });
  const [lights, setLights] = useState(false);
  
  // AI State
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Autonomous assistant online. How can I help?' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const client = mqtt.connect('ws://localhost:9001');
    client.on('connect', () => client.subscribe('lab/security/camera'));
    client.on('message', (topic, message) => {
      if (topic === 'lab/security/camera') {
        const data = JSON.parse(message.toString());
        setCameraState(prev => ({ ...prev, ...data }));
      }
    });
    return () => { client.end(); };
  }, []);

  const handleAiSend = async () => {
    if (!aiInput.trim() || isAiLoading) return;
    const msg = aiInput.trim();
    setAiInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setIsAiLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/ai/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Error connecting to neural core.' }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="min-h-screen p-6 md:p-10 scrollbar-hide">
      
      {/* Page Header */}
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-extralight tracking-tighter text-white uppercase">
            Smart Lab <span className="font-black text-teal-400 italic">V2</span>
          </h1>
          <p className="text-[10px] font-bold tracking-[0.3em] text-white/40 uppercase mt-2">Autonomous Infrastructure Core</p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-full bg-white/[0.05] border border-white/[0.1] px-4 py-1.5 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse"></div>
            <span className="text-[10px] font-bold tracking-widest text-white/60">SYSTEM STABLE</span>
          </div>
        </div>
      </header>

      {/* Strict Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-6 auto-rows-[minmax(180px,auto)] max-w-[1600px] mx-auto">
        
        {/* Card 1: Radar/Security (2x2) */}
        <div className="md:col-span-2 md:row-span-2 premium-glass flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-white/[0.05] rounded-2xl border border-white/[0.1]">
              <Shield size={20} className={cameraState.face_detected ? "text-red-400" : "text-teal-400"} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Security Radar</span>
          </div>

          <div className="flex flex-col items-center justify-center py-8">
            <motion.div 
              animate={{ scale: cameraState.face_detected ? [1, 1.05, 1] : 1 }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="relative"
            >
              <span className="text-9xl font-light tracking-tighter text-white">
                {cameraState.distance.toFixed(1)}<span className="text-2xl ml-1 opacity-30">m</span>
              </span>
              {cameraState.face_detected && (
                <div className="absolute -inset-10 bg-red-500/10 blur-[60px] -z-10 rounded-full animate-pulse"></div>
              )}
            </motion.div>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 block mb-1">Current Zone</span>
              <span className="text-xl font-bold text-white tracking-tight">{cameraState.zone}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/[0.05] px-4 py-2 rounded-2xl border border-white/[0.1]">
              <Activity size={12} className="text-teal-400" />
              <span className="text-[10px] font-bold text-teal-400 tracking-widest uppercase">Live Telemetry</span>
            </div>
          </div>
        </div>

        {/* Card 2: AI Assistant (2x3) - Tall right side */}
        <div className="md:col-span-2 md:row-span-3 premium-glass bg-purple-950/10 border-purple-500/10 flex flex-col p-0 overflow-hidden group">
          <div className="p-6 border-b border-white/[0.05] flex justify-between items-center bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/20 rounded-xl">
                <Bot size={18} className="text-purple-400" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white">Ollama Intelligence</span>
            </div>
            <div className="flex gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-500/50"></div>
              <div className="h-1.5 w-1.5 rounded-full bg-purple-500/50"></div>
            </div>
          </div>

          {/* Chat Space */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-gradient-to-b from-transparent to-purple-900/5">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-purple-600 text-white rounded-tr-none' 
                    : 'bg-white/[0.05] text-white/90 border border-white/[0.1] rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isAiLoading && (
              <div className="flex justify-start">
                <div className="bg-white/[0.05] p-4 rounded-2xl rounded-tl-none flex gap-1.5">
                  <div className="h-1 w-1 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="h-1 w-1 bg-purple-400 rounded-full animate-bounce delay-75"></div>
                  <div className="h-1 w-1 bg-purple-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 bg-white/[0.02] border-t border-white/[0.05]">
            <div className="relative">
              <input 
                type="text" 
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAiSend()}
                placeholder="Send a command..."
                className="w-full bg-white/[0.05] border border-white/[0.1] text-white rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
              />
              <button 
                onClick={handleAiSend}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-purple-400 hover:text-white transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Temperature (1x1) */}
        <div className="md:col-span-1 md:row-span-1 premium-glass flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <Thermometer size={18} className="text-teal-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Lab Temp</span>
          </div>
          <div className="flex items-center justify-center">
            <span className="text-5xl font-light tracking-tight text-white">24<span className="text-xl ml-1 text-teal-400 font-medium">°C</span></span>
          </div>
          <div className="h-10 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="value" stroke="#2dd4bf" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 4: Humidity (1x1) */}
        <div className="md:col-span-1 md:row-span-1 premium-glass flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <Droplets size={18} className="text-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Humidity</span>
          </div>
          <div className="flex items-center justify-center">
            <span className="text-5xl font-light tracking-tight text-white">42<span className="text-xl ml-1 text-blue-400 font-medium">%</span></span>
          </div>
          <div className="h-10 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 5: Power Controls (2x1) */}
        <div className="md:col-span-2 md:row-span-1 premium-glass flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Relay Controls</span>
            <div className="flex gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-teal-500"></div>
              <div className="h-1.5 w-1.5 rounded-full bg-white/10"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 flex-1">
            <motion.button 
              whileTap={{ scale: 0.96 }}
              onClick={() => setLights(!lights)}
              className={`flex items-center justify-between p-5 rounded-[24px] border transition-all duration-500 ${
                lights ? 'bg-teal-500/20 border-teal-500/50' : 'bg-white/[0.05] border-white/[0.1]'
              }`}
            >
              <div className="flex flex-col items-start">
                <span className={`text-[9px] font-black uppercase tracking-widest mb-1 ${lights ? 'text-teal-400' : 'text-white/20'}`}>Main Relay</span>
                <span className="text-base font-bold text-white tracking-tight">Main Lights</span>
              </div>
              <Lightbulb size={24} className={lights ? 'text-teal-400' : 'text-white/20'} />
            </motion.button>

            <motion.button 
              whileTap={{ scale: 0.96 }}
              className="flex items-center justify-between p-5 rounded-[24px] border bg-white/[0.02] border-white/[0.05] grayscale opacity-40 cursor-not-allowed"
            >
              <div className="flex flex-col items-start">
                <span className="text-[9px] font-black uppercase tracking-widest mb-1 text-white/20">Aux Relay</span>
                <span className="text-base font-bold text-white tracking-tight">Exhaust Fan</span>
              </div>
              <Zap size={24} className="text-white/20" />
            </motion.button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
