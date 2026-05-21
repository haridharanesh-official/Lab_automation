from ultralytics import YOLO
import os

def export_model_to_onnx():
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(SCRIPT_DIR, 'yolov8s_final.pt')
    
    if not os.path.exists(model_path):
        print(f"❌ Error: Custom model {model_path} not found.")
        return
        
    print(f"🚀 Loading custom fine-tuned model from {model_path}...")
    model = YOLO(model_path)
    
    print("📦 Exporting to optimized ONNX format (640x640, single-class person)...")
    # Export parameters optimized for Hailo-8 compiler pipeline
    onnx_path = model.export(
        format='onnx',
        imgsz=640,
        half=False,       # Keep FP32 (essential for Hailo Compiler calibration/quantization)
        dynamic=False,    # Keep static input shape (required by hardware accelerators like Hailo-8)
        simplify=True,    # Run ONNX-Simplifier to streamline nodes for edge hardware
    )
    
    print("\n🎉 Export Complete!")
    print(f"✅ ONNX model saved to: {onnx_path}")
    print("👉 This file is fully optimized and ready to be compiled into models/yolov8s_lab.hef using the Hailo Software Suite!")

if __name__ == '__main__':
    export_model_to_onnx()
