# LabOS - Industrial Laboratory Operating System

LabOS is an enterprise-grade laboratory automation and safety platform designed for high-precision monitoring and control. It moves beyond smart-home aesthetics to provide a sophisticated cyber-operations dashboard.

## 🚀 System Features

### 1. Cyber-Operations Dashboard
- **Entity-Based Control**: Modular control system inspired by Home Assistant (Lovelace).
- **Industrial Design**: Dark-mode interface with cyan accents, technical typography, and glassmorphism.
- **Bento Grid Layout**: High-density data visualization for real-time telemetry.

### 2. Specialized Modules
- **Neural Core AI**: Natural language command processing and predictive analytics via Ollama.
- **Occupancy Intelligence**: Zone-based presence tracking and spatial utilization heatmaps.
- **Safety & Critical Monitors**: High-stakes override console for gas leaks, fire suppression, and emergency evacuation.
- **Operational Analytics**: Comprehensive energy load distribution and system health metrics using Recharts.
- **Automation Engine**: Logic-block rule builder for cross-device protocols.

## 🛠 Tech Stack
- **Frontend**: Next.js 14 / Vite (React 18)
- **Styling**: Tailwind CSS v4 + Shadcn UI
- **State Management**: Zustand (Entity-State Mapping)
- **Visuals**: Lucide Icons + Recharts + Framer Motion
- **Connectivity**: MQTT over WebSockets (Mosquitto)

## 🔧 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 📂 Project Structure
- `/src/lib/labStore.ts`: Central entity-based state engine.
- `/src/pages/*`: Dedicated operational pages (Safety, AI, Occupancy, etc.).
- `/src/components/lab/*`: Industrial UI components (EntityCard, MetricCard).
- `/src/app/globals.css`: LabOS design system and theme tokens.

---
**LabOS** - *Intelligent Laboratory Automation & Safety Platform*
