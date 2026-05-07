import React from "react";
import { useLabStore, Entity } from "@/lib/labStore";
import { 
  Thermometer, Droplets, Zap, Wind, 
  Lightbulb, ShieldAlert, Radio, Activity,
  Power, Volume2, MonitorPlay, Fan, Snowflake
} from "lucide-react";
import { motion } from "framer-motion";

interface EntityCardProps {
  entity_id: string;
}

const iconMap: Record<string, any> = {
  temperature: Thermometer,
  humidity: Droplets,
  gas: ShieldAlert,
  motion: Activity,
  light: Lightbulb,
  fan: Fan,
  zap: Zap,
  power: Power,
  buzzer: Volume2,
  board: MonitorPlay,
  ac: Snowflake
};

export const EntityCard: React.FC<EntityCardProps> = ({ entity_id }) => {
  const entity = useLabStore((s) => s.entities[entity_id]);
  const toggleSwitch = useLabStore((s) => s.toggleSwitch);

  if (!entity) return null;

  const domain = entity_id.split(".")[0];
  const deviceClass = entity.attributes.device_class || "generic";
  const Icon = iconMap[deviceClass] || iconMap[entity.attributes.icon] || Activity;
  const status = entity.attributes.status || "normal";
  const isOn = domain === "switch" || domain === "light" ? entity.state === true : false;

  const isWarning = status === "warning";
  const isDanger = status === "danger" || status === "critical";

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => domain === "switch" && toggleSwitch(entity_id)}
      className={`industrial-card p-5 cursor-pointer flex flex-col justify-between min-h-[140px] ${
        isDanger ? 'border-danger/50 bg-danger/5' : isWarning ? 'border-warning/50 bg-warning/5' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl transition-colors ${
          isOn ? 'bg-primary/20 text-primary' : isDanger ? 'bg-danger/20 text-danger animate-pulse' : 'bg-white/5 text-muted-foreground'
        }`}>
          <Icon className="h-5 w-5" />
        </div>
        
        {domain === "sensor" && (
          <div className={`status-badge ${
            isDanger ? 'bg-danger/20 text-danger' : isWarning ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${
              isDanger ? 'bg-danger animate-alert' : isWarning ? 'bg-warning' : 'bg-success'
            }`} />
            {status.toUpperCase()}
          </div>
        )}
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">
          {entity.attributes.friendly_name || entity.name}
        </p>
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-black tracking-tight ${
            isDanger ? 'text-danger' : isOn ? 'text-primary' : 'text-white'
          }`}>
            {typeof entity.state === "boolean" ? (entity.state ? "ACTIVE" : "STANDBY") : entity.state}
          </span>
          <span className="text-xs font-bold text-white/20 uppercase">
            {entity.attributes.unit_of_measurement}
          </span>
        </div>
      </div>

      {/* Industrial Progress Bar or State Indicator */}
      <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={false}
          animate={{ width: isOn ? "100%" : "30%" }}
          className={`h-full ${isOn ? 'bg-primary shadow-[0_0_8px_rgba(6,182,212,0.5)]' : 'bg-white/10'}`}
        />
      </div>
    </motion.div>
  );
};
