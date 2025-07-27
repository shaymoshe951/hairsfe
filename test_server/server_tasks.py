import base64

from server_celery_app import app as celery_app
from celery import current_task
from celery.exceptions import TaskRevokedError, Ignore
from celery.result import AsyncResult
# Add other model imports as needed
from server_model_hairtransfer import ModelHairTransfer
import redis
from server_celery_app import app as celery_app


# Registry for models (expand as needed)
MODEL_REGISTRY = {
    'model_ht': ModelHairTransfer(),
}

__r__ = redis.Redis.from_url(celery_app.conf.broker_url)  # Connect to Redis
def cancel_check_callback(task):
    if __r__.sismember('tasks.revoked', task.request.id.encode()):  # Check if revoked
        # Optional: Cleanup logic here (e.g., release resources)
        __r__.srem('tasks.revoked', task.request.id.encode())  # Clean up entry
        raise Ignore()

@celery_app.task(bind=True)
def run_ml_task(self, model_name, params):
    if model_name not in MODEL_REGISTRY:
        raise ValueError("Invalid model")

    model = MODEL_REGISTRY[model_name]

    def progress_callback(progress):
        self.update_state(state='PROGRESS', meta={'progress': progress})

    try:
        result = model.run(params, progress_callback, lambda : cancel_check_callback(self))
        return result
    except TaskRevokedError as e:
        # Optional: Cleanup if needed
        raise  # Let Celery mark as REVOKED
    except Exception as e:
        raise ValueError(f"Task failed: {str(e)}")


@celery_app.task(bind=True)
def upload_source_image_task(self, model_name, image_base64: str):
    if model_name != 'model_ht':  # Restrict to ModelA
        raise ValueError("Source Image upload only available for model_hairtransfer")

    model = MODEL_REGISTRY[model_name]

    def progress_callback(progress):
        self.update_state(state='PROGRESS', meta={'progress': progress})

    try:
        image_data = base64.b64decode(image_base64)
        result = model.process_image(image_data, progress_callback, lambda : cancel_check_callback(self))
        return result
    except TaskRevokedError as e:
        raise
    except Exception as e:
        raise ValueError(f"Image task failed: {str(e)}")