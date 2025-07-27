import hashlib

import redis
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from server_celery_app import app as celery_app
from server_tasks import run_ml_task, upload_source_image_task, MODEL_REGISTRY
from celery.result import AsyncResult
import base64

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

# # Optional: Pydantic model for params (for better validation)
# class Params(BaseModel):
#     # Define your expected params structure here, e.g.,
#     input_data: dict  # Or specific fields


@app.post("/start/{model_name}", status_code=202)
def start_task(model_name: str, params: dict):  # Use dict for flexibility, or Params for validation
    if model_name not in MODEL_REGISTRY.keys():  # Validate model_name
        raise HTTPException(status_code=400, detail="Invalid model name")
    task = run_ml_task.delay(model_name, params)
    return {"task_id": task.id}


@app.post("/upload_source_image", status_code=202)
async def upload_source_image(file: UploadFile = File(...)):
    # Restrict to image types if needed
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        image_data = await file.read()
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        source_image_id = hashlib.sha256(image_data).hexdigest()
        model = MODEL_REGISTRY['model_ht'] # Assuming model_hairtransfer is the only one for image upload
        target_style_images = model.upload_source_image(image_data)  # Directly call the model method
        # task = upload_source_image_task.delay('model_a', image_base64)
        # return {"task_id": task.id}
        return {
        "images": target_style_images,
        "sourceImageId": source_image_id
    }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@app.get("/status/{task_id}")
def get_status(task_id: str):
    task = AsyncResult(task_id, app=celery_app)
    if task.state == 'PENDING':
        response = {'status': 'Pending', 'progress': 0}
    elif task.state == 'PROGRESS':
        response = {'status': 'In Progress', 'progress': task.info.get('progress', 0)}
    elif task.state == 'FAILURE':
        response = {'status': 'Failed', 'error': str(task.info)}
    elif task.state == 'REVOKED':
        response = {'status': 'Canceled'}
    else:  # SUCCESS
        response = {'status': 'Completed', 'result': task.info}
    return response


@app.post("/cancel/{task_id}")
def cancel_task(task_id: str):
    # task = AsyncResult(task_id, app=celery_app)
    # if task.status == 'REVOKED':
    #     raise HTTPException(status_code=400, detail="Task already canceled")
    # task.revoke(terminate=False)  # Graceful revocation
    r = redis.Redis.from_url(app.conf.broker_url)  # Connect to Redis
    r.sadd('tasks.revoked', task_id)  # Add task ID to a revoked set
    app.control.revoke(task_id, terminate=False)  # Standard revoke (no kill)
    return {"status": "Cancel requested"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)