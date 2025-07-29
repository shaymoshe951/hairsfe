import os
from PIL import Image


def convert_png_to_jpeg(directory):
    # Ensure the directory exists
    if not os.path.isdir(directory):
        print(f"Error: {directory} is not a valid directory")
        return

    # Create output directory if it doesn't exist
    output_dir = os.path.join(directory, "converted_jpegs")
    os.makedirs(output_dir, exist_ok=True)

    # Supported image extensions
    valid_extensions = ('.png', '.PNG')

    # Iterate through all files in the directory
    for filename in os.listdir(directory):
        if filename.lower().endswith(valid_extensions):
            try:
                # Open the image
                img_path = os.path.join(directory, filename)
                img = Image.open(img_path)

                # Convert to RGB if necessary (handles PNGs with transparency)
                if img.mode in ('RGBA', 'LA'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    background.paste(img, mask=img.split()[-1])
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')

                # Create output filename
                output_filename = os.path.splitext(filename)[0] + '.jpg'
                output_path = os.path.join(output_dir, output_filename)

                # Save as JPEG
                img.save(output_path, 'JPEG', quality=95)
                print(f"Converted {filename} to {output_filename}")

                # Close the image
                img.close()

            except Exception as e:
                print(f"Error converting {filename}: {str(e)}")

    print("Conversion complete!")


if __name__ == "__main__":
    # Specify the directory containing PNG files
    directory_path = input("Enter the directory path containing PNG files: ")
    convert_png_to_jpeg(directory_path)