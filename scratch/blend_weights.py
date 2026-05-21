import torch
from ultralytics import YOLO
import os

def blend_models(standard_path, custom_path, output_path, alpha=0.35):
    print(f"Blending models: Standard ({standard_path}) and Custom ({custom_path}) with alpha={alpha}")
    
    # Load models
    model_std = YOLO(standard_path)
    model_cust = YOLO(custom_path)
    
    # Get state dicts
    dict_std = model_std.model.state_dict()
    dict_cust = model_cust.model.state_dict()
    
    # Create blended dict
    dict_blended = {}
    
    for k in dict_cust.keys():
        if k in dict_std and dict_std[k].shape == dict_cust[k].shape:
            # Linear interpolation of weights for matching layers (backbone & neck)
            dict_blended[k] = alpha * dict_std[k] + (1 - alpha) * dict_cust[k]
        else:
            # Keep custom weights for head layers (mismatched shape due to 1-class setup)
            dict_blended[k] = dict_cust[k]
            print(f"Keeping custom weights for: {k}")
            
    # Load the blended dict into the custom model structure
    model_cust.model.load_state_dict(dict_blended)
    
    # Save the blended model
    model_cust.save(output_path)
    print(f"Successfully saved blended model to: {output_path}")

if __name__ == "__main__":
    blend_models(
        "yolov8s.pt",
        "LabVision-AI/yolov8s_final.pt",
        "LabVision-AI/yolov8s_final.pt", # Overwrite the final model with the blended model
        alpha=0.35 # 35% general weights, 65% custom weights
    )
