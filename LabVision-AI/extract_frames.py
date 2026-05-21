import cv2
import os
import sys
from tqdm import tqdm

def extract_frames(video_path, output_dir, interval=60):
    """
    Extracts frames from a video file at a specified interval.
    interval=60 means 1 frame every 2 seconds for a 30fps video.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    if not os.path.exists(video_path):
        print(f"Error: Video file {video_path} not found.")
        return

    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    video_name = os.path.basename(video_path).split('.')[0]
    
    count = 0
    saved_count = 0
    
    print(f"Starting extraction from {video_name}...")
    with tqdm(total=total_frames) as pbar:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            if count % interval == 0:
                frame_name = f"{video_name}_f{count}.jpg"
                cv2.imwrite(os.path.join(output_dir, frame_name), frame)
                saved_count += 1
            
            count += 1
            pbar.update(1)
            
    cap.release()
    print(f"\nSuccessfully extracted {saved_count} frames into {output_dir}")

if __name__ == "__main__":
    # Default target directory
    output_dir = "dataset_raw"
    
    if len(sys.argv) > 1:
        target = sys.argv[1]
        
        # If second argument is provided, use it as output directory
        if len(sys.argv) > 2:
            output_dir = sys.argv[2]
            
        if os.path.isdir(target):
            print(f"Processing all videos in directory: {target}")
            videos = [f for f in os.listdir(target) if f.lower().endswith(('.mp4', '.avi', '.mov'))]
            for v in videos:
                extract_frames(os.path.join(target, v), output_dir, interval=150) # 1 frame every 5s
        else:
            extract_frames(target, output_dir, interval=150)
    else:
        print("Usage: python extract_frames.py <path_to_video_or_directory> [output_directory]")
