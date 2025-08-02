# server_model_hairtransfer.py
import base64
import io
import os
import time  # For simulation
import hashlib

from PIL import Image


class ModelHairTransfer:
    def __init__(self):
        self.name = "ModelHairTransfer"
        self.description = "A model for hair transfer tasks."
        self.hair_styles_dir = r"C:\Users\ShayMoshe\OneDrive - vayyar.com\Documents\Personal\ML\HairSProject\pics\list_of_hairs\arranged"
        self.target_styles_images = self.__load_images__(self.hair_styles_dir)  # Load images at initialization
        self.results_dir_processing = r"C:\Users\ShayMoshe\OneDrive - vayyar.com\Documents\Personal\ML\HairSProject\pics\Archive\output_examples\Shay_With_Hair_TBW3_upscaled"
        self.images_processed = self.__load_images__(self.results_dir_processing)
        self.source_images = {}  # Store source images by their ID

    def __load_images__(self, results_dir):
        images = []
        if os.path.exists(results_dir):
            for filename in os.listdir(results_dir):
                if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                    # images.append(Image.open(os.path.join(results_dir, filename)))
                    with open(os.path.join(results_dir, filename), "rb") as img_file:
                        img_data = base64.b64encode(img_file.read()).decode('utf-8')
                        images.append(f"data:image/jpeg;base64,{img_data}")
                        # images.append(f"data:image/{filename.lower()};base64,{img_data}")

        return images

    def upload_source_image(self, image_data: bytes, progress_callback=None, cancel_check_callback=None):
        # Example: Simulate image processing (e.g., open with PIL, do ML inference)
        try:
            img = Image.open(io.BytesIO(image_data))
            source_image_id = hashlib.sha256(image_data).hexdigest()
            self.source_images[source_image_id] = {'image' : img, 'bald_source' : None}  # Store the source image by its ID
            return self.target_styles_images, source_image_id
        except Exception as e:
            raise ValueError(f"Image processing failed: {str(e)}")

    def run(self, params, progress_callback=None, cancel_check_callback=None):
        total_steps = 7
        for step in range(total_steps):
            if cancel_check_callback:
                cancel_check_callback()  # Raises if canceled
            # Do ML work here...
            time.sleep(0.5)  # Simulate work
            if progress_callback:
                progress_callback((step + 1) / total_steps * 100)
        print("ModelHairTransfer run completed with params:", params)
        return self.images_processed[params['index']]