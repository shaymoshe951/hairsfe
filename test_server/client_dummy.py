import base64

import requests
import time
import os
from io import BytesIO
from PIL import Image  # Requires Pillow library, but since it's a test, assume it's installed or note it.

# Base URL for the API server (assuming it's running on localhost:8000)
BASE_URL = "http://localhost:8000"


def create_dummy_image():
    """
    Creates a dummy in-memory image for testing purposes.
    This simulates uploading an image without needing a real file.
    """
    img = Image.open(r"C:\Users\ShayMoshe\OneDrive - vayyar.com\Documents\Personal\ML\HairSProject\pics\Shay\image_wh3.jpeg")
    img_byte_arr = BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    return img_byte_arr


def test_upload_source_image():
    """
    Test uploading a source image to the /upload_source_image endpoint.
    """
    print("Testing image upload...")

    # Create a dummy image for testing
    dummy_image = create_dummy_image()

    files = {'file': ('dummy_image.png', dummy_image, 'image/png')}

    response = requests.post(f"{BASE_URL}/upload_source_image", files=files)

    if response.status_code == 202:
        data = response.json()
        print("Upload successful:")
        # print(f"Images: {data.get('images')}")
        print(f"Source Image ID: {data.get('sourceImageId')}")
        return data.get('sourceImageId')
    else:
        print(f"Upload failed: {response.status_code} - {response.text}")
        return None


def test_start_task(model_name: str, params: dict):
    """
    Test starting a task with the /start/{model_name} endpoint.
    """
    print(f"Testing start task for model: {model_name}")

    response = requests.post(f"{BASE_URL}/start/{model_name}", json=params)

    if response.status_code == 202:
        data = response.json()
        print(f"Task started successfully. Task ID: {data['task_id']}")
        return data['task_id']
    else:
        print(f"Start task failed: {response.status_code} - {response.text}")
        return None


def test_get_status(task_id: str):
    """
    Test getting the status of a task with the /status/{task_id} endpoint.
    Polls until the task is completed or failed.
    """
    print(f"Testing status for task: {task_id}")

    while True:
        response = requests.get(f"{BASE_URL}/status/{task_id}")

        if response.status_code == 200:
            status = response.json()
            print(f"Current status: {status.get('status')}, Progress: {status.get('progress', 0)}%")
            if status.get('status') in ['Completed', 'Failed']:
                print("Task completed or failed.")
                return status.get('result', None)
        else:
            print(f"Get status failed: {response.status_code} - {response.text}")
            return None

        time.sleep(2)  # Poll every 2 seconds


def test_cancel_task(task_id: str):
    """
    Test canceling a task with the /cancel/{task_id} endpoint.
    """
    print(f"Testing cancel for task: {task_id}")

    response = requests.post(f"{BASE_URL}/cancel/{task_id}")

    if response.status_code == 200:
        data = response.json()
        print(f"Cancel response: {data}")
        return data
    else:
        print(f"Cancel failed: {response.status_code} - {response.text}")
        return None


if __name__ == "__main__":
    # Step 1: Test image upload
    source_image_id = test_upload_source_image()

    if source_image_id:
        # Step 2: Test starting a task (assuming 'model_ht' is a valid model and params use the source_image_id)
        model_name = "model_ht"  # Replace with a valid model name from MODEL_REGISTRY if different
        params = {
            "source_image_id": source_image_id,
            "index": 0  # Example index, e.g., to select a target style
        }
        task_id = test_start_task(model_name, params)

        if task_id:
            # Step 3: Test getting status (polls until done)
            result = test_get_status(task_id)

    # convert result to an image if available
            if result and isinstance(result, str) and result.startswith("data:image/jpeg;base64,"):
                # Decode base64 image data
                image_data = result.split(",")[1]
                image_bytes = BytesIO(base64.b64decode(image_data))
                image = Image.open(image_bytes)
                image.show()
                print("Image processing completed successfully.")
            else:
                print("No valid image result returned.")

            # Step 4: Optionally test cancel (uncomment to test; but if task is already done, it may not cancel)
            # test_cancel_task(task_id)
    else:
        print("Skipping further tests due to upload failure.")