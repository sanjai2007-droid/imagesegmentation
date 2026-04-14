import torch
import torchvision.transforms as T
from torchvision.models.detection import maskrcnn_resnet50_fpn, MaskRCNN_ResNet50_FPN_Weights
from PIL import Image
import numpy as np
import io
import base64
from collections import Counter

# COCO labels based on torchvision model
COCO_CLASSES = [
    '__background__', 'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus',
    'train', 'truck', 'boat', 'traffic light', 'fire hydrant', 'N/A', 'stop sign',
    'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
    'elephant', 'bear', 'zebra', 'giraffe', 'N/A', 'backpack', 'umbrella', 'N/A', 'N/A',
    'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
    'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
    'bottle', 'N/A', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl',
    'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza',
    'donut', 'cake', 'chair', 'couch', 'potted plant', 'bed', 'N/A', 'dining table',
    'N/A', 'N/A', 'toilet', 'N/A', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone',
    'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'N/A', 'book',
    'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
]

# Load the model with standard weights
weights = MaskRCNN_ResNet50_FPN_Weights.DEFAULT
model = maskrcnn_resnet50_fpn(weights=weights)
model.eval()

# Move to GPU if available
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)

def get_segmented_data(image_bytes: bytes):
    # Open image
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    
    # Preprocess
    transform = T.Compose([T.ToTensor()])
    img_tensor = transform(img).to(device)
    
    # Run inference
    with torch.no_grad():
        prediction = model([img_tensor])
    
    # Get masks, scores, and labels
    masks = prediction[0]['masks']
    scores = prediction[0]['scores']
    labels = prediction[0]['labels']
    
    threshold = 0.5
    confident_indices = scores > threshold
    
    confident_masks = masks[confident_indices]
    confident_labels = labels[confident_indices]
    
    # Extract strings and count
    object_counts = Counter()
    for lbl_tensor in confident_labels:
        idx = lbl_tensor.item()
        if idx < len(COCO_CLASSES) and COCO_CLASSES[idx] != 'N/A':
            object_counts[COCO_CLASSES[idx]] += 1
            
    # Convert to standard dict for JSON serialization
    counts_dict = dict(object_counts)
    
    # If no objects, return base64 of original
    if len(confident_masks) == 0:
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
        return {"image": b64, "counts": {}}
        
    # Combine masks across channels/instances
    combined_mask = confident_masks.sum(dim=0).clamp(0, 1).squeeze(0).cpu().numpy()
    
    # Apply color map
    img_np = np.array(img).astype(float)
    
    # Overlay an electric cyan/blue color over the masks
    mask_2d = combined_mask > 0.5
    alpha = 0.5
    color = np.array([0, 255, 255]) # Cyan
    
    # Blend
    img_np[mask_2d] = img_np[mask_2d] * (1 - alpha) + color * alpha
    
    # Convert back to PIL Image and bytes
    res_img = Image.fromarray(img_np.astype(np.uint8))
    
    buf = io.BytesIO()
    res_img.save(buf, format="JPEG")
    b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    
    return {"image": b64, "counts": counts_dict}
