import requests
import base64
import time
from typing import Literal
from PIL import Image
import io
from io import BytesIO

def image_to_base64(image: Image.Image):
    buffered = BytesIO()
    image.save(buffered, format="JPEG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")

class ModelProfile:
    """
    A model for profile image processing tasks.
    This model can handle profile view generation, hair color changes, and other edits.
    """
    def __init__(self):
        self.name = "ModelProfile"
        self.description = "A model for profile image processing tasks."
        self.__base_url__ = "https://api.bfl.ai/v1/flux-kontext-pro"
        self.__headers__ = {
            "x-key": "396557ef-16f2-4111-bdec-48ccb4e0c12a",
            "Content-Type": "application/json"
        }

    # Load your image and encode it
    def __encode_image__(self, path):
        with open(path, "rb") as f:
            return base64.b64encode(f.read()).decode()

    def __get_image_encoded__(self, image):
        """
        Load an image from a file path and encode it to base64.
        :param image_path: Path to the image file.
        :return: Base64 encoded string of the image.
        """
        if isinstance(image, str):
            with open(image, "rb") as img_file:
                return base64.b64encode(img_file.read()).decode('utf-8')
        elif isinstance(image, bytes):
            return base64.b64encode(image).decode('utf-8')
        elif isinstance(image, Image.Image):
            buffer = io.BytesIO()
            image.save(buffer, format="PNG")
            return base64.b64encode(buffer.getvalue()).decode('utf-8')
        else:
            raise ValueError("Unsupported image type. Must be a file path, bytes, or PIL Image.")

    # __base_url__ = "https://api.bfl.ai/v1/flux-kontext-pro"
    # __headers__ = {
    #     "x-key": "396557ef-16f2-4111-bdec-48ccb4e0c12a",
    #     "Content-Type": "application/json"
    # }


    def run(self, params : dict, progress_callback, cancel_check_callback):
        input_image = params['image']
        mode = params.get('mode', 'profile') #: Literal[')profile', 'color', 'edit']
        color = params.get('color', 'dark brown')
        encoded_image = input_image #self.__get_image_encoded__(input_image)
        if mode == 'profile':
            # prompt = "profile view of the same person. face turn to the side. same identity"
            prompt = "profile view of the same person. face turn to the side. no skin infections, no blemishes, no acne, no discoloration, no skin issues"
        elif mode == 'color':
            prompt = f"change hair color to {color} , keep same haircut and same identity",
        elif mode == 'edit':
            raise NotImplementedError("Edit mode is not implemented yet.")
        else:
            raise ValueError("Invalid mode. Choose from 'profile', 'color', or 'edit'.")
        payload = {
            "output_format": "png",
            "prompt_upsampling": False,
            "safety_tolerance": 6,
            "prompt": prompt,
            "input_image": encoded_image,
            "aspect_ratio": "1:1"
        }

        response = requests.request("POST", self.__base_url__, json=payload, headers=self.__headers__)
        resp_url = response.json()['polling_url']
        resp2 = requests.request("GET", resp_url)
        progress_var = 0.0
        while resp2.json()['status'] == 'Pending' or resp2.json()['status'] == 'Processing':
            resp2 = requests.request("GET", resp_url)
            time.sleep(1)  # Polling interval, adjust as needed
            progress_var += 100 / 5
            if cancel_check_callback():
                raise ValueError("Task was canceled by the user.")
            progress_callback(int(progress_var))  # Update progress
        try :
            img_url = resp2.json()['result']['sample']
            response = requests.get(img_url)
            response.raise_for_status()  # Raises HTTPError if the request failed

            # Load and display the image
            image = Image.open(BytesIO(response.content))
            progress_var = 100
            progress_callback(progress_var)  # Update progress
            img_base_64 = image_to_base64(image)  # Convert image to base64
            return f"data:image/jpeg;base64,{img_base_64}"  # Return the base64 encoded image
        except KeyError:
            print(f"Error in response: {resp2.json()}")
            return None


if __name__ == "__main__":
    # Example usage
    model_profile = ModelProfile()
    # file = r"C:\Temp\pics\Shay\Archive\tmp1.png"
    image1 = r"C:\Users\ShayMoshe\OneDrive - vayyar.com\Documents\Personal\ML\HairSProject\pics\Shay\my_pics_fixed_ratio\Shay0_ChatGPT Image Apr 25, 2025, 07_40_30 PM_part1.jpg"
    # encoded_image1 = encode_image(r"C:\Users\ShayMoshe\OneDrive - vayyar.com\Documents\Personal\ML\HairSProject\pics\Shay\Shay0.jpeg")
    # encoded_image2 = encode_image(r"C:\Users\ShayMoshe\OneDrive - vayyar.com\Documents\Personal\ML\HairSProject\pics\list_of_hairs\arranged\ChatGPT Image Apr 25, 2025, 06_05_56 PM.png")
    input_image_path = r"C:\Users\ShayMoshe\OneDrive - vayyar.com\Documents\Personal\ML\HairSProject\pics\Shay\my_pics_fixed_ratio\Shay0_ChatGPT Image Apr 25, 2025, 07_40_30 PM_part1.jpg"
    result_image = model_profile.run({'image' : image1, 'mode':'profile'})
    result_image.show()  # Display the result image
    print("Done")

