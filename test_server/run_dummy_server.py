# Create a dummy server that returns a predefined loaded list of images from a folder in reponse to a POST request
import os
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load images from the results folder
def load_images():
    images = []
    results_dir = r"C:\Users\ShayMoshe\OneDrive - vayyar.com\Documents\Personal\ML\HairSProject\pics\Archive\output_examples\Shay_With_Hair_TBW3_upscaled"
    if os.path.exists(results_dir):
        for filename in os.listdir(results_dir):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                with open(os.path.join(results_dir, filename), "rb") as img_file:
                    img_data = base64.b64encode(img_file.read()).decode('utf-8')
                    images.append(f"data:image/jpeg;base64,{img_data}")
    return images

@app.route("/", methods=["POST"])
def process_image():
    print("Received a request to process an image")
    # Get the input image from request
    data = request.json
    if not data or 'image' not in data:
        return jsonify({"error": "No image provided"}), 400
        
    # Return the predefined result images
    return jsonify({"images": load_images()})

if __name__ == "__main__":
    # app.run(host="localhost", port=7860)
    app.run(host="10.100.102.36", port=7861)

