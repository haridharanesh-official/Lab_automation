import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { 
  LayoutGrid, FlaskConical, Cpu, Users, Zap, 
  ShieldAlert, Bot, BarChart3, ListTree, 
  Puzzle, Settings, Activity, ShieldCheck
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const menuItems = [
  { title: "Overview", icon: LayoutGrid, path: "/" },
  { title: "Labs", icon: FlaskConical, path: "/labs" },
  { title: "Devices", icon: Cpu, path: "/devices" },
  { title: "Occupancy", icon: Users, path: "/occupancy" },
  { title: "Automations", icon: Zap, path: "/automations" },
  { title: "Safety", icon: ShieldAlert, path: "/safety" },
  { title: "AI Assistant", icon: Bot, path: "/ai" },
  { title: "Analytics", icon: BarChart3, path: "/analytics" },
  { title: "Logs", icon: ListTree, path: "/logs" },
  { title: "Add-ons", icon: Puzzle, path: "/addons" },
  { title: "Settings", icon: Settings, path: "/settings" },
];

export function AppSidebar() {
  const { pathname } = useLocation();

  return (
    <Sidebar className="border-r border-white/5 bg-secondary/30 backdrop-blur-3xl">
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-black tracking-tighter uppercase text-white">Lab<span className="text-primary">OS</span></span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-4 px-2">System Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.path}
                    className={`sidebar-link ${pathname === item.path ? 'active' : ''}`}
                  >
                    <Link to={item.path}>
                      <item.icon className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Operational Status Footer */}
        <div className="mt-auto pt-8 border-t border-white/5">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-white/40 uppercase">System Core</span>
              <ShieldCheck className="h-3 w-3 text-success" />
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full w-[94%] bg-primary shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
            </div>
            <div className="flex justify-between items-center text-[8px] font-bold text-primary uppercase">
              <span>Stable</span>
              <span>Uptime: 142h</span>
            </div>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}