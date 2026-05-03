"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  Sun, Cloud, Home, Camera, Settings, Menu, 
  Grid, Bell, User as UserIcon, Lock, Unlock,
  Lightbulb, Thermometer, Wind, Zap, 
  ShieldCheck, ArrowRight, Power, HelpCircle,
  MoreVertical, Search, Zap as Flash, Monitor
} from 'lucide-react';

// Mock Data
const tempHistory = [
  { val: 72 }, { val: 72.5 }, { val: 72.2 }, { val: 73 }, { val: 72.8 }
];

const humidityHistory = [
  { val: 40 }, { val: 42 }, { val: 41 }, { val: 43 }, { val: 42 }
];

const users = [
  { name: "Alex", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex", status: "HOME" },
  { name: "Svetik", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Svetik", status: "HOME" },
  { name: "Evan", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Evan", status: "TESLA" },
  { name: "Alarm", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alarm", status: "DISARM" },
];

const Dashboard = () => {
  const [lights, setLights] = useState({ chandelier: true, kitchen: false, garage: false, bedroom: true });
  const [locks, setLocks] = useState({ back: true, front: false });

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-[#1a242f]">
      
      {/* Sidebar */}
      <aside className="w-16 bg-white flex flex-col items-center py-4 border-r border-slate-200">
        <div className="sidebar-icon mb-6">
          <Menu size={24} />
        </div>
        <div className="space-y-4 flex-1">
          <div className="sidebar-icon bg-slate-100 text-slate-900"><Grid size={22} /></div>
          <div className="sidebar-icon"><UserIcon size={22} /></div>
          <div className="sidebar-icon"><Bell size={22} /></div>
          <div className="sidebar-icon"><Search size={22} /></div>
          <div className="sidebar-icon"><Monitor size={22} /></div>
          <div className="sidebar-icon"><Settings size={22} /></div>
        </div>
        <div className="mt-auto space-y-4">
          <div className="sidebar-icon"><HelpCircle size={22} /></div>
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
            A
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Navbar */}
        <nav className="h-12 bg-slate-800/50 backdrop-blur flex items-center px-4 gap-6">
          <div className="sidebar-icon text-white hover:bg-white/10"><Home size={20} /></div>
          <div className="text-white/60 text-[10px] font-bold tracking-widest uppercase cursor-pointer hover:text-white transition-colors">Home</div>
          <div className="sidebar-icon text-white hover:bg-white/10"><Camera size={20} /></div>
          <div className="text-white/60 text-[10px] font-bold tracking-widest uppercase cursor-pointer hover:text-white transition-colors">Test</div>
          <div className="ml-auto flex items-center gap-2">
            <div className="sidebar-icon text-white"><MoreVertical size={20} /></div>
          </div>
        </nav>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          
          {/* User Avatars */}
          <div className="flex justify-center gap-6 mb-8">
            {users.map(user => (
              <div key={user.name} className="flex flex-col items-center gap-1">
                <div className="relative">
                  <img src={user.img} alt={user.name} className="h-12 w-12 rounded-full border-2 border-white bg-slate-100" />
                  <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[8px] font-black ${
                    user.status === 'HOME' ? 'bg-red-500 text-white' : 'bg-slate-700 text-white'
                  }`}>
                    {user.status}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-tighter">{user.name}</span>
              </div>
            ))}
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
            
            {/* Weather Card */}
            <div className="ha-card col-span-2 row-span-2 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <Sun size={48} className="text-amber-500" />
                <div className="text-right">
                  <span className="text-6xl font-light">46<span className="text-2xl font-normal opacity-50">°F</span></span>
                </div>
              </div>
              <div className="grid grid-cols-5 mt-6 text-center">
                {['SAT', 'SUN', 'MON', 'TUE', 'WED'].map((day, i) => (
                  <div key={day} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400">{day}</span>
                    <Cloud size={16} className="text-blue-400" />
                    <span className="text-xs font-bold text-slate-700">{63-i}°</span>
                    <span className="text-[10px] text-slate-400">{25+i}°</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tesla Stats */}
            <div className="ha-card flex flex-col justify-between">
              <div className="flex justify-between text-slate-400">
                <span className="text-xs font-bold">Tesla Range</span>
                <Monitor size={14} />
              </div>
              <div className="my-2">
                <span className="text-2xl font-light">236.31 <span className="text-xs opacity-50">mi</span></span>
              </div>
              <div className="h-10 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tempHistory}>
                    <Area type="monotone" dataKey="val" stroke="#f59e0b" fill="#fef3c7" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="ha-card flex flex-col justify-between">
              <div className="flex justify-between text-slate-400">
                <span className="text-xs font-bold">Tesla Battery</span>
                <Flash size={14} />
              </div>
              <div className="my-2 text-2xl font-light">79 <span className="text-xs opacity-50">%</span></div>
              <div className="flex gap-0.5 h-10 items-end">
                {[4, 6, 8, 5, 10, 7, 9, 10].map((h, i) => (
                  <div key={i} className="bg-blue-400 flex-1 rounded-t-sm" style={{ height: `${h*10}%` }}></div>
                ))}
              </div>
            </div>

            {/* Emma's Room */}
            <div className="ha-card flex flex-col justify-between">
              <div className="flex justify-between text-slate-400">
                <span className="text-xs font-bold italic">Emma's Room</span>
                <Thermometer size={14} />
              </div>
              <div className="my-2 text-2xl font-light">72.7 <span className="text-xs opacity-50">°F</span></div>
              <div className="h-10 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tempHistory}>
                    <Area type="monotone" dataKey="val" stroke="#f59e0b" fill="#fef3c7" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="ha-card flex flex-col justify-between">
              <div className="flex justify-between text-slate-400">
                <span className="text-xs font-bold">Living Room</span>
                <Thermometer size={14} />
              </div>
              <div className="my-2 text-2xl font-light">73.6 <span className="text-xs opacity-50">°F</span></div>
              <div className="h-10 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={humidityHistory}>
                    <Area type="monotone" dataKey="val" stroke="#3b82f6" fill="#dbeafe" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Locks Card */}
            <div className="ha-card col-span-2 row-span-1">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold">Locks</span>
                <div className="h-4 w-8 bg-slate-200 rounded-full relative">
                  <div className="absolute right-0.5 top-0.5 h-3 w-3 bg-white rounded-full shadow"></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock size={16} className="text-slate-400" />
                    <span className="text-xs font-medium">Back Door</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unlock</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Unlock size={16} className="text-slate-400" />
                    <span className="text-xs font-medium">Front Door</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unlock</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 col-span-2 gap-4">
              <div className="ha-card flex flex-col items-center justify-center gap-2 p-2 group cursor-pointer hover:bg-slate-50">
                <motion.div whileTap={{ scale: 0.9 }} className="text-blue-500">
                  <Cloud size={24} />
                </motion.div>
                <span className="text-[10px] font-bold text-slate-600 text-center">Good Night</span>
              </div>
              <div className="ha-card flex flex-col items-center justify-center gap-2 p-2 group cursor-pointer hover:bg-slate-50">
                <motion.div whileTap={{ scale: 0.9 }} className="text-amber-500">
                  <Home size={24} />
                </motion.div>
                <span className="text-[10px] font-bold text-slate-600 text-center">Arrive Home</span>
              </div>
              <div className="ha-card flex flex-col items-center justify-center gap-2 p-2 group cursor-pointer hover:bg-slate-50">
                <motion.div whileTap={{ scale: 0.9 }} className="text-indigo-500">
                  <ArrowRight size={24} />
                </motion.div>
                <span className="text-[10px] font-bold text-slate-600 text-center">Leave Home</span>
              </div>
            </div>

            {/* Lights List */}
            <div className="ha-card col-span-2 row-span-1">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold">Lights</span>
                <div className="h-4 w-8 bg-blue-600 rounded-full relative">
                  <div className="absolute right-0.5 top-0.5 h-3 w-3 bg-white rounded-full shadow"></div>
                </div>
              </div>
              <div className="space-y-4">
                {Object.keys(lights).map(light => (
                  <div key={light} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lightbulb size={16} className={lights[light as keyof typeof lights] ? "text-amber-400" : "text-slate-300"} />
                      <span className="text-xs font-medium capitalize">{light}</span>
                    </div>
                    <div 
                      onClick={() => setLights(prev => ({ ...prev, [light]: !prev[light as keyof typeof lights] }))}
                      className={`h-4 w-8 rounded-full relative cursor-pointer transition-colors ${
                        lights[light as keyof typeof lights] ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    >
                      <motion.div 
                        animate={{ x: lights[light as keyof typeof lights] ? 16 : 2 }}
                        className="absolute top-0.5 h-3 w-3 bg-white rounded-full shadow"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Humidity Card */}
            <div className="ha-card col-span-2 row-span-1 flex flex-col">
              <div className="flex justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold">Home Humidity</span>
                <Droplets size={14} />
              </div>
              <div className="my-1 text-2xl font-light">42 <span className="text-xs opacity-50">%</span></div>
              <div className="mt-auto h-16 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tempHistory}>
                    <Area type="stepAfter" dataKey="val" stroke="#f59e0b" fill="#fef3c7" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-amber-400"></div>
                  <span className="text-[10px] text-slate-400 font-bold">Home</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-orange-400"></div>
                  <span className="text-[10px] text-slate-400 font-bold">Outside</span>
                </div>
              </div>
            </div>

            {/* Large Thermostat Gauge */}
            <div className="ha-card col-span-2 row-span-2 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-4 right-4 text-slate-400"><MoreVertical size={16} /></div>
              
              {/* Circular Gauge */}
              <div className="relative h-48 w-48 flex items-center justify-center">
                <svg className="h-full w-full rotate-[-90deg]">
                  <circle cx="96" cy="96" r="88" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                  <circle cx="96" cy="96" r="88" fill="none" stroke="#f59e0b" strokeWidth="8" strokeDasharray="552" strokeDashoffset="138" strokeLinecap="round" />
                  <circle cx="184" cy="96" r="4" fill="#f59e0b" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-light">73<span className="text-xl font-normal opacity-50 ml-1">°F</span></span>
                  <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest text-center">
                    73<br />Idle - temp
                  </div>
                </div>
              </div>

              {/* Bottom Icons */}
              <div className="flex gap-6 mt-6 text-slate-300">
                <Wind size={20} className="hover:text-blue-400 cursor-pointer" />
                <Flash size={20} className="text-orange-500" />
                <Zap size={20} className="hover:text-blue-400 cursor-pointer" />
                <Power size={20} className="hover:text-red-400 cursor-pointer" />
              </div>
            </div>

            {/* Alarm Card */}
            <div className="ha-card col-span-2 row-span-1">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-sm font-bold block">Home Alarm</span>
                </div>
                <div className="h-8 w-8 rounded-full border-2 border-emerald-500 flex items-center justify-center text-emerald-500">
                  <ShieldCheck size={20} />
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 py-2 px-3 border border-slate-200 rounded text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50">
                  ARM HOME
                </button>
                <button className="flex-1 py-2 px-3 border border-slate-200 rounded text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50">
                  ARM AWAY
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
