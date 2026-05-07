import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useLabStore } from "@/lib/labStore";
import { 
  Activity, Cpu, Clock, Bell, User, Bot, 
  Wifi, WifiOff, LayoutDashboard, Search
} from "lucide-react";

export default function Layout() {
  const { pathname } = useLocation();
  const mqtt_connected = useLabStore(s => s.mqtt_connected);
  const rpi_status = useLabStore(s => s.rpi_status);
  const ai_status = useLabStore(s => s.ai_status);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background selection:bg-primary/30">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar - Industrial Monitoring Style */}
          <header className="sticky top-0 z-40 h-16 flex items-center gap-6 border-b border-white/5 bg-background/80 px-8 backdrop-blur-2xl">
            <div className="flex items-center gap-4 text-muted-foreground mr-4">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              <span className="text-xs font-bold tracking-[0.2em] uppercase">LabOS <span className="text-white/20">/</span> Control Panel</span>
            </div>

            <div className="h-6 w-px bg-white/5" />

            {/* Live Metrics */}
            <div className="flex-1 flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className={`status-badge ${mqtt_connected ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                  {mqtt_connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  MQTT {mqtt_connected ? 'Connected' : 'Offline'}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`status-badge ${rpi_status === 'online' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'}`}>
                  <Cpu className="h-3 w-3" />
                  PI SERVER: {rpi_status.toUpperCase()}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`status-badge ${ai_status === 'ready' ? 'bg-cyan-400/10 text-cyan-400' : 'bg-muted text-muted-foreground'}`}>
                  <Bot className="h-3 w-3" />
                  AI ENGINE: {ai_status.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Utility Icons */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-mono tabular-nums">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
              
              <div className="h-8 w-px bg-white/5" />

              <button className="relative text-muted-foreground hover:text-foreground transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-danger animate-pulse" />
              </button>

              <div className="flex items-center gap-3 pl-2 cursor-pointer group">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-white/90 uppercase tracking-tighter">Prithic</span>
                  <span className="text-[9px] font-bold text-success/70 uppercase tracking-widest">Admin</span>
                </div>
                <div className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-primary/50 transition-all">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-8 overflow-y-auto overflow-x-hidden scrollbar-hide">
            <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}