from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from segment import get_segmented_data
import uvicorn

app = FastAPI(title="Image Segmentation Platform")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "ok"}

@app.post("/api/segment")
async def handle_segment_image(file: UploadFile = File(...)):
    """
    Receives an image, performs inference, and returns JSON containing:
    - image: Base64 JPG string of the segmented image
    - counts: Dictionary containing mapping of objects found and their quantites
    """
    try:
        image_bytes = await file.read()
        res_data = get_segmented_data(image_bytes)
        return JSONResponse(content=res_data)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
