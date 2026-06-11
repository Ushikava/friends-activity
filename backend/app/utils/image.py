import io
from PIL import Image, UnidentifiedImageError


def compress_image(data: bytes, max_dimension: int = 1920, quality: int = 85) -> tuple[bytes, str]:
    """
    Resize + convert to WebP. Returns (compressed_bytes, '.webp').
    GIF-анимации возвращаются без изменений.
    Raises ValueError если файл не является изображением.
    """
    try:
        img = Image.open(io.BytesIO(data))
    except UnidentifiedImageError:
        raise ValueError("Неподдерживаемый формат изображения")

    # Анимированные GIF не трогаем
    if getattr(img, "is_animated", False):
        return data, ".gif"

    # Нормализуем цветовой режим
    if img.mode == "P":
        img = img.convert("RGBA")
    elif img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGB")

    # Уменьшаем если нужно
    if max(img.size) > max_dimension:
        img.thumbnail((max_dimension, max_dimension), Image.LANCZOS)

    out = io.BytesIO()
    img.save(out, format="WEBP", quality=quality, method=6)
    return out.getvalue(), ".webp"
