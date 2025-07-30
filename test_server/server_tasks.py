# server_tasks.py
import concurrent.futures
import threading
import uuid
import time  # If needed for simulation

from server_model_hairtransfer import ModelHairTransfer
from test_server.server_model_profile import ModelProfile

# Registry for models (expand as needed)
MODEL_REGISTRY = {
    'model_ht': ModelHairTransfer(),
    'model_profile': ModelProfile(),  # Placeholder for other models
}

class TaskRevokedError(Exception):
    pass

class TaskManager:
    def __init__(self):
        self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)  # Adjustable
        self.tasks = {}  # task_id: dict of task info
        self.lock = threading.Lock()  # Global lock for tasks dict

    def submit(self, fn, *args, **kwargs):
        task_id = str(uuid.uuid4())
        task = {
            'state': 'PENDING',
            'progress': 0,
            'result': None,
            'error': None,
            'cancel_flag': False,
            'lock': threading.Lock()  # Per-task lock
        }

        def progress_callback(progress):
            with task['lock']:
                task['progress'] = progress
                if task['state'] == 'PENDING':
                    task['state'] = 'PROGRESS'

        def cancel_check_callback():
            with task['lock']:
                if task['cancel_flag']:
                    raise TaskRevokedError("Task canceled")

        def wrapped():
            try:
                result = fn(*args, **kwargs, progress_callback=progress_callback, cancel_check_callback=cancel_check_callback)
                with task['lock']:
                    task['state'] = 'COMPLETED'
                    task['result'] = result
            except TaskRevokedError:
                with task['lock']:
                    task['state'] = 'CANCELED'
            except Exception as e:
                with task['lock']:
                    task['state'] = 'FAILED'
                    task['error'] = str(e)

        future = self.executor.submit(wrapped)
        task['future'] = future

        with self.lock:
            self.tasks[task_id] = task

        return task_id

    def get_status(self, task_id):
        with self.lock:
            if task_id not in self.tasks:
                return {'status': 'Unknown'}
            task = self.tasks[task_id]

        with task['lock']:
            state = task['state']
            print(state)
            if state == 'PENDING':
                return {'status': 'Pending', 'progress': 0, 'done': False}
            elif state == 'PROGRESS':
                return {'status': 'In Progress', 'progress': task['progress'], 'done': False}
            elif state == 'FAILED':
                return {'status': 'Failed', 'error': task['error'], 'done': True}
            elif state == 'CANCELED':
                return {'status': 'Canceled', 'done': True}
            elif state == 'COMPLETED':
                return {'status': 'Completed', 'result': task['result'], 'done': True, 'progress': 100}

    def cancel(self, task_id):
        with self.lock:
            if task_id not in self.tasks:
                raise ValueError("Task not found")
            task = self.tasks[task_id]

        with task['lock']:
            if task['state'] in ('COMPLETED', 'FAILED', 'CANCELED'):
                return {"status": "Task already finished or canceled"}
            task['cancel_flag'] = True
            task['future'].cancel()  # Attempt to cancel, may not work if running

        return {"status": "Cancel requested"}

def run_ml_task(model_name, params, progress_callback, cancel_check_callback):
    if model_name not in MODEL_REGISTRY:
        raise ValueError("Invalid model")

    model = MODEL_REGISTRY[model_name]

    try:
        result = model.run(params, progress_callback, cancel_check_callback)
        return result
    except Exception as e:
        raise ValueError(f"Task failed: {str(e)}")
