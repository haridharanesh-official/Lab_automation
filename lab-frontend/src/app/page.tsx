"use client";

import React, { useState, useEffect } from 'react';
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
  Zap, 
  Fan, 
  Lock,
  Wind,
  Navigation
} from 'lucide-react';

// Sample data for sparklines
const data = [
  { value: 40 }, { value: 30 }, { value: 45 }, { value: 35 }, 
  { value: 55 }, { value: 40 }, { value: 50 }
];

interface CameraState {
  camera_zone: string;
  face_detected: boolean;
  distance: number;
}

const Dashboard = () => {
  const [cameraState, setCameraState] = useState<CameraState>({
    camera_zone: "Workstation",
    face_detected: false,
    distance: 1.4
  });
  const [lightsOn, setLightsOn] = useState(false);
  const [fanOn, setFanOn] = useState(false);

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

  return (
    <div className="min-h-screen scrollbar-hide">
      
      {/* Top Status Pills */}
      <div className="flex flex-wrap gap-3 px-6 pt-6 mb-4">
        <div className="rounded-full bg-white/15 backdrop-blur-md px-4 py-2 border border-white/10 flex items-center gap-2">
          <Thermometer size={14} className="text-white/70" />
          <span className="text-xs font-bold text-white">Climate 72°</span>
        </div>
        <div className="rounded-full bg-white/15 backdrop-blur-md px-4 py-2 border border-white/10 flex items-center gap-2">
          <Lightbulb size={14} className={lightsOn ? "text-amber-400" : "text-white/70"} />
          <span className="text-xs font-bold text-white">Lights: {lightsOn ? '1' : '0'} On</span>
        </div>
        <div className="rounded-full bg-white/15 backdrop-blur-md px-4 py-2 border border-white/10 flex items-center gap-2">
          <Shield size={14} className={cameraState.face_detected ? "text-red-400" : "text-white/70"} />
          <span className="text-xs font-bold text-white">Radar: Active</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 pt-2">
        
        {/* Main Radar / Security Card (2x2) */}
        <div className="col-span-2 row-span-2 apple-glass rounded-[32px] p-6 relative flex flex-col items-center justify-center overflow-hidden">
          {/* Pulsing background for detection */}
          <AnimatePresence>
            {cameraState.face_detected && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 0.4, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute w-full h-full bg-radial from-red-500/50 to-transparent z-0"
              />
            )}
          </AnimatePresence>

          <div className="z-10 text-center">
            <motion.div 
              animate={{ opacity: cameraState.face_detected ? 1 : 0.7 }}
              className="text-8xl md:text-9xl font-extralight tracking-tighter text-white mb-2"
            >
              {cameraState.distance.toFixed(1)}<span className="text-3xl">m</span>
            </motion.div>
            <div className="flex items-center justify-center gap-2">
              <div className={`h-2 w-2 rounded-full ${cameraState.face_detected ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
              <span className="text-xs font-black uppercase tracking-widest text-white/50">
                {cameraState.face_detected ? 'Authorized Presence' : 'Secure Scanning'}
              </span>
            </div>
          </div>

          <div className="absolute top-6 left-6 p-3 bg-white/5 rounded-2xl border border-white/10">
            <Navigation size={24} className="text-white/70" />
          </div>
        </div>

        {/* Lab Temp Card */}
        <div className="apple-glass rounded-[32px] p-5 flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <Thermometer size={20} className="text-blue-400" />
            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Live</span>
          </div>
          <div className="text-center py-4">
            <span className="text-5xl font-bold text-white tracking-tight">24</span>
            <span className="text-xl font-medium text-blue-400 ml-1">°C</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Lab Temp</span>
            <div className="w-12 h-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Humidity Card */}
        <div className="apple-glass rounded-[32px] p-5 flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <Droplets size={20} className="text-cyan-400" />
            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Live</span>
          </div>
          <div className="text-center py-4">
            <span className="text-5xl font-bold text-white tracking-tight">42</span>
            <span className="text-xl font-medium text-cyan-400 ml-1">%</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Humidity</span>
            <div className="w-12 h-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Light Toggle */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setLightsOn(!lightsOn)}
          className={`apple-glass rounded-[32px] p-5 flex flex-col justify-between text-left transition-colors duration-500 ${
            lightsOn ? 'bg-amber-500/80 border-amber-400/50' : ''
          }`}
        >
          <Lightbulb size={24} className={lightsOn ? "text-white" : "text-amber-500"} />
          <div>
            <span className={`block text-xs font-black uppercase tracking-widest mb-1 ${lightsOn ? 'text-white/70' : 'text-white/30'}`}>
              Main Relay
            </span>
            <span className="text-xl font-bold text-white leading-tight">
              {lightsOn ? 'Lights Active' : 'Lights Off'}
            </span>
          </div>
        </motion.button>

        {/* Fan Toggle */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setFanOn(!fanOn)}
          className={`apple-glass rounded-[32px] p-5 flex flex-col justify-between text-left transition-colors duration-500 ${
            fanOn ? 'bg-blue-500/80 border-blue-400/50' : ''
          }`}
        >
          <Fan size={24} className={`${fanOn ? "text-white animate-spin" : "text-blue-500"}`} />
          <div>
            <span className={`block text-xs font-black uppercase tracking-widest mb-1 ${fanOn ? 'text-white/70' : 'text-white/30'}`}>
              Exhaust
            </span>
            <span className="text-xl font-bold text-white leading-tight">
              {fanOn ? 'Fan Running' : 'Fan Off'}
            </span>
          </div>
        </motion.button>

        {/* Power Usage (Small) */}
        <div className="apple-glass rounded-[32px] p-5 flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl">
            <Zap size={20} className="text-yellow-400" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-0.5">Energy</span>
            <span className="text-lg font-bold text-white">4.2<span className="text-xs ml-0.5 font-medium opacity-50">kW</span></span>
          </div>
        </div>

        {/* Lock Status (Small) */}
        <div className="apple-glass rounded-[32px] p-5 flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl">
            <Lock size={20} className="text-emerald-400" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-0.5">Entry</span>
            <span className="text-lg font-bold text-white">Secure</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
