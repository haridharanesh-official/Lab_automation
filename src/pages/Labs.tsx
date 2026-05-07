import React from "react";
import { useLabStore } from "@/lib/labStore";
import { FlaskConical, MapPin, Layers, Settings, ChevronRight } from "lucide-react";

export default function Labs() {
  const { areas } = useLabStore();

  return (
    <div className="space-y-10 pb-10">
      <header>
        <h1 className="text-3xl font-black tracking-tight uppercase">Laboratory Directory</h1>
        <p className="text-xs font-bold text-white/30 uppercase tracking-[0.3em]">Facility Management & Sector Mapping</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {areas.map(area => (
          <div key={area.id} className="industrial-card p-8 group cursor-pointer hover:border-primary/50 transition-all">
            <div className="flex gap-8">
              <div className="h-24 w-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FlaskConical className="h-10 w-10 text-primary" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-white">{area.name}</h2>
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">{area.description}</p>
                  </div>
                  <button className="p-2 bg-white/5 rounded-lg text-white/20 group-hover:text-primary transition-colors">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                  <LabStat label="Active Entities" value="12" />
                  <LabStat label="Access Level" value="L3" color="text-warning" />
                  <LabStat label="Subsystems" value="4" />
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="industrial-card p-8 border-dashed border-white/10 bg-transparent flex items-center justify-center gap-4 group cursor-pointer hover:bg-white/5 transition-all">
          <Layers className="h-6 w-6 text-white/20" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 group-hover:text-white transition-colors">Provision New Sector</span>
        </div>
      </div>
    </div>
  );
}

function LabStat({ label, value, color = "text-white" }: any) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">{label}</p>
      <p className={`text-sm font-black uppercase ${color}`}>{value}</p>
    </div>
  );
}
