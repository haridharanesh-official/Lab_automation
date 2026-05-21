import os
import zipfile
import shutil
import sys

def zip_folder(folder_path, zip_file, exclude_dirs=None, exclude_exts=None, include_only_exts=None):
    """Helper to zip a folder with selective exclusions."""
    if exclude_dirs is None:
        exclude_dirs = []
    if exclude_exts is None:
        exclude_exts = []
        
    for root, dirs, files in os.walk(folder_path):
        # Exclude directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
        
        for file in files:
            if any(file.endswith(ext) for ext in exclude_exts):
                continue
            if include_only_exts and not any(file.endswith(ext) for ext in include_only_exts):
                continue
                
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, os.path.dirname(folder_path))
            zip_file.write(file_path, arcname)

import argparse

def export_project():
    print("[Package] LabOS Project Exporter & Optimizer")
    print("=======================================")
    print("This script will package your project into a clean, lightweight ZIP file.\n")
    
    # Paths setup
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
    PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
    
    parser = argparse.ArgumentParser(description="LabOS Exporter")
    parser.add_argument('--mode', type=str, choices=['inference', 'dev'], default=None, help="Export mode ('inference' or 'dev')")
    parser.add_argument('--include-videos', action='store_true', help="Include raw Lab footage videos in the ZIP")
    args, unknown = parser.parse_known_args()
    
    choice = args.mode
    include_videos = args.include_videos
    
    if not choice:
        print("Choose your Export Mode:")
        print(" [1] Inference Mode (~220 MB) - Includes code, node server, MQTT bridge, and trained YOLOv8 model weights.")
        print(" [2] Full Dev Mode (~2.0 GB)  - Includes everything in Inference Mode PLUS zipped raw training images/annotations (dataset_raw).")
        try:
            user_choice = input("\nEnter choice [1 or 2, default: 1]: ").strip()
            if user_choice == '2':
                choice = 'dev'
            else:
                choice = 'inference'
        except KeyboardInterrupt:
            print("\nAborted.")
            return
            
        try:
            video_choice = input("Would you like to include 'Lab footage' videos in the package? [y/N]: ").strip().lower()
            include_videos = (video_choice == 'y' or video_choice == 'yes')
        except KeyboardInterrupt:
            print("\nAborted.")
            return
    
    include_training = (choice == 'dev')
    
    # Generate suffix based on package choices
    suffix = "Full_Dev" if include_training else "Inference"
    if include_videos:
        suffix += "_With_Videos"
        
    export_name = f"LabOS_{suffix}_Export.zip"
    export_path = os.path.join(PROJECT_ROOT, export_name)
    
    print(f"\n[Run] Packaging project to: {export_path}...")
    
    with zipfile.ZipFile(export_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # 1. Package Root files (code and configurations)
        root_files = [
            'app.js', 'package.json', 'package-lock.json', '.gitignore',
            'README.md', 'validate_model_visual.py'
        ]
        for rf in root_files:
            rf_path = os.path.join(PROJECT_ROOT, rf)
            if os.path.exists(rf_path):
                zipf.write(rf_path, rf)
                print(f"  + Added root file: {rf}")
                
        # 2. Package LabVision-AI folder (excluding heavy datasets, zips, logs)
        print("  + Packaging LabVision-AI code and weights...")
        exclude_dirs = [
            'dataset', 'manual_calibration', 'extracted_frames', 
            'runs', 'audit_results', 'audit_samples', '__pycache__'
        ]
        exclude_exts = ['.zip', '.log', '.tmp']
        
        # Walk and zip LabVision-AI folder
        labvision_dir = os.path.join(PROJECT_ROOT, 'LabVision-AI')
        zip_folder(labvision_dir, zipf, exclude_dirs=exclude_dirs, exclude_exts=exclude_exts)
        
        # 3. Package Scratch scripts if any
        scratch_dir = os.path.join(PROJECT_ROOT, 'scratch')
        if os.path.exists(scratch_dir):
            print("  + Packaging scratch scripts...")
            zip_folder(scratch_dir, zipf, exclude_dirs=['__pycache__'])
            
        # 4. Package LabVision-Hailo folder if any
        hailo_dir = os.path.join(PROJECT_ROOT, 'LabVision-Hailo')
        if os.path.exists(hailo_dir):
            print("  + Packaging Hailo acceleration code...")
            zip_folder(hailo_dir, zipf)
            
        # 5. Package Training Data (dataset_raw) if requested
        if include_training:
            raw_dir = os.path.join(PROJECT_ROOT, 'dataset_raw')
            if os.path.exists(raw_dir):
                print("  + Packaging raw training images and annotations (dataset_raw)... This may take 1-2 minutes...")
                # Only zip .jpg and .txt files to avoid extra bloat
                zip_folder(raw_dir, zipf, include_only_exts=['.jpg', '.jpeg', '.png', '.txt', '.yaml'])
            else:
                print("  [Warning] dataset_raw folder not found, skipping training data packaging.")
                
        # 6. Package Video footage if requested
        if include_videos:
            video_dir = os.path.join(PROJECT_ROOT, 'Lab footage')
            if os.path.exists(video_dir):
                print("  + Packaging raw lab footage videos... This may take a minute...")
                zip_folder(video_dir, zipf)
            else:
                print("  [Warning] Lab footage folder not found, skipping video packaging.")

    size_mb = os.path.getsize(export_path) / (1024 * 1024)
    print(f"[Success] Export Complete!")
    print(f"Exported file: {export_path}")
    print(f"Total ZIP Size: {size_mb:.2f} MB ({size_mb/1024:.2f} GB)")
    
    if include_training:
        print("\n* To start training on the new PC:")
        print("  1. Extract this ZIP file.")
        print("  2. Run `python LabVision-AI/prepare_dataset.py` to auto-split the training data.")
        print("  3. Run `python LabVision-AI/train_occupancy.py` to begin fine-tuning.")
    else:
        print("\n* This package is ready for live inference! Just copy it to the target PC and run:")
        print("  `node app.js`  (to start MQTT-Node interface)")
        print("  `python LabVision-AI/live_occupancy.py` (to run YOLOv8 occupancy detector)")

if __name__ == '__main__':
    export_project()
