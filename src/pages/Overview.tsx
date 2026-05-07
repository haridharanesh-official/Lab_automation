import React from "react";
import { useLabStore } from "@/lib/labStore";
import { EntityCard } from "@/components/lab/EntityCard";
import { 
  Building2, Cpu, Users, Bell, 
  ShieldAlert, Zap, ArrowUpRight, 
  ChevronRight, Activity
} from "lucide-react";

export default function Overview() {
  const { entities, areas } = useLabStore();
  
  // Aggregate Metrics
  const roomsOnline = areas.length;
  const activeDevices = Object.values(entities).filter(e => e.entity_id.startsWith("switch.") && e.state === true).length;
  const currentOccupancy = entities["sensor.occupancy_count"]?.state as number || 0;
  const openAlerts = 2; // Mock for now
  const dangerSensors = Object.values(entities).filter(e => e.attributes.status === "danger").length;
  const energyUsage = entities["sensor.system_energy"]?.state as number || 0;

  return (
    <div className="space-y-10">
      {/* Top Metric Header */}
      <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard label="Labs Online" value={roomsOnline} icon={Building2} trend="+1" />
        <MetricCard label="Active Systems" value={activeDevices} icon={Zap} trend={`${activeDevices}/12`} />
        <MetricCard label="Occupancy" value={currentOccupancy} icon={Users} status={currentOccupancy > 0 ? "active" : "idle"} />
        <MetricCard label="System Alerts" value={openAlerts} icon={Bell} status={openAlerts > 0 ? "warning" : "safe"} />
        <MetricCard label="Danger Level" value={dangerSensors} icon={ShieldAlert} status={dangerSensors > 0 ? "danger" : "safe"} />
        <MetricCard label="Energy Load" value={`${energyUsage}kW`} icon={Activity} />
      </section>

      {/* Lab Clusters */}
      {areas.map((area) => {
        const areaEntities = Object.values(entities).filter(e => e.attributes.area_id === area.id);
        const sensors = areaEntities.filter(e => e.entity_id.startsWith("sensor."));
        const switches = areaEntities.filter(e => e.entity_id.startsWith("switch."));
        const isOccupied = areaEntities.some(e => e.entity_id.includes("motion") && e.state === true);

        return (
          <section key={area.id} className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight uppercase">{area.name}</h2>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{area.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${isOccupied ? 'bg-success animate-pulse' : 'bg-white/10'}`} />
                  <span className="text-[10px] font-black text-white/40 uppercase">{isOccupied ? 'OCCUPIED' : 'VACANT'}</span>
                </div>
                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/20 hover:text-white">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {/* Sensors Row */}
              {sensors.map(e => <EntityCard key={e.entity_id} entity_id={e.entity_id} />)}
              {/* Switches Row */}
              {switches.map(e => <EntityCard key={e.entity_id} entity_id={e.entity_id} />)}
            </div>
          </section>
        );
      })}

      {/* System Integrity Notification */}
      <div className="industrial-card p-6 border-primary/20 bg-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-xl text-primary">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight">AI Diagnostic Protocol</h3>
            <p className="text-xs text-white/40 font-bold uppercase tracking-widest">System running at 98% efficiency. No anomalies detected in current cycle.</p>
          </div>
        </div>
        <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
          Generate Report
        </button>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, trend, status = "normal" }: any) {
  const isDanger = status === "danger";
  const isWarning = status === "warning";
  const isActive = status === "active";

  return (
    <div className={`industrial-card p-6 flex flex-col justify-between min-h-[140px] ${
      isDanger ? 'border-danger/40 bg-danger/5' : isWarning ? 'border-warning/40 bg-warning/5' : ''
    }`}>
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-lg ${
          isDanger ? 'bg-danger/20 text-danger' : isWarning ? 'bg-warning/20 text-warning' : 'bg-white/5 text-muted-foreground'
        }`}>
          <Icon className="h-4 w-4" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-[10px] font-black text-success">
            <ArrowUpRight className="h-3 w-3" />
            {trend}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <h3 className={`text-3xl font-black tracking-tighter tabular-nums ${
            isDanger ? 'text-danger' : isWarning ? 'text-warning' : isActive ? 'text-success' : 'text-white'
          }`}>
            {value}
          </h3>
        </div>
      </div>
    </div>
  );
}