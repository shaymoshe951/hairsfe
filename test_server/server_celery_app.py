# celery_app.py (unchanged)
from celery import Celery

app = Celery('ml_tasks',
             broker='redis://localhost:6379/0',
             backend='redis://localhost:6379/0',
             include=['server_tasks'])  # Point to server_tasks.py

# Enable eager mode for synchronous execution for debug
# app.conf.task_always_eager = True
# app.conf.task_store_eager_result = True  # This enables storing results in the backend during eager mode
# # Optional: Ensure this is False if you want results stored (default is False anyway)
# app.conf.task_ignore_result = False