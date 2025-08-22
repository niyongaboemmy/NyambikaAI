import os
import shutil
import subprocess
import shlex
from typing import Optional
from PIL import Image
import cv2
import numpy as np


def _placeholder_overlay(person_path: str, cloth_path: str, out_path: str) -> None:
    """A naive overlay fallback: resize cloth to ~60% of person width and paste around upper torso.

    This is only for debugging/demo when a real ClothFlow command is not configured.
    """
    person = Image.open(person_path).convert("RGBA")
    cloth = Image.open(cloth_path).convert("RGBA")

    # --- sizing controls ---
    def _get_float_env(name: str, default: float) -> float:
        try:
            return float(os.getenv(name, str(default)))
        except Exception:
            return default

    def _get_int_env(name: str, default: int) -> int:
        try:
            return int(float(os.getenv(name, str(default))))
        except Exception:
            return default

    allow_upscale = os.getenv("CF_ALLOW_UPSCALE", "false").lower() in ("1", "true", "yes", "on")
    scale = _get_float_env("CF_CLOTH_SCALE", 0.5)
    # clamp scale; permit >1 only when upscaling allowed
    if allow_upscale:
        if not (0.05 <= scale <= 2.5):
            scale = 0.5
    else:
        if not (0.05 <= scale <= 1.0):
            scale = 0.5

    face_anchor = os.getenv("CF_FACE_ANCHOR", "false").lower() in ("1", "true", "yes", "on")
    face_offset_y = _get_int_env("CF_FACE_OFFSET_Y", 20)
    face_width_mult = _get_float_env("CF_FACE_WIDTH_MULT", 2.0)

    # default target width from person width * scale
    target_w = max(1, int(person.width * scale))

    face_center = None
    face_width = None
    if face_anchor:
        try:
            # detect face on the PERSON image (RGB -> BGR for cv2)
            person_bgr = cv2.cvtColor(np.array(person.convert("RGB")), cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(person_bgr, cv2.COLOR_BGR2GRAY)
            detector = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
            faces = detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(40, 40))
            if len(faces) > 0:
                # choose the largest face
                x, y, w, h = max(faces, key=lambda r: r[2] * r[3])
                face_center = (x + w // 2, y + h // 2)
                face_width = w
                # derive target width from face width
                fw_target = int(w * max(0.5, face_width_mult))
                # cap to 90% of person width
                fw_target = min(fw_target, int(person.width * 0.9))
                if fw_target > 0 and (fw_target < cloth.width or allow_upscale):
                    target_w = fw_target
        except Exception:
            pass

    # compute resized cloth
    if cloth.width != target_w:
        if cloth.width > target_w or allow_upscale:
            cloth_ratio = cloth.height / max(1, cloth.width)
            target_h = max(1, int(target_w * cloth_ratio))
            cloth_resized = cloth.resize((target_w, target_h), Image.LANCZOS)
        else:
            cloth_resized = cloth
    else:
        cloth_resized = cloth

    # --- placement controls ---
    cw, ch = cloth_resized.size
    # If face anchor available, place below face; else use fractional anchors
    if face_anchor and face_center is not None:
        anchor_x = face_center[0]
        anchor_y = (face_center[1] + (face_width or 0) // 2) + face_offset_y
        offset_x = int(anchor_x - cw * 0.5)
        offset_y = int(anchor_y)
    else:
        pos_x = _get_float_env("CF_POS_X", 0.5)
        pos_y = _get_float_env("CF_POS_Y", 0.28)
        # clamp
        pos_x = 0.0 if pos_x < 0.0 else (1.0 if pos_x > 1.0 else pos_x)
        pos_y = 0.0 if pos_y < 0.0 else (1.0 if pos_y > 1.0 else pos_y)
        offset_x = int(person.width * pos_x - cw * 0.5)
        offset_y = int(person.height * pos_y - ch * 0.5)

    # pixel nudges
    nudge_x = _get_int_env("CF_OFFSET_X", 0)
    nudge_y = _get_int_env("CF_OFFSET_Y", 0)
    offset_x += nudge_x
    offset_y += nudge_y

    # clamp to canvas
    offset_x = max(0, min(person.width - cw, offset_x))
    offset_y = max(0, min(person.height - ch, offset_y))

    # Composite with alpha if present
    out = person.copy()
    out.alpha_composite(cloth_resized, (offset_x, offset_y))
    # Preserve transparency in the output PNG
    out.save(out_path)


def generate_tryon(person_path: str, cloth_path: str, outputs_dir: str, seed: Optional[int] = 42) -> str:
    """
    Execute a real ClothFlow pipeline if CLOTHFLOW_CMD is set.
    CLOTHFLOW_CMD can contain placeholders {person} {cloth} {output} {seed} and will be formatted.
    Example:
      CLOTHFLOW_CMD="python /path/to/inference.py --person {person} --cloth {cloth} --output {output} --seed {seed}"

    If CLOTHFLOW_CMD is not set, falls back to a placeholder composite.
    Returns absolute path to the output image.
    """
    os.makedirs(outputs_dir, exist_ok=True)
    out_path = os.path.abspath(
        os.path.join(
            outputs_dir,
            os.path.basename(person_path).replace("_person", "_tryon").rsplit(".", 1)[0] + ".png",
        )
    )

    clothflow_cmd = os.getenv("CLOTHFLOW_CMD", "").strip()
    placeholder_enabled = os.getenv("CF_PLACEHOLDER", "false").lower() in ("1", "true", "yes", "on")
    remove_bg_enabled = os.getenv("CF_REMOVE_BG", "true").lower() in ("1", "true", "yes", "on")
    trim_alpha_enabled = os.getenv("CF_TRIM_ALPHA", "true").lower() in ("1", "true", "yes", "on")
    autocrop_enabled = os.getenv("CF_AUTOCROP", "false").lower() in ("1", "true", "yes", "on")

    # Preprocess garment: first remove background to RGBA, then optionally tighten bbox
    cloth_proc_path = cloth_path
    if remove_bg_enabled:
        try:
            cloth_proc_path = _remove_bg_cloth(cloth_proc_path)
        except Exception:
            cloth_proc_path = cloth_path
        if trim_alpha_enabled:
            try:
                cloth_proc_path = _trim_alpha(cloth_proc_path)
            except Exception:
                pass
    if autocrop_enabled:
        try:
            cloth_proc_path = _autocrop_cloth(cloth_proc_path)
        except Exception:
            pass

    if clothflow_cmd:
        cmd = clothflow_cmd.format(
            person=shlex.quote(person_path),
            cloth=shlex.quote(cloth_proc_path),
            output=shlex.quote(out_path),
            seed=int(seed or 42),
        )
        # When formatting with shlex.quote, avoid double-quoting by running via shell
        try:
            subprocess.check_call(cmd, shell=True)
            if not os.path.exists(out_path):
                raise RuntimeError("ClothFlow command finished but output not found")
            return out_path
        except subprocess.CalledProcessError as e:
            if placeholder_enabled:
                _placeholder_overlay(person_path, cloth_proc_path, out_path)
                return out_path
            raise RuntimeError(f"ClothFlow command failed: {e}")
        except Exception as e:
            if placeholder_enabled:
                _placeholder_overlay(person_path, cloth_proc_path, out_path)
                return out_path
            raise

    # No command configured
    if placeholder_enabled:
        try:
            _placeholder_overlay(person_path, cloth_proc_path, out_path)
            return out_path
        except Exception:
            # As a very last resort, just copy person to output
            shutil.copyfile(person_path, out_path)
            return out_path
    else:
        raise RuntimeError("CLOTHFLOW_CMD is not set and CF_PLACEHOLDER is disabled")


def _autocrop_cloth(cloth_path: str) -> str:
    """Attempt to auto-crop the garment region from the background using GrabCut.

    Returns path to a new cropped image if successful; otherwise returns the original path.
    """
    img = cv2.imread(cloth_path)
    if img is None:
        return cloth_path

    h, w = img.shape[:2]
    if h < 10 or w < 10:
        return cloth_path

    # Initial rectangle covering central area
    rect_margin = 0.05
    x = int(w * rect_margin)
    y = int(h * rect_margin)
    rw = max(1, int(w * (1.0 - 2 * rect_margin)))
    rh = max(1, int(h * (1.0 - 2 * rect_margin)))

    mask = np.zeros((h, w), np.uint8)
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)

    try:
        cv2.grabCut(img, mask, (x, y, rw, rh), bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)
    except Exception:
        return cloth_path

    # Create binary mask of probable/definite foreground
    mask2 = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 1, 0).astype("uint8")

    # Find bounding box of the foreground
    ys, xs = np.where(mask2 > 0)
    if ys.size == 0 or xs.size == 0:
        return cloth_path

    y1, y2 = int(ys.min()), int(ys.max())
    x1, x2 = int(xs.min()), int(xs.max())

    # Reject tiny crops
    min_area = 0.05 * (h * w)
    if (y2 - y1 + 1) * (x2 - x1 + 1) < min_area:
        return cloth_path

    cropped = img[y1:y2 + 1, x1:x2 + 1]
    out_path = os.path.splitext(cloth_path)[0] + "_acrop.png"
    cv2.imwrite(out_path, cropped)
    return out_path


def _remove_bg_cloth(cloth_path: str) -> str:
    """Remove background using GrabCut and output a transparent PNG (RGBA).

    Keeps original dimensions, creates an alpha matte from foreground mask, and preserves colors.
    """
    img_bgr = cv2.imread(cloth_path, cv2.IMREAD_COLOR)
    if img_bgr is None:
        return cloth_path

    h, w = img_bgr.shape[:2]
    if h < 10 or w < 10:
        return cloth_path

    # Initialize with a central rectangle as probable foreground
    rect_margin = 0.03
    x = int(w * rect_margin)
    y = int(h * rect_margin)
    rw = max(1, int(w * (1.0 - 2 * rect_margin)))
    rh = max(1, int(h * (1.0 - 2 * rect_margin)))

    mask = np.zeros((h, w), np.uint8)
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)
    try:
        cv2.grabCut(img_bgr, mask, (x, y, rw, rh), bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)
    except Exception:
        return cloth_path

    fg_mask = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype("uint8")

    # Feather edges slightly for cleaner composites
    try:
        fg_mask = cv2.GaussianBlur(fg_mask, (5, 5), 0)
    except Exception:
        pass

    img_rgba = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2BGRA)
    img_rgba[:, :, 3] = fg_mask

    out_path = os.path.splitext(cloth_path)[0] + "_nobg.png"
    cv2.imwrite(out_path, img_rgba)
    return out_path


def _trim_alpha(cloth_path: str) -> str:
    """Trim fully transparent margins from an RGBA image and save a cropped copy.

    If the image has no alpha or no non-transparent pixels, returns the original path.
    """
    img = cv2.imread(cloth_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        return cloth_path
    if img.ndim < 3 or img.shape[2] < 4:
        return cloth_path

    alpha = img[:, :, 3]
    ys, xs = np.where(alpha > 0)
    if ys.size == 0 or xs.size == 0:
        return cloth_path

    y1, y2 = int(ys.min()), int(ys.max())
    x1, x2 = int(xs.min()), int(xs.max())

    # Small padding to avoid harsh cuts
    pad = 2
    y1 = max(0, y1 - pad)
    x1 = max(0, x1 - pad)
    y2 = min(img.shape[0] - 1, y2 + pad)
    x2 = min(img.shape[1] - 1, x2 + pad)

    cropped = img[y1:y2 + 1, x1:x2 + 1]
    out_path = os.path.splitext(cloth_path)[0] + "_trim.png"
    cv2.imwrite(out_path, cropped)
    return out_path
