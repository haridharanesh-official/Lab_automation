import os
import zipfile
import shutil
import urllib.request

def download_and_merge_external():
    print("[INFO] STEP 1: Downloading official MS COCO128 external dataset...")
    zip_url = "https://ultralytics.com/assets/coco128.zip"
    workspace_dir = "c:\\Users\\prith\\Downloads\\Lab automation"
    tmp_zip = os.path.join(workspace_dir, "coco128.zip")
    tmp_extract = os.path.join(workspace_dir, "coco128_temp")
    
    # Download the compact zip
    urllib.request.urlretrieve(zip_url, tmp_zip)
    print("[SUCCESS] Download complete! Extracting zip...")
    
    # Extract the zip
    with zipfile.ZipFile(tmp_zip, 'r') as zip_ref:
        zip_ref.extractall(tmp_extract)
    
    print("[SUCCESS] Extraction complete! Merging and filtering labels...")
    
    # Destination folders
    dest_images_dir = os.path.join(workspace_dir, "LabVision-AI", "dataset", "images", "train")
    dest_labels_dir = os.path.join(workspace_dir, "LabVision-AI", "dataset", "labels", "train")
    
    os.makedirs(dest_images_dir, exist_ok=True)
    os.makedirs(dest_labels_dir, exist_ok=True)
    
    # Source folders in extracted zip
    src_images_dir = os.path.join(tmp_extract, "coco128", "images", "train2017")
    src_labels_dir = os.path.join(tmp_extract, "coco128", "labels", "train2017")
    
    # Process images and filter labels
    image_files = [f for f in os.listdir(src_images_dir) if f.endswith(('.jpg', '.jpeg', '.png'))]
    merged_count = 0
    bg_count = 0
    
    for img_name in image_files:
        base_name, _ = os.path.splitext(img_name)
        label_name = base_name + ".txt"
        
        src_img_path = os.path.join(src_images_dir, img_name)
        src_lbl_path = os.path.join(src_labels_dir, label_name)
        
        # New merged paths
        new_img_name = f"coco_ext_{img_name}"
        new_lbl_name = f"coco_ext_{label_name}"
        dest_img_path = os.path.join(dest_images_dir, new_img_name)
        dest_lbl_path = os.path.join(dest_labels_dir, new_lbl_name)
        
        # Copy image
        shutil.copy2(src_img_path, dest_img_path)
        
        person_lines = []
        if os.path.exists(src_lbl_path):
            with open(src_lbl_path, 'r') as f:
                lines = f.readlines()
            for line in lines:
                parts = line.strip().split()
                if len(parts) > 0 and parts[0] == '0':  # '0' is the person class in COCO
                    # In our dataset, class is also 0 (person). We keep the coordinates exactly the same.
                    person_lines.append(line)
        
        # Write filtered label
        with open(dest_lbl_path, 'w') as f:
            if len(person_lines) > 0:
                f.writelines(person_lines)
                merged_count += 1
            else:
                # 0-byte blank file to act as positive negative background (ignores chairs, dogs, cars, etc.!)
                bg_count += 1
                
    print("\n[SUCCESS] MERGE COMPLETE!")
    print(f"-> Merged {merged_count} external images containing high-quality human annotations.")
    print(f"-> Merged {bg_count} external negative background images (suppressing chairs, cars, and objects).")
    
    # Cleanup temp folders
    print("\n[INFO] Cleaning up temporary files...")
    if os.path.exists(tmp_zip):
        os.remove(tmp_zip)
    if os.path.exists(tmp_extract):
        shutil.rmtree(tmp_extract)
    print("[SUCCESS] Workspace cleaned up successfully!")

if __name__ == '__main__':
    download_and_merge_external()
