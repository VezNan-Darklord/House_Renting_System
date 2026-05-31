import base64
import os
from typing import List

UPLOAD_DIR = "uploads"


def image_url_to_base64(image_url: str) -> str:
    """
    将图片URL转换为Base64编码

    Args:
        image_url: 图片URL路径，如 "/uploads/xxx.jpg"

    Returns:
        Base64编码的图片字符串，格式为 "data:image/jpeg;base64,xxxxx"
    """
    if not image_url:
        return ""

    try:
        filename = os.path.basename(image_url)
        filepath = os.path.join(UPLOAD_DIR, filename)

        if not os.path.exists(filepath):
            return ""

        with open(filepath, "rb") as img_file:
            img_data = img_file.read()

        base64_data = base64.b64encode(img_data).decode('utf-8')

        extension = filename.split('.')[-1].lower() if '.' in filename else 'jpg'
        mime_types = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp'
        }
        mime_type = mime_types.get(extension, 'image/jpeg')

        return f"data:{mime_type};base64,{base64_data}"

    except Exception as e:
        print(f"Error converting image to base64: {e}")
        return ""


def images_urls_to_base64(image_urls: List[str]) -> List[str]:
    """
    将图片URL列表转换为Base64编码列表

    Args:
        image_urls: 图片URL列表

    Returns:
        Base64编码的图片列表
    """
    return [image_url_to_base64(url) for url in image_urls if url]
