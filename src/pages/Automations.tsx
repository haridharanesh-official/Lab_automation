import React from "react";
import { 
  Zap, Plus, Play, Pause, 
  Trash2, Settings2, Clock, 
  ArrowRight, ToggleLeft as Toggle, 
  ToggleRight, Cpu, Save, Code
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

const automations = [
  { 
    id: "auto_1", 
    name: "Gas Leak Protocol", 
    trigger: "sensor.gas > 600ppm", 
    action: "switch.exhaust ON, switch.power OFF", 
    enabled: true,
    lastRun: "2h ago"
  },
  { 
    id: "auto_2", 
    name: "Smart Board Energy Save", 
    trigger: "binary_sensor.motion == OFF (10m)", 
    action: "switch.smart_board OFF", 
    enabled: true,
    lastRun: "10m ago"
  },
  { 
    id: "auto_3", 
    name: "Morning Startup", 
    trigger: "08:00 AM", 
    action: "switch.main_lights ON, switch.ac ON (22°C)", 
    enabled: false,
    lastRun: "Never"
  },
];

export default function Automations() {
  return (
    <div className="space-y-10 pb-10">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase">Automation Engine</h1>
          <p className="text-xs font-bold text-white/30 uppercase tracking-[0.3em]">Neural Rule Processing & Scheduling</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]">
          <Plus className="h-4 w-4" />
          Create Rule
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Active Rules List */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Configured Logic Blocks</h2>
            <div className="flex gap-4">
              <span className="text-[10px] font-black text-primary uppercase">Active: 2</span>
              <span className="text-[10px] font-black text-white/30 uppercase">Inactive: 1</span>
            </div>
          </div>

          {automations.map(auto => (
            <div key={auto.id} className="industrial-card p-6 group">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${auto.enabled ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/20'}`}>
                      <Zap className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-tight">{auto.name}</h3>
                    <div className="ml-auto md:ml-0 status-badge bg-white/5 text-white/40">
                      Last: {auto.lastRun}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="px-3 py-1.5 rounded-md bg-white/5 border border-white/5 text-[9px] font-mono text-primary flex items-center gap-2">
                      <Cpu className="h-3 w-3" /> {auto.trigger}
                    </div>
                    <ArrowRight className="h-3 w-3 text-white/20" />
                    <div className="px-3 py-1.5 rounded-md bg-white/5 border border-white/5 text-[9px] font-mono text-success flex items-center gap-2">
                      <Code className="h-3 w-3" /> {auto.action}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                  <Switch checked={auto.enabled} />
                  <div className="flex gap-1">
                    <button className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-colors">
                      <Settings2 className="h-4 w-4" />
                    </button>
                    <button className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-danger transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Engine Stats & Scheduling */}
        <div className="space-y-6">
          <div className="industrial-card p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Settings2 className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-black uppercase tracking-wider">Engine Control</h2>
            </div>
            <div className="space-y-4">
              <EngineToggle label="Global Rules" active />
              <EngineToggle label="Manual Overrides" />
              <EngineToggle label="Cloud Sync" active />
            </div>
            <div className="pt-4 border-t border-white/5">
              <button className="w-full py-3 bg-primary/10 border border-primary/20 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center justify-center gap-2">
                <Save className="h-3.5 w-3.5" />
                Commit Changes
              </button>
            </div>
          </div>

          <div className="industrial-card p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-black uppercase tracking-wider">Upcoming Cycles</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black uppercase">
                <span className="text-white/40 tracking-widest">Next Shift Change</span>
                <span className="text-white">16:00</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase">
                <span className="text-white/40 tracking-widest">Backup Sequence</span>
                <span className="text-white">00:00</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase">
                <span className="text-white/40 tracking-widest">Uptime Maintenance</span>
                <span className="text-white">Sun 02:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EngineToggle({ label, active }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-black text-white/60 uppercase">{label}</span>
      <div className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-white/10'}`} />
    </div>
  );
}