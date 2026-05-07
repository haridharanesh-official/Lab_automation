import { create } from "zustand";

export type EntityDomain = "sensor" | "switch" | "binary_sensor" | "climate" | "light" | "script";
export type EntityState = string | number | boolean;

export interface Entity {
  entity_id: string; // domain.name
  name: string;
  state: EntityState;
  attributes: {
    unit_of_measurement?: string;
    device_class?: string;
    icon?: string;
    friendly_name?: string;
    status?: "normal" | "warning" | "danger" | "critical";
    last_changed?: string;
    area_id?: string;
    [key: string]: any;
  };
}

export interface Area {
  id: string;
  name: string;
  description?: string;
}

export interface Automation {
  id: string;
  alias: string;
  description: string;
  enabled: boolean;
}

interface LabOSState {
  // Connection Status
  mqtt_connected: boolean;
  rpi_status: "online" | "maintenance" | "offline";
  ai_status: "ready" | "processing" | "idle";
  
  // Data
  entities: Record<string, Entity>;
  areas: Area[];
  automations: Automation[];
  logs: { id: string; timestamp: string; message: string; type: "info" | "warning" | "danger" }[];
  
  // Actions
  updateEntity: (entity_id: string, newState: Partial<Entity>) => void;
  toggleSwitch: (entity_id: string) => void;
  setMqttStatus: (connected: boolean) => void;
  addLog: (message: string, type?: "info" | "warning" | "danger") => void;
}

// Initial Data Mock (Lovelace Style Entities)
const initialAreas: Area[] = [
  { id: "lab_101", name: "Chemistry Lab", description: "Analytical Chemistry Wing" },
  { id: "lab_102", name: "Bio-Genetics", description: "Restricted Access Area" },
  { id: "lab_103", name: "Robotics Core", description: "Mechatronics Development" },
];

const initialEntities: Record<string, Entity> = {
  // Lab 101 Sensors
  "sensor.lab101_temp": {
    entity_id: "sensor.lab101_temp",
    name: "Lab 101 Temperature",
    state: 24.2,
    attributes: { unit_of_measurement: "°C", device_class: "temperature", area_id: "lab_101", status: "normal" }
  },
  "sensor.lab101_humidity": {
    entity_id: "sensor.lab101_humidity",
    name: "Lab 101 Humidity",
    state: 45,
    attributes: { unit_of_measurement: "%", device_class: "humidity", area_id: "lab_101", status: "normal" }
  },
  "sensor.lab101_gas": {
    entity_id: "sensor.lab101_gas",
    name: "Lab 101 Gas Level",
    state: 120,
    attributes: { unit_of_measurement: "ppm", device_class: "gas", area_id: "lab_101", status: "normal" }
  },
  "binary_sensor.lab101_motion": {
    entity_id: "binary_sensor.lab101_motion",
    name: "Lab 101 Presence",
    state: false,
    attributes: { device_class: "motion", area_id: "lab_101" }
  },
  // Lab 101 Switches
  "switch.lab101_main_light": {
    entity_id: "switch.lab101_main_light",
    name: "Lab 101 Main Lighting",
    state: true,
    attributes: { icon: "lightbulb", area_id: "lab_101" }
  },
  "switch.lab101_exhaust": {
    entity_id: "switch.lab101_exhaust",
    name: "Lab 101 Ventilation",
    state: false,
    attributes: { icon: "fan", area_id: "lab_101" }
  },
  "switch.lab101_power": {
    entity_id: "switch.lab101_power",
    name: "Lab 101 Main Power",
    state: true,
    attributes: { icon: "zap", area_id: "lab_101" }
  },
  
  // System Metrics
  "sensor.system_energy": {
    entity_id: "sensor.system_energy",
    name: "Total Energy Consumption",
    state: 12.8,
    attributes: { unit_of_measurement: "kWh", icon: "flash" }
  },
  "sensor.occupancy_count": {
    entity_id: "sensor.occupancy_count",
    name: "Current Occupancy",
    state: 4,
    attributes: { icon: "account-group" }
  }
};

export const useLabStore = create<LabOSState>((set) => ({
  mqtt_connected: true,
  rpi_status: "online",
  ai_status: "ready",
  
  entities: initialEntities,
  areas: initialAreas,
  automations: [
    { id: "auto_1", alias: "Gas Leak Emergency", description: "Shutdown power and start exhaust on high gas", enabled: true },
    { id: "auto_2", alias: "After Hours Power Off", description: "Power down non-essential systems at 22:00", enabled: true },
  ],
  logs: [],

  updateEntity: (entity_id, newState) => set((state) => ({
    entities: {
      ...state.entities,
      [entity_id]: { ...state.entities[entity_id], ...newState }
    }
  })),

  toggleSwitch: (entity_id) => set((state) => {
    const entity = state.entities[entity_id];
    if (!entity || !entity_id.startsWith("switch.")) return state;
    return {
      entities: {
        ...state.entities,
        [entity_id]: { ...entity, state: !entity.state }
      }
    };
  }),

  setMqttStatus: (connected) => set({ mqtt_connected: connected }),

  addLog: (message, type = "info") => set((state) => ({
    logs: [{
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      message,
      type
    }, ...state.logs].slice(0, 100)
  })),
}));
