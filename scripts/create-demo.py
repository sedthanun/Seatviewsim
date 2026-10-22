"""Generate an original eight-second calibration film; requires Pillow and imageio-ffmpeg."""
from pathlib import Path
import math
import subprocess
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

root = Path(__file__).resolve().parent.parent
out = root / 'public' / 'media'
out.mkdir(parents=True, exist_ok=True)
font_path = Path('C:/Windows/Fonts/arial.ttf')
font = ImageFont.truetype(str(font_path), 32) if font_path.exists() else ImageFont.load_default()
small = ImageFont.truetype(str(font_path), 14) if font_path.exists() else font
process = subprocess.Popen([imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-f', 'rawvideo', '-vcodec', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '640x360', '-r', '24', '-i', '-', '-f', 'lavfi', '-i', 'sine=frequency=220:sample_rate=44100:duration=8', '-vf', 'format=yuv420p', '-c:v', 'libx264', '-crf', '23', '-c:a', 'aac', '-af', 'volume=0.08,afade=t=in:d=1,afade=t=out:st=7:d=1', '-t', '8', '-movflags', '+faststart', str(out / 'vantage-demo.mp4')], stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
for frame in range(192):
    im = Image.new('RGB', (640, 360), '#101c30')
    d = ImageDraw.Draw(im)
    for y in range(360):
        d.line((0, y, 640, y), fill=(12 + y // 32, 22 + y // 25, 38 + y // 16))
    for x in range(-640, 1300, 90):
        d.line((320, 190, x, 360), fill='#354e70', width=1)
    for i in range(10):
        y = 190 + ((i * 22 + frame * .8) % 175)
        d.line((0, y, 640, y), fill='#354e70', width=1)
    cx = 320 + math.sin(frame / 30) * 160
    d.ellipse((cx - 17, 94, cx + 17, 128), fill='#b4d6ff')
    d.rectangle((16, 16, 623, 343), outline='#7891b3', width=1)
    d.text((320, 151), 'V A N T A G E', font=font, anchor='mm', fill='#dfedff')
    d.text((320, 187), 'YOUR SEAT. YOUR PERSPECTIVE.', font=small, anchor='mm', fill='#b3c5df')
    d.text((32, 320), 'ORIGINAL CALIBRATION FILM  /  16:9', font=small, fill='#b3c5df')
    d.text((535, 320), f'{frame / 24:04.1f}s', font=small, fill='#b3c5df')
    process.stdin.write(im.tobytes())
process.stdin.close()
if process.wait() != 0:
    raise RuntimeError('Video encoding failed')
print(out / 'vantage-demo.mp4')
