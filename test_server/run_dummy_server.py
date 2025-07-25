# Create a dummy server that returns a predefined loaded list of images from a folder in reponse to a POST request
import os
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import threading
import uuid
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

# Global variable to store progress
# Add a global dictionary to store the task_id and the image index
task_dict = {}
index_to_task_id = {}
source_image_id_to_images = {}

# Load images from the results folder
def load_images(results_dir):
    images = []
    if os.path.exists(results_dir):
        for filename in os.listdir(results_dir):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                with open(os.path.join(results_dir, filename), "rb") as img_file:
                    img_data = base64.b64encode(img_file.read()).decode('utf-8')
                    images.append(f"data:image/jpeg;base64,{img_data}")
    return images

@app.route("/get_images", methods=["POST"])
def get_images():
    print("Received a request to process an image")
    # Get the input image from request
    data = request.json
    if not data or 'image' not in data:
        return jsonify({"error": "No image provided"}), 400

    results_dir = r"C:\Users\ShayMoshe\OneDrive - vayyar.com\Documents\Personal\ML\HairSProject\pics\list_of_hairs\arranged"

    # Generate a sourceImageId (for example, a uuid based on the image string)
    import hashlib
    image_str = data['image']
    source_image_id = hashlib.sha256(image_str.encode('utf-8')).hexdigest()

    # Save the sourceImageId to a dictionary with the image string converted to PIL image
    # Convert the image string to a PIL image
    # Strip data URL prefix if present
    if image_str.startswith("data:image"):
        image_str = image_str.split(",", 1)[1]
    img_bytes = base64.b64decode(image_str)
    source_image_pil = Image.open(io.BytesIO(img_bytes))
    source_image_pil.load() # force actual image read
    source_image_id_to_images[source_image_id] = source_image_pil

    # Return the predefined result images and the sourceImageId
    return jsonify({
        "images": load_images(results_dir),
        "sourceImageId": source_image_id
    })

@app.route("/process_image", methods=["POST"])
def process_image():
    # Get the image index and sourceImageId from request
    data = request.json
    if not data or 'index' not in data:
        return jsonify({"error": "No image index provided"}), 400
    if 'sourceImageId' not in data:
        return jsonify({"error": "No sourceImageId provided"}), 400

    print("Received a request to process specific image, index:", data['index'], "sourceImageId:", data['sourceImageId'])
    # join the sourceImageId and the index to get a unique task_id
    task_id_prefix = f"{data['sourceImageId']}_{data['index']}"

    if task_id_prefix in index_to_task_id:
        # return jsonify({"error": "Image already being processed"}), 400
        task_id = index_to_task_id[task_id_prefix]
        return jsonify({"task_id": task_id})

    # Return task id
    task_id = str(uuid.uuid4())
    index_to_task_id[task_id_prefix] = task_id
    # Add the task_id and the image index to the global dictionary
    task_dict[task_id] = {'index': data['index'],'progress': 0, 'is_done': False, 'result': None, 'sourceImageId': data['sourceImageId']}
    # print("task_dict:", task_dict)
    print("task_id:", task_id)
    # print("data['index']: ", data['index'])

    # Simulate processing delay to run in the background
    thread = threading.Thread(target=run_image_processing, args=(task_id,))
    thread.daemon = True
    thread.start()

    return jsonify({"task_id": task_id})

@app.route("/result", methods=["GET"])
def result():
    task_id = request.args.get('task_id')   # Get the task_id from the request
    if not task_id:
        return jsonify({"error": "No task_id provided"}), 400

    if task_id not in task_dict:
        return jsonify({"error": "Task not found"}), 400

    task = task_dict[task_id]
    if task['is_done']:
        return jsonify({"image": task['result']})
    else:
        return jsonify({"error": "Task not done"}), 400


@app.route("/progress", methods=["GET"])
def progress():
    # Add error handling with try except
    try:
        task_id = request.args.get('task_id')
        if not task_id:
            return jsonify({"error": "No task_id provided"}), 400

        if task_id not in task_dict:
            return jsonify({"error": "Task not found"}), 400

        task = task_dict[task_id]
        return jsonify({
                "progress": task['progress'],
                "done": task['is_done']
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


results_dir_processing = r"C:\Users\ShayMoshe\OneDrive - vayyar.com\Documents\Personal\ML\HairSProject\pics\Archive\output_examples\Shay_With_Hair_TBW3_upscaled"
images_processing = load_images(results_dir_processing)

def run_image_processing(task_id):
    global images_processing
    # Simulate progress updates
    for i in range(5):
        time.sleep(0.4)  # Small delay between updates
        task_dict[task_id]['progress'] = (i + 1) * 20  # Update progress in 20% increments

    # Update the task_dict with the result
    task_dict[task_id]['is_done'] = True
    task_dict[task_id]['result'] = images_processing[task_dict[task_id]['index']]



if __name__ == "__main__":
    app.run(host="localhost", port=7860)
    # app.run(host="10.100.102.36", port=7861)

