import React from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell 
} from "recharts";
import { Users, Map, TrendingUp, Clock, Target, Activity } from "lucide-react";

const utilizationData = [
  { name: "Lab 101", usage: 85, peak: 95 },
  { name: "Lab 102", usage: 45, peak: 60 },
  { name: "Lab 103", usage: 65, peak: 80 },
  { name: "Office", usage: 30, peak: 40 },
  { name: "Storage", usage: 10, peak: 15 },
];

const hourlyPresence = [
  { time: "08:00", count: 2 },
  { time: "10:00", count: 12 },
  { time: "12:00", count: 15 },
  { time: "14:00", count: 14 },
  { time: "16:00", count: 8 },
  { time: "18:00", count: 3 },
];

const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];

export default function Occupancy() {
  return (
    <div className="space-y-10 pb-10">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase">Occupancy Intelligence</h1>
          <p className="text-xs font-bold text-white/30 uppercase tracking-[0.3em]">Real-time Presence & Spatial Analytics</p>
        </div>
        <div className="flex gap-4">
          <div className="industrial-card px-6 py-2 flex items-center gap-3">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-lg font-black tabular-nums">4 <span className="text-[10px] text-white/40">PRESENT</span></span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap Simulation Card */}
        <div className="industrial-card p-8 lg:col-span-2 min-h-[400px]">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <Map className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-black uppercase tracking-wider">Zone Heatmap</h2>
            </div>
            <div className="flex gap-2">
              <span className="status-badge bg-primary/10 text-primary">Live Scan</span>
            </div>
          </div>
          
          <div className="relative aspect-video rounded-2xl bg-white/5 border border-white/5 overflow-hidden flex items-center justify-center">
            {/* Mock Blueprint Overlay */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            <div className="absolute inset-10 border-2 border-white/10 rounded-xl grid grid-cols-3 grid-rows-2">
              <div className="border border-white/10 flex items-center justify-center bg-primary/20 animate-pulse">
                <span className="text-[10px] font-black text-primary">LAB 101: 85%</span>
              </div>
              <div className="border border-white/10 flex items-center justify-center">
                <span className="text-[10px] font-black text-white/20">LAB 102: 12%</span>
              </div>
              <div className="border border-white/10 flex items-center justify-center bg-warning/10">
                <span className="text-[10px] font-black text-warning">LAB 103: 45%</span>
              </div>
              <div className="border border-white/10 flex items-center justify-center">
                <span className="text-[10px] font-black text-white/20">STORAGE</span>
              </div>
              <div className="border border-white/10 flex items-center justify-center bg-primary/10">
                <span className="text-[10px] font-black text-primary">OFFICE</span>
              </div>
              <div className="border border-white/10 flex items-center justify-center">
                <span className="text-[10px] font-black text-white/20">CORRIDOR</span>
              </div>
            </div>
            <Activity className="h-12 w-12 text-primary/10" />
          </div>
        </div>

        {/* Distribution Card */}
        <div className="industrial-card p-8">
          <div className="flex items-center gap-3 mb-8">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-wider">Utilization Share</h2>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={utilizationData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="usage"
                >
                  {utilizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {utilizationData.map((entry, index) => (
              <div key={entry.name} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-[10px] font-black text-white/60 uppercase">{entry.name}</span>
                </div>
                <span className="text-[10px] font-black text-white">{entry.usage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Trend Graph */}
        <div className="industrial-card p-8">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-wider">Occupancy Trends (24h)</h2>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyPresence}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="count" stroke="#06b6d4" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Predictions Card */}
        <div className="industrial-card p-8">
          <div className="flex items-center gap-3 mb-8">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-wider">AI Usage Predictions</h2>
          </div>
          <div className="space-y-6">
            <PredictionItem label="Peak Usage Predicted" value="14:30 - 16:00" prob={92} />
            <PredictionItem label="Energy Savings Potential" value="2.4 kWh / day" prob={78} />
            <PredictionItem label="Next Maintenance Window" value="Sunday, 04:00" prob={85} />
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold text-white/40 leading-relaxed uppercase tracking-widest">
              Insight: Predictive models suggest Lab 101 will reach critical capacity in 45 minutes due to scheduled Chem-302 session.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PredictionItem({ label, value, prob }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black text-white/30 uppercase">{label}</span>
        <span className="text-xs font-black text-primary uppercase">{value}</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${prob}%` }} />
      </div>
    </div>
  );
}
