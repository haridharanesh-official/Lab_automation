import React, { useState } from "react";
import { 
  ShieldAlert, AlertTriangle, Power, 
  Flame, Wind, Siren, History, 
  Lock, Unlock, ZapOff, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const safetyLogs = [
  { id: 1, time: "10:42:15", event: "Gas Sensor Calibration Check", status: "success" },
  { id: 2, time: "09:15:02", event: "Fire Suppression System Self-Test", status: "success" },
  { id: 3, time: "Yesterday", event: "Minor Gas Threshold Warning - Lab 101", status: "warning" },
  { id: 4, time: "02 May", event: "Scheduled Emergency Drill Completed", status: "info" },
];

export default function Safety() {
  const [isEvacuating, setIsEvacuating] = useState(false);
  const [isShutdown, setIsShutdown] = useState(false);

  return (
    <div className="space-y-10 pb-10">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase">Safety & Critical Monitoring</h1>
          <p className="text-xs font-bold text-white/30 uppercase tracking-[0.3em]">Emergency Protocols & Hazard Mitigation</p>
        </div>
        <div className="flex gap-4">
          <div className="status-badge bg-success/10 text-success border border-success/20 px-4 py-2">
            <CheckCircle2 className="h-4 w-4" />
            All Systems Nominal
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Core Safety Monitors */}
        <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <SafetyMonitorCard 
            title="Fire / Smoke" 
            status="Secure" 
            icon={Flame} 
            color="success" 
            desc="Optical & Heat Sensors: Online" 
          />
          <SafetyMonitorCard 
            title="Toxic Gas" 
            status="Nominal" 
            icon={Wind} 
            color="success" 
            desc="MQ2 / MQ135 Arrays: 120ppm" 
          />
          <SafetyMonitorCard 
            title="Unauthorized Access" 
            status="Locked" 
            icon={Lock} 
            color="primary" 
            desc="Biometric / RFID Logs: Clear" 
          />

          <div className="md:col-span-3 industrial-card p-10 bg-danger/5 border-danger/20">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="h-24 w-24 rounded-full bg-danger/20 border-4 border-danger/40 flex items-center justify-center animate-pulse">
                <Siren className="h-12 w-12 text-danger" />
              </div>
              <div className="flex-1 space-y-4 text-center md:text-left">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-danger">Master Emergency Override</h2>
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest max-w-xl">
                  Engaging the master override will immediately initiate evacuation protocols, trigger high-decibel alarms, and notify campus security. This action is logged and audited.
                </p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-4">
                  <button 
                    onClick={() => setIsEvacuating(!isEvacuating)}
                    className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      isEvacuating ? 'bg-danger text-white scale-105' : 'bg-white/5 text-danger border border-danger/20 hover:bg-danger/10'
                    }`}
                  >
                    {isEvacuating ? 'TERMINATE EVACUATION' : 'INITIATE EVACUATION'}
                  </button>
                  <button 
                    onClick={() => setIsShutdown(!isShutdown)}
                    className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      isShutdown ? 'bg-white text-black' : 'bg-white/5 text-white border border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ZapOff className="h-4 w-4" />
                      {isShutdown ? 'RESTORE POWER' : 'EMERGENCY SHUTDOWN'}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Safety Timeline */}
        <div className="industrial-card p-8 space-y-8">
          <div className="flex items-center gap-3">
            <History className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-wider">Safety Timeline</h2>
          </div>
          <div className="space-y-6">
            {safetyLogs.map(log => (
              <div key={log.id} className="relative pl-6 border-l border-white/10">
                <div className={`absolute -left-1.5 top-1 h-3 w-3 rounded-full border-2 border-background ${
                  log.status === 'success' ? 'bg-success' : log.status === 'warning' ? 'bg-warning' : 'bg-primary'
                }`} />
                <p className="text-[9px] font-black text-white/30 uppercase mb-1">{log.time}</p>
                <p className="text-[10px] font-bold text-white uppercase leading-relaxed">{log.event}</p>
              </div>
            ))}
          </div>
          <button className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
            Export Audit Log
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isEvacuating && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none border-[20px] border-danger/40 animate-alert"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SafetyMonitorCard({ title, status, icon: Icon, color, desc }: any) {
  const colorMap: any = {
    success: 'text-success bg-success/10 border-success/20',
    primary: 'text-primary bg-primary/10 border-primary/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    danger: 'text-danger bg-danger/10 border-danger/20',
  };

  return (
    <div className="industrial-card p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className={`status-badge ${colorMap[color]}`}>
          <span className={`h-1.5 w-1.5 rounded-full bg-current`} />
          {status.toUpperCase()}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-black uppercase tracking-tight mb-2">{title}</h3>
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{desc}</p>
      </div>
    </div>
  );
}
