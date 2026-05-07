import React from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line,
  AreaChart, Area, Cell, PieChart, Pie
} from "recharts";
import { 
  BarChart3, TrendingUp, Zap, Activity, 
  Clock, Download, Filter, Calendar
} from "lucide-react";

const energyData = [
  { day: "Mon", load: 4.2 },
  { day: "Tue", load: 3.8 },
  { day: "Wed", load: 5.1 },
  { day: "Thu", load: 4.6 },
  { day: "Fri", load: 6.2 },
  { day: "Sat", load: 2.1 },
  { day: "Sun", load: 1.8 },
];

const deviceUsage = [
  { name: "HVAC", value: 45 },
  { name: "Lighting", value: 25 },
  { name: "Processing", value: 20 },
  { name: "Security", value: 10 },
];

const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#6366f1'];

export default function Analytics() {
  return (
    <div className="space-y-10 pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase">Operational Analytics</h1>
          <p className="text-xs font-bold text-white/30 uppercase tracking-[0.3em]">System Performance & Resource Intelligence</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/10 flex items-center gap-2">
            <Filter className="h-3 w-3" /> Filter
          </button>
          <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/10 flex items-center gap-2">
            <Calendar className="h-3 w-3" /> Last 7 Days
          </button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2">
            <Download className="h-3 w-3" /> Export Data
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Energy Chart */}
        <div className="xl:col-span-2 industrial-card p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-black uppercase tracking-wider">Load Distribution (kWh)</h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-white/30 uppercase mb-1">Avg Weekly Load</p>
              <h4 className="text-xl font-black text-primary">3.98 <span className="text-[10px] opacity-40">kWh</span></h4>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={energyData}>
                <XAxis dataKey="day" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }} 
                />
                <Bar dataKey="load" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Share */}
        <div className="industrial-card p-8 flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-wider">Device Power Share</h2>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceUsage}
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deviceUsage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            {deviceUsage.map((entry, index) => (
              <div key={entry.name} className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-[10px] font-black text-white/40 uppercase">{entry.name}</span>
                </div>
                <p className="text-xs font-black text-white">{entry.value}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <InsightCard 
          title="Automation Efficiency" 
          value="94%" 
          desc="Rules processed without manual override" 
          icon={TrendingUp}
        />
        <InsightCard 
          title="Peak Load Period" 
          value="15:42" 
          desc="Highest system strain recorded on Friday" 
          icon={Clock}
        />
        <InsightCard 
          title="System Health" 
          value="STABLE" 
          desc="99.9% uptime across all lab segments" 
          icon={Activity}
        />
        <InsightCard 
          title="AI Power Savings" 
          value="12.4%" 
          desc="Reduction in standby load via prediction" 
          icon={BarChart3}
        />
      </div>
    </div>
  );
}

function InsightCard({ title, value, desc, icon: Icon }: any) {
  return (
    <div className="industrial-card p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="p-2 bg-white/5 rounded-lg text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div>
        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">{title}</h3>
        <p className="text-2xl font-black text-white tracking-tighter uppercase">{value}</p>
        <p className="text-[9px] font-bold text-white/20 uppercase mt-2 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
