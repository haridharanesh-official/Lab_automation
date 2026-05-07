import React from "react";
import { useLabStore } from "@/lib/labStore";
import { EntityCard } from "@/components/lab/EntityCard";
import { Cpu, Search, Filter, Grid, List } from "lucide-react";

export default function Devices() {
  const { entities } = useLabStore();
  const allDevices = Object.values(entities);

  return (
    <div className="space-y-10 pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase">System Entities</h1>
          <p className="text-xs font-bold text-white/30 uppercase tracking-[0.3em]">Device Management & Entity Registry</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
            <input 
              placeholder="Search entity ID..." 
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-xs focus:border-primary/50 outline-none transition-all"
            />
          </div>
          <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white"><Filter className="h-5 w-5" /></button>
          <div className="flex bg-white/5 border border-white/10 rounded-lg p-1">
            <button className="p-1.5 bg-primary text-primary-foreground rounded-md shadow-lg"><Grid className="h-4 w-4" /></button>
            <button className="p-1.5 text-white/40 hover:text-white"><List className="h-4 w-4" /></button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {allDevices.map(e => (
          <EntityCard key={e.entity_id} entity_id={e.entity_id} />
        ))}
      </div>

      <div className="industrial-card p-10 flex flex-col items-center justify-center border-dashed border-white/10 bg-transparent">
        <Cpu className="h-10 w-10 text-white/10 mb-4" />
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">No more devices registered in current subnet</p>
        <button className="mt-6 px-6 py-2 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/5 hover:text-white transition-all">
          Register New Entity
        </button>
      </div>
    </div>
  );
}