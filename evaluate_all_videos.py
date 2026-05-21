import os
import sys
from test_video_inference import test_video_inference

def run_comprehensive_evaluation():
    print("==================================================")
    print("🚀 STARTING COMPREHENSIVE LAB VISION AI EVALUATION")
    print("==================================================")
    
    model_path = "LabVision-AI/yolov8s_final.pt"
    if not os.path.exists(model_path):
        print(f"❌ Error: Custom model {model_path} not found. Please wait for training to complete.")
        return
        
    # Mappings of test videos to their expected outputs
    evaluations = [
        {
            "name": "👥 Crowded Rear Camera Test",
            "video": "Lab footage/iot lab back cam 1 crowded.mp4",
            "output": "back_cam_annotated.mp4",
            "frames": 150
        },
        {
            "name": "👥 Crowded Front Camera Test",
            "video": "Lab footage/iot lab front cam 1 crowded.mp4",
            "output": "front_cam_annotated.mp4",
            "frames": 150
        },
        {
            "name": "🌙 Empty Night Camera Test (False Positive Suppression Audit)",
            "video": "Lab footage/iot lab back cam night.mp4",
            "output": "back_cam_night_annotated.mp4",
            "frames": 100
        },
        {
            "name": "☀️ Empty Morning Camera Test (Lighting Glare Suppression Audit)",
            "video": "Lab footage/iot lab front cam morning.mp4",
            "output": "front_cam_morning_annotated.mp4",
            "frames": 100
        }
    ]
    
    for i, test in enumerate(evaluations):
        print(f"\n🎬 [{i+1}/{len(evaluations)}] Running: {test['name']}")
        print(f"   Source: {test['video']}")
        print(f"   Destination: {test['output']}")
        
        if not os.path.exists(test['video']):
            print(f"   ⚠️ Skipping: Source video file not found at '{test['video']}'")
            continue
            
        try:
            test_video_inference(
                video_path=test['video'],
                model_path=model_path,
                output_path=test['output'],
                max_frames=test['frames']
            )
            print(f"   ✅ Successfully generated visual audit video!")
        except Exception as e:
            print(f"   ❌ Error running evaluation: {e}")
            
    print("\n==================================================")
    print("🎉 COMPREHENSIVE LAB VISION AI EVALUATION COMPLETE!")
    print("==================================================")
    print("The annotated visual verification videos have been saved to your workspace:")
    print("1. 👥 back_cam_annotated.mp4")
    print("2. 👥 front_cam_annotated.mp4")
    print("3. 🌙 back_cam_night_annotated.mp4")
    print("4. ☀️ front_cam_morning_annotated.mp4")

if __name__ == '__main__':
    run_comprehensive_evaluation()
