"use client";

import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { 
  LineChart, Line, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  Sun, Cloud, Home, Camera, Settings, Menu, 
  Grid, Bell, User as UserIcon, Lock, Unlock,
  Lightbulb, Thermometer, Wind, Zap, 
  ShieldCheck, ArrowRight, Power, HelpCircle,
  MoreVertical, Search, Zap as Flash, Monitor,
  Droplets, Fan, Snowflake, Cpu, ChevronUp, ChevronDown, Bot, Moon
} from 'lucide-react';

// Design Constants
const BENTO_GAP = "gap-[20px]";
const CORNER_RADIUS = "rounded-[32px]";
const GLASS_BASE = "backdrop-blur-3xl bg-white/5 border border-white/10 shadow-2xl";

const sparkData = [
  { val: 24 }, { val: 24.2 }, { val: 24.1 }, { val: 24.3 }, { val: 24.2 }
];

const users = [
  { name: "Prithic", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Prithic" },
  { name: "System", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bot" },
  { name: "Security", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Guard" },
];

const Dashboard = () => {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mqttClient, setMqttClient] = useState<mqtt.MqttClient | null>(null);

  // Global State Management (User Requested)
  const [lights, setLights] = useState(Array(6).fill(false));
  const [fans, setFans] = useState(Array(4).fill(false));
  const [ac, setAc] = useState(Array(2).fill(false));
  const [environment, setEnvironment] = useState({ temperature: 0, humidity: 0, power: 0 });
  const [security, setSecurity] = useState({ authorized: false, armed: false, presence: false });

  useEffect(() => setMounted(true), []);

  // MQTT Bridge (User Requested)
  useEffect(() => {
    const client = mqtt.connect('ws://localhost:9001');

    client.on('connect', () => {
      console.log("MQTT Connected to Smart Lab");
      client.subscribe(['lab/telemetry/environment', 'lab/security/vision']);
      setMqttClient(client);
    });

    client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        
        if (topic === 'lab/telemetry/environment') {
          setEnvironment({
            temperature: payload.temperature ?? 0,
            humidity: payload.humidity ?? 0,
            power: payload.power ?? 0
          });
        } else if (topic === 'lab/security/vision') {
          setSecurity(prev => ({
            ...prev,
            presence: payload.presence === true,
            authorized: payload.presence === true // Mapping presence to authorized for UI binding
          }));
        }
      } catch (e) {
        console.error("MQTT Parse Error:", e);
      }
    });

    return () => { client.end(); };
  }, []);

  // Hardware Actuation (User Requested)
  const handleToggle = (type: 'light' | 'fan' | 'ac', index: number) => {
    let newState = false;
    let topic = `lab/relay/${type}/${index + 1}`; // User example used 1-based indexing in description "light/1"

    if (type === 'light') {
      const updated = [...lights]; updated[index] = !updated[index];
      newState = updated[index]; setLights(updated);
    } else if (type === 'fan') {
      const updated = [...fans]; updated[index] = !updated[index];
      newState = updated[index]; setFans(updated);
    } else if (type === 'ac') {
      const updated = [...ac]; updated[index] = !updated[index];
      newState = updated[index]; setAc(updated);
    }

    if (mqttClient) {
      mqttClient.publish(topic, JSON.stringify({ state: newState ? "ON" : "OFF" }));
    }
  };

  const DeviceToggle = ({ icon: Icon, label, isOn, onToggle, colorClass, glowColor }: any) => (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl transition-all duration-500 ${isOn ? `${colorClass} ${glowColor}` : 'bg-white/5 text-white/20'}`}>
          <Icon size={18} className={isOn ? 'animate-pulse' : ''} />
        </div>
        <span className="text-xs font-bold tracking-wide text-white/90">{label}</span>
      </div>
      <div 
        onClick={onToggle}
        className={`h-6 w-11 rounded-full relative cursor-pointer transition-all duration-500 ${
          isOn ? 'bg-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-white/10'
        }`}
      >
        <motion.div animate={{ x: isOn ? 22 : 3 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="absolute top-1.5 h-3 w-3 bg-white rounded-full shadow-lg" />
      </div>
    </div>
  );

  if (!mounted) return null;

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-black">
      
      {/* Background Mesh */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-emerald-900/20"></div>

      {/* Sidebar */}
      <aside className="w-24 relative z-10 bg-white/5 backdrop-blur-2xl flex flex-col items-center py-10 border-r border-white/10 hidden md:flex">
        <div className="sidebar-icon mb-12 p-4 !bg-indigo-600 !text-white rounded-[20px] shadow-xl shadow-indigo-600/20"><Cpu size={28} /></div>
        <div className="space-y-8 flex-1">
          <div className="sidebar-icon !text-indigo-400 bg-indigo-500/10"><Grid size={24} /></div>
          <div className="sidebar-icon" onClick={() => router.push('/ai')}><Bot size={24} /></div>
          <div className="sidebar-icon" onClick={() => router.push('/system')}><Monitor size={24} /></div>
          <div className="sidebar-icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
          </div>
          <div className="sidebar-icon"><Settings size={24} /></div>
        </div>
        <div className="mt-auto">
          <div className="h-12 w-12 rounded-[18px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-xl shadow-indigo-500/20 border border-white/20">P</div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        
        <nav className="h-20 bg-white/5 backdrop-blur-3xl flex items-center px-12 gap-12 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-indigo-600 rounded-[14px] flex items-center justify-center text-white shadow-2xl shadow-indigo-600/40">
              <Zap size={22} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Autonomous Control</span>
              <span className="text-sm font-black uppercase tracking-[0.2em] text-white">IOT LAB CORE</span>
            </div>
          </div>
          
          <div className="ml-auto flex items-center gap-8">
            <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
              <div className={`h-2.5 w-2.5 rounded-full ${mqttClient ? 'bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.6)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]'}`}></div>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${mqttClient ? 'text-emerald-400' : 'text-red-400'}`}>
                {mqttClient ? 'System Live' : 'Link Lost'}
              </span>
            </div>
          </div>
        </nav>

        <div className="flex-1 overflow-y-auto p-12 scrollbar-hide">
          
          <div className="flex justify-between items-end mb-12">
            <div className="flex gap-6">
              {users.map(user => (
                <div key={user.name} className="flex items-center gap-4 bg-white/5 p-2 pr-8 rounded-[24px] border border-white/10 shadow-xl hover:scale-105 transition-all cursor-pointer group">
                  <img src={user.img} alt={user.name} className="h-12 w-12 rounded-[18px] border-2 border-white/10 group-hover:border-indigo-500/50 transition-colors" />
                  <div className="flex flex-col">
                    <span className="text-[12px] font-black text-white uppercase tracking-wider">{user.name}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${
                      security.presence ? 'text-emerald-400 animate-pulse' : 'text-white/30'
                    }`}>
                      {security.presence ? 'AUTHORIZED' : 'SCANNING...'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-6">
              <div className={`${GLASS_BASE} ${CORNER_RADIUS} !py-4 !px-8 flex items-center gap-4`}>
                <div className="p-2 bg-blue-500/20 rounded-xl"><Thermometer size={18} className="text-blue-400" /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Ambient</span>
                  <span className="text-lg font-black text-white">{environment.temperature.toFixed(1)} °C</span>
                </div>
              </div>
              <div className={`${GLASS_BASE} ${CORNER_RADIUS} !py-4 !px-8 flex items-center gap-4`}>
                <div className="p-2 bg-amber-500/20 rounded-xl"><Flash size={18} className="text-amber-400" /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Load</span>
                  <span className="text-lg font-black text-white">{environment.power.toFixed(2)} kWh</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 ${BENTO_GAP}`}>
            
            {/* Lights - Bento Tile */}
            <div className={`${GLASS_BASE} ${CORNER_RADIUS} col-span-2 row-span-2 p-8`}>
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-2xl"><Lightbulb size={24} className="text-amber-500" /></div>
                  <span className="text-base font-black uppercase tracking-[0.3em] text-white">Lighting</span>
                </div>
                <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/5">
                  <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">
                    {lights.filter(l => l).length}/6 ON
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {lights.map((isOn, i) => (
                  <DeviceToggle 
                    key={i} icon={Lightbulb} label={`Array Unit ${i + 1}`} 
                    isOn={isOn} onToggle={() => handleToggle('light', i)} 
                    colorClass="bg-amber-500/20 text-amber-500"
                    glowColor="shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                  />
                ))}
              </div>
            </div>

            {/* Climate - Bento Tile */}
            <div className={`${GLASS_BASE} ${CORNER_RADIUS} col-span-2 p-8 flex flex-col justify-between`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-2xl"><Snowflake size={24} className="text-blue-500" /></div>
                  <span className="text-base font-black uppercase tracking-[0.3em] text-white">Climate</span>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-6">
                {ac.map((isOn, i) => (
                  <motion.div key={i} whileTap={{ scale: 0.95 }} onClick={() => handleToggle('ac', i)}
                    className={`p-6 rounded-[24px] border flex flex-col gap-6 cursor-pointer transition-all duration-700 ${
                      isOn ? 'bg-indigo-600 border-indigo-400 text-white shadow-2xl shadow-indigo-600/50' : 'bg-white/5 border-transparent text-white/30'
                    }`}
                  >
                    <Power size={26} /><span className="text-[12px] font-black uppercase tracking-[0.2em]">MODULE {i + 1}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Stats - Compact Tiles */}
            <div className={`${GLASS_BASE} ${CORNER_RADIUS} p-8 flex flex-col justify-between`}>
              <div className="flex justify-between text-white/30">
                <span className="text-[11px] font-black uppercase tracking-widest text-white/40">RH %</span>
                <Droplets size={18} className="text-blue-400" />
              </div>
              <div className="my-4 text-5xl font-light text-white">{environment.humidity}<span className="text-xl opacity-20 ml-2">%</span></div>
              <div className="h-14 w-full opacity-30">
                <ResponsiveContainer width="100%" height="100%"><AreaChart data={sparkData}><Area type="monotone" dataKey="val" stroke="#6366F1" fill="#6366F1" fillOpacity={0.2} strokeWidth={3} /></AreaChart></ResponsiveContainer>
              </div>
            </div>

            <div className={`${GLASS_BASE} ${CORNER_RADIUS} p-8 flex flex-col justify-between`}>
              <div className="flex justify-between text-white/30">
                <span className="text-[11px] font-black uppercase tracking-widest text-white/40">TEMP C</span>
                <Thermometer size={18} className="text-orange-500" />
              </div>
              <div className="my-4 text-5xl font-light text-white">{environment.temperature.toFixed(1)}<span className="text-xl opacity-20 ml-2">°</span></div>
              <div className="h-14 w-full opacity-30">
                <ResponsiveContainer width="100%" height="100%"><AreaChart data={sparkData}><Area type="monotone" dataKey="val" stroke="#F97316" fill="#F97316" fillOpacity={0.2} strokeWidth={3} /></AreaChart></ResponsiveContainer>
              </div>
            </div>

            {/* Fans - Bento Tile */}
            <div className={`${GLASS_BASE} ${CORNER_RADIUS} col-span-2 p-8`}>
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl"><Wind size={24} className="text-emerald-500" /></div>
                  <span className="text-base font-black uppercase tracking-[0.3em] text-white">Ventilation</span>
                </div>
                <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">{fans.filter(f => f).length}/4 ON</span>
              </div>
              <div className="grid grid-cols-2 gap-x-10">
                {fans.map((isOn, i) => (
                  <DeviceToggle 
                    key={i} icon={Fan} label={`Unit ${i + 1}`} 
                    isOn={isOn} onToggle={() => handleToggle('fan', i)} 
                    colorClass="bg-emerald-500/20 text-emerald-500"
                    glowColor="shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                  />
                ))}
              </div>
            </div>

            {/* Security - Bento Tile */}
            <div className={`${GLASS_BASE} ${CORNER_RADIUS} col-span-2 p-8`}>
              <div className="flex justify-between items-start mb-10">
                <div>
                  <span className="text-base font-black block uppercase tracking-[0.3em] mb-3 text-white">Security</span>
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${security.presence ? 'bg-emerald-500 animate-ping' : 'bg-white/20'}`}></div>
                    <span className={`text-[11px] font-black uppercase tracking-[0.3em] ${security.presence ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {security.presence ? 'AUTHORIZED' : 'SCANNING...'}
                    </span>
                  </div>
                </div>
                <div className={`h-16 w-16 rounded-[22px] border flex items-center justify-center transition-all duration-700 ${
                  security.presence ? 'bg-emerald-500 border-emerald-400 text-white shadow-2xl shadow-emerald-500/40' : 'bg-white/5 border-transparent text-white/10'
                }`}><ShieldCheck size={32} /></div>
              </div>
              <div className="flex gap-5">
                <button onClick={() => sendCommand('lab/security/control', { command: 'ARM' })} className="flex-1 py-4 px-6 bg-white text-black rounded-[20px] text-[11px] font-black uppercase tracking-[0.3em] hover:bg-red-600 hover:text-white transition-all shadow-2xl">ARM CORE</button>
                <button onClick={() => sendCommand('lab/security/control', { command: 'LOCK' })} className="flex-1 py-4 px-6 border border-white/10 rounded-[20px] text-[11px] font-black uppercase tracking-[0.3em] text-white hover:bg-indigo-600 transition-all">LOCK LAB</button>
              </div>
            </div>

            {/* Consumption - Bento Tile */}
            <div className={`${GLASS_BASE} ${CORNER_RADIUS} col-span-2 p-8 flex items-center justify-between`}>
              <div className="flex items-center gap-8">
                <div className="p-6 bg-indigo-500/10 rounded-[28px] text-indigo-400 border border-indigo-500/20 shadow-inner"><Flash size={40} /></div>
                <div className="flex flex-col">
                  <span className="block text-[11px] font-black text-white/30 uppercase tracking-[0.4em] mb-3">Live Consumption</span>
                  <span className="text-4xl font-black text-white italic tracking-tighter">
                    {environment.power.toFixed(2)} <span className="text-sm font-medium opacity-20 tracking-normal not-italic ml-2 text-white">kWh</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-emerald-500/10 px-6 py-3 rounded-2xl border border-emerald-500/20">
                <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse"></div>
                <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Normal</span>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
