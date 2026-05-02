"use client";

import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import { 
  Shield, 
  Scan, 
  Activity, 
  Thermometer, 
  Lightbulb, 
  Cpu, 
  Settings, 
  UserCheck,
  AlertCircle
} from 'lucide-react';

interface CameraState {
  camera_zone: string;
  face_detected: boolean;
  timestamp?: string;
}

const Dashboard = () => {
  const [cameraState, setCameraState] = useState<CameraState>({
    camera_zone: "Workstation",
    face_detected: false
  });
  const [relayState, setRelayState] = useState(false);
  const [temp, setTemp] = useState(24.5);

  useEffect(() => {
    const client = mqtt.connect('ws://localhost:9001');

    client.on('connect', () => {
      client.subscribe('lab/security/camera');
    });

    client.on('message', (topic, message) => {
      if (topic === 'lab/security/camera') {
        const data = JSON.parse(message.toString());
        setCameraState(data);
      }
    });

    return () => {
      client.end();
    };
  }, []);

  return (
    <div className="min-h-screen p-6 md:p-10 animated-bg scrollbar-hide">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase">
            Smart Lab <span className="text-blue-500">Core</span>
          </h1>
          <p className="text-slate-400 mt-2 font-medium tracking-wide">Autonomous Infrastructure Dashboard</p>
        </div>
        <div className="hidden md:flex gap-4">
          <div className="glass-card rounded-2xl px-6 py-3 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-sm font-bold tracking-widest text-slate-300">SYSTEM ONLINE</span>
          </div>
        </div>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-auto md:grid-rows-2 gap-6">
        
        {/* Main Camera/Radar - Bento Piece (2x2) */}
        <div 
          className={`md:col-span-2 md:row-span-2 glass-card rounded-[40px] p-8 flex flex-col justify-between group overflow-hidden relative ${
            cameraState.face_detected 
              ? 'ring-2 ring-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.2)]' 
              : ''
          }`}
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            {cameraState.face_detected ? <UserCheck size={200} /> : <Scan size={200} />}
          </div>

          <div className="z-10">
            <div className="flex justify-between items-start mb-10">
              <div className="p-4 bg-white/5 rounded-3xl border border-white/10">
                <Shield className={cameraState.face_detected ? "text-emerald-400" : "text-slate-400"} size={32} />
              </div>
              <div className={`px-5 py-2 rounded-full text-xs font-black tracking-widest uppercase ${
                cameraState.face_detected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-500'
              }`}>
                {cameraState.face_detected ? 'Authorized Presence' : 'Scanning Zone'}
              </div>
            </div>
            
            <h2 className="text-4xl font-bold text-white mb-2">Workstation Vision</h2>
            <p className="text-slate-400 text-lg">Active monitor for Main Lab Entry</p>
          </div>

          <div className="z-10 flex gap-4 mt-10">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
              <span className="block text-slate-500 text-xs font-bold uppercase mb-2">Zone Status</span>
              <span className={`text-xl font-bold ${cameraState.face_detected ? 'text-emerald-400' : 'text-slate-300'}`}>
                {cameraState.face_detected ? 'OCCUPIED' : 'SECURE'}
              </span>
            </div>
            <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
              <span className="block text-slate-500 text-xs font-bold uppercase mb-2">Latency</span>
              <span className="text-xl font-bold text-slate-300">12ms</span>
            </div>
          </div>
        </div>

        {/* AI Assistant Bento (1x1) */}
        <div className="glass-card rounded-[40px] p-8 bg-purple-900/10 border-purple-500/20 group hover:bg-purple-900/20 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30">
              <Cpu className="text-purple-400" size={24} />
            </div>
            <span className="text-purple-400 text-xs font-bold tracking-widest">AI CORE</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Smart Assistant</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Neural control engine active and ready.</p>
          </div>
          <button className="mt-8 py-4 bg-purple-500 text-white rounded-2xl font-bold hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/20">
            Launch AI
          </button>
        </div>

        {/* Environment Card (1x1) */}
        <div className="glass-card rounded-[40px] p-8 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30">
              <Thermometer className="text-blue-400" size={24} />
            </div>
            <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></div>
          </div>
          <div>
            <div className="flex items-end gap-1 mb-2">
              <span className="text-5xl font-black text-white">{temp}</span>
              <span className="text-2xl font-bold text-blue-400 mb-1">°C</span>
            </div>
            <p className="text-slate-400 text-sm font-medium tracking-wide">Workstation Temp</p>
          </div>
          <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-[65%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
          </div>
        </div>

        {/* Relay Controls (2x1) */}
        <div className="md:col-span-2 glass-card rounded-[40px] p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/30">
                <Lightbulb className={relayState ? "text-amber-400" : "text-slate-500"} size={24} />
              </div>
              <h3 className="text-2xl font-bold text-white">Power Control</h3>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setRelayState(!relayState)}
              className={`p-6 rounded-3xl border transition-all duration-500 text-left ${
                relayState 
                  ? 'bg-amber-500/20 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <span className={`block text-xs font-bold uppercase tracking-widest mb-2 ${relayState ? 'text-amber-400' : 'text-slate-500'}`}>
                Main Lights
              </span>
              <span className={`text-xl font-bold ${relayState ? 'text-white' : 'text-slate-400'}`}>
                {relayState ? 'SYSTEM ON' : 'SYSTEM OFF'}
              </span>
            </button>
            
            <button className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left group">
              <span className="block text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Exhaust Fan</span>
              <span className="text-xl font-bold text-slate-400 group-hover:text-slate-300">OFFLINE</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
