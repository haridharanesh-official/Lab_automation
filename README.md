# LabOS - Industrial Laboratory Operating System (Lite)

LabOS is an enterprise-grade laboratory automation and safety platform. This repository contains the **LabVision-Hailo** module, a production-grade edge AI occupancy system optimized for high-performance hardware accelerators.

## 🚀 Key Modules

### 1. LabVision-Hailo (High-Performance Edge AI)
*   **Hardware**: Raspberry Pi 5 + Hailo AI HAT+ (26 TOPS).
*   **Real-time Occupancy**: Multi-threaded async inference using HailoRT.
*   **Sensor Fusion**: Combines AI Vision, mmWave presence, and PIR sensors for 100% occupancy accuracy.
*   **Industrial Logic**: 5s occupancy entry buffer / 20s empty exit buffer to ensure stable automation.
*   **Zero-Lag Pipeline**: GStreamer-based RTSP handling with hardware H.264 decoding.

### 2. LabVision-AI (General Purpose / Training)
*   **Training Suite**: Scripts for fine-tuning YOLOv8 on custom lab datasets.
*   **Suppression Engine**: Specialized training to ignore furniture and lab equipment.
*   **Standard Monitoring**: CUDA-accelerated inference for NVIDIA GPUs (RTX 3050).

### 3. Cyber-Operations Dashboard
*   **Industrial Design**: Dark-mode interface with glassmorphism and cyan accents.
*   **Pure Vanilla Stack**: Dependency-free HTML/CSS/JS optimized for edge server hosting.

## 🔧 Hardware & Tech Stack
*   **Inference Engine**: Hailo-8 AI Accelerator (26 TOPS)
*   **Host Platform**: Raspberry Pi 5 (16GB RAM)
*   **Communication**: Mosquitto MQTT (Industrial Messaging)
*   **Development**: Python 3.11, C++ (HailoRT), GStreamer

## 📂 Deployment Structure
*   `LabVision-Hailo/`: Production deployment scripts for Raspberry Pi.
    *   `src/hailo_app.py`: Main async inference & logic application.
    *   `src/fusion_engine.py`: AI + PIR + mmWave sensor fusion logic.
*   `LabVision-AI/`: Training and general-purpose monitoring scripts.
*   `yolov8s_final.pt`: Fine-tuned production weights.
*   `index.html`: Dashboard entry point.

## 🛰️ MQTT Integration
The system publishes to the following topics:
*   `lab/lab101/zoneA/occupancy/state`: Fused occupancy state (JSON).
*   `lab/lab101/system/heartbeat`: Health and diagnostic data.

---
**LabOS** - *Intelligent Laboratory Automation & Safety Platform (26 TOPS Edition)*
