"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  Sun, Cloud, Home, Camera, Settings, Menu, 
  Grid, Bell, User as UserIcon, Lock, Unlock,
  Lightbulb, Thermometer, Wind, Zap, 
  ShieldCheck, ArrowRight, Power, HelpCircle,
  MoreVertical, Search, Zap as Flash, Monitor,
  Droplets, Fan, Snowflake, Cpu
} from 'lucide-react';

// Mock Data
const tempHistory = [
  { val: 24 }, { val: 24.2 }, { val: 24.1 }, { val: 24.3 }, { val: 24.2 }
];

const users = [
  { name: "Prithic", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Prithic", status: "LAB" },
  { name: "System", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bot", status: "AUTO" },
  { name: "Security", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Guard", status: "ACTIVE" },
];

const Dashboard = () => {
  // Device States
  const [lights, setLights] = useState(Array(6).fill(false));
  const [fans, setFans] = useState(Array(4).fill(false));
  const [acs, setAcs] = useState(Array(2).fill(false));

  const toggleDevice = (type: 'light' | 'fan' | 'ac', index: number) => {
    if (type === 'light') {
      const newLights = [...lights];
      newLights[index] = !newLights[index];
      setLights(newLights);
    } else if (type === 'fan') {
      const newFans = [...fans];
      newFans[index] = !newFans[index];
      setFans(newFans);
    } else if (type === 'ac') {
      const newAcs = [...acs];
      newAcs[index] = !newAcs[index];
      setAcs(newAcs);
    }
  };

  const DeviceToggle = ({ icon: Icon, label, isOn, onToggle, colorClass }: any) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isOn ? colorClass : 'bg-slate-50 text-slate-300'}`}>
          <Icon size={16} className={isOn ? 'animate-pulse' : ''} />
        </div>
        <span className="text-xs font-medium text-slate-600">{label}</span>
      </div>
      <div 
        onClick={onToggle}
        className={`h-5 w-10 rounded-full relative cursor-pointer transition-colors duration-300 ${
          isOn ? 'bg-blue-600' : 'bg-slate-200'
        }`}
      >
        <motion.div 
          animate={{ x: isOn ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 h-3 w-3 bg-white rounded-full shadow-sm"
        />
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-[#1a242f]">
      
      {/* Sidebar */}
      <aside className="w-16 bg-white flex flex-col items-center py-4 border-r border-slate-200 hidden md:flex">
        <div className="sidebar-icon mb-6">
          <Menu size={24} />
        </div>
        <div className="space-y-4 flex-1">
          <div className="sidebar-icon bg-slate-100 text-slate-900"><Grid size={22} /></div>
          <div className="sidebar-icon"><UserIcon size={22} /></div>
          <div className="sidebar-icon"><Flash size={22} /></div>
          <div className="sidebar-icon"><Cpu size={22} /></div>
          <div className="sidebar-icon"><Settings size={22} /></div>
        </div>
        <div className="mt-auto space-y-4">
          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
            P
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Navbar */}
        <nav className="h-14 bg-slate-800/40 backdrop-blur-md flex items-center px-6 gap-8 border-b border-white/5">
          <div className="flex items-center gap-2 text-white">
            <Home size={18} className="text-blue-400" />
            <span className="text-xs font-black uppercase tracking-widest">IOT LAB CORE</span>
          </div>
          <div className="hidden md:flex gap-6">
            <span className="text-white text-[10px] font-bold tracking-[0.2em] uppercase cursor-pointer border-b-2 border-blue-500 pb-4 mt-4">Dashboard</span>
            <span className="text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase cursor-pointer hover:text-white transition-colors pb-4 mt-4">Automation</span>
            <span className="text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase cursor-pointer hover:text-white transition-colors pb-4 mt-4">Vision</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live</span>
          </div>
        </nav>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          
          {/* Status Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-4">
              {users.map(user => (
                <div key={user.name} className="flex items-center gap-2 bg-white/5 p-1 pr-4 rounded-full border border-white/10">
                  <img src={user.img} alt={user.name} className="h-8 w-8 rounded-full border border-white/20" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-white uppercase">{user.name}</span>
                    <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">{user.status}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <div className="ha-card py-2 px-4 bg-white/5 border-white/10 text-white flex items-center gap-2">
                <Thermometer size={14} className="text-blue-400" />
                <span className="text-xs font-bold">24.2°C</span>
              </div>
              <div className="ha-card py-2 px-4 bg-white/5 border-white/10 text-white flex items-center gap-2">
                <Flash size={14} className="text-amber-400" />
                <span className="text-xs font-bold">4.2kW</span>
              </div>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
            
            {/* Primary Controls (Lights) */}
            <div className="ha-card col-span-2 row-span-2">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Lightbulb size={18} className="text-amber-400" />
                  <span className="text-sm font-bold uppercase tracking-widest">Lab Lighting</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{lights.filter(l => l).length}/6 ON</span>
              </div>
              <div className="space-y-1">
                {lights.map((isOn, i) => (
                  <DeviceToggle 
                    key={i} 
                    icon={Lightbulb} 
                    label={`Light Row ${i + 1}`} 
                    isOn={isOn} 
                    onToggle={() => toggleDevice('light', i)} 
                    colorClass="bg-amber-100 text-amber-600"
                  />
                ))}
              </div>
            </div>

            {/* Climate Control (ACs) */}
            <div className="ha-card col-span-2 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Snowflake size={18} className="text-blue-400" />
                  <span className="text-sm font-bold uppercase tracking-widest">Air Conditioning</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {acs.map((isOn, i) => (
                  <motion.div 
                    key={i}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleDevice('ac', i)}
                    className={`p-4 rounded-xl border flex flex-col gap-3 cursor-pointer transition-all duration-300 ${
                      isOn ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-50 border-slate-100 text-slate-400'
                    }`}
                  >
                    <Power size={20} />
                    <span className="text-xs font-black uppercase tracking-widest">AC UNIT {i + 1}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Environment Stats */}
            <div className="ha-card flex flex-col justify-between">
              <div className="flex justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-widest">Humidity</span>
                <Droplets size={14} className="text-blue-400" />
              </div>
              <div className="my-2">
                <span className="text-3xl font-light">42 <span className="text-xs opacity-50">%</span></span>
              </div>
              <div className="h-10 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tempHistory}>
                    <Area type="monotone" dataKey="val" stroke="#3b82f6" fill="#dbeafe" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="ha-card flex flex-col justify-between">
              <div className="flex justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-widest">Temperature</span>
                <Thermometer size={14} className="text-orange-400" />
              </div>
              <div className="my-2 text-3xl font-light">24.2 <span className="text-xs opacity-50">°C</span></div>
              <div className="h-10 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tempHistory}>
                    <Area type="monotone" dataKey="val" stroke="#f97316" fill="#ffedd5" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Fan Controls (4 Fans) */}
            <div className="ha-card col-span-2 row-span-1">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Wind size={18} className="text-blue-500" />
                  <span className="text-sm font-bold uppercase tracking-widest">Ventilation Fans</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{fans.filter(f => f).length}/4 ON</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6">
                {fans.map((isOn, i) => (
                  <DeviceToggle 
                    key={i} 
                    icon={Fan} 
                    label={`Fan ${i + 1}`} 
                    isOn={isOn} 
                    onToggle={() => toggleDevice('fan', i)} 
                    colorClass="bg-blue-100 text-blue-600"
                  />
                ))}
              </div>
            </div>

            {/* Alarm/Security Card */}
            <div className="ha-card col-span-2 row-span-1">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-sm font-bold block uppercase tracking-widest mb-1">Security Status</span>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Authorized</span>
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-sm">
                  <ShieldCheck size={24} />
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 py-2.5 px-3 bg-slate-900 text-white rounded-lg text-[9px] font-bold uppercase tracking-[0.2em] hover:bg-slate-800 transition-colors">
                  ARM SYSTEM
                </button>
                <button className="flex-1 py-2.5 px-3 border border-slate-200 rounded-lg text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-50 transition-colors">
                  LOCK LAB
                </button>
              </div>
            </div>

            {/* Power Monitoring */}
            <div className="ha-card col-span-2 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-amber-50 rounded-2xl text-amber-500">
                  <Flash size={28} />
                </div>
                <div>
                  <span className="block text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Consumption</span>
                  <span className="text-2xl font-bold text-slate-700 italic">4.28 <span className="text-xs font-medium opacity-50 tracking-normal not-italic">kWh</span></span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full">
                <ArrowRight size={14} className="text-emerald-500" />
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Normal Range</span>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
