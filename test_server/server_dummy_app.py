# server_dummy_app.py
import time

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from server_tasks import run_ml_task, MODEL_REGISTRY, TaskManager

app = FastAPI(title="ML Task Server",
              description="API for managing ML model tasks with progress, cancellation, and image upload")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Specify your frontend origin; use ["*"] to allow all origins (less secure, for dev only)
    allow_credentials=True,  # If you need cookies or auth headers
    allow_methods=["*"],     # Allow all methods (GET, POST, etc.); or specify ["POST"] if only needed for this endpoint
    allow_headers=["*"],     # Allow all headers; or specify relevant ones like ["Content-Type"]
)

task_manager = TaskManager()

@app.post("/start/{model_name}", status_code=202)
def start_task(model_name: str, params: dict):  # Use dict for flexibility, or Params for validation
    if model_name not in MODEL_REGISTRY.keys():  # Validate model_name
        raise HTTPException(status_code=400, detail="Invalid model name")
    task_id = task_manager.submit(run_ml_task, model_name, params)
    return {"task_id": task_id}

@app.post("/upload_source_image")
async def upload_source_image(file: UploadFile = File(...)):
    # Restrict to image types if needed
    # Measure time taken to upload
    start_time = time.time()
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        image_data = await file.read()
        model = MODEL_REGISTRY['model_ht']  # Assuming model_ht is the only one for image upload
        target_style_images, source_image_id = model.upload_source_image(image_data)  # Directly call the model method
        elapsed_time = time.time() - start_time
        print(f"Image upload and processing took {elapsed_time:.2f} seconds")
        return {
            "images": target_style_images,
            "sourceImageId": source_image_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.get("/status/{task_id}")
def get_status(task_id: str):
    return task_manager.get_status(task_id)

@app.post("/cancel/{task_id}")
def cancel_task(task_id: str):
    return task_manager.cancel(task_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)