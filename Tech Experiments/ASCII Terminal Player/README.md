# 🎬 ASCII Video Player

A terminal-based video player that converts any MP4 video into **colorful ASCII art** and plays it directly in your terminal — in real time!

---

## ✨ Features

- 🎨 **Full-color ASCII rendering** using 24-bit RGB ANSI escape codes
- ⚡ **Real-time frame conversion** with edge detection (Sobel filter) for sharper character mapping
- 📐 **Dynamic terminal resizing** — adapts to your terminal window size every 30 frames
- ✂️ **Smart auto-crop** — automatically detects and removes black bars (letterboxing)
- 🔀 **Frame skipping** to maintain sync when rendering falls behind
- 🖥️ **Works on any terminal** that supports 24-bit color (Windows Terminal, iTerm2, etc.)

---

## 📦 Requirements

- Python 3.7+
- [OpenCV](https://pypi.org/project/opencv-python/) (`cv2`)
- [NumPy](https://pypi.org/project/numpy/)

Install dependencies:

```bash
pip install opencv-python numpy
```

---

## 🚀 Usage

1. Place your `.mp4` video file in the same directory as `ascii_player.py`.
2. Edit the `video_path` variable at the bottom of the script:

```python
video_path = "your_video.mp4"
```

1. Run the player:

```bash
python ascii_player.py
```

> Press `Ctrl+C` to stop playback at any time.

---

## 🛠️ How It Works

| Step | Description |
|------|-------------|
| **1. Frame Read** | Each frame is read from the video using OpenCV |
| **2. Auto-Crop** | Black bars are detected and removed from top/bottom |
| **3. Resize** | Frame is scaled to fit the current terminal dimensions |
| **4. CLAHE Enhancement** | Contrast is boosted in LAB color space for better detail |
| **5. Edge Boost** | Sobel filter adds edge intensity to pixel brightness |
| **6. Char Mapping** | Brightness values are mapped to a 90-character ASCII palette |
| **7. Color Coding** | Each character is wrapped in a 24-bit ANSI color code |
| **8. Render** | The full frame is written to stdout in one flush |

---

## 🎨 ASCII Character Palette

The player uses a gradient of **90 characters**, ordered from darkest to brightest:

```
 `.-':_,^=;<>+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Wg0MNBQ%&@
```

---

## ⚙️ Configuration

You can tweak these values inside `ascii_player.py` to adjust the output:

| Variable | Default | Description |
|----------|---------|-------------|
| `quant` | `16` | Color quantization step (lower = more colors, slower) |
| `clipLimit` | `2.5` | CLAHE contrast limit |
| `tileGridSize` | `(4, 4)` | CLAHE tile size |
| `aspect * 0.45` | `0.45` | Vertical character aspect ratio correction |

---

## 📝 Notes

- For best results, use a terminal with a **small font size** and **dark background**.
- **Windows Terminal** with PowerShell or CMD works great.
- The video file path is currently hardcoded — you can modify `ascii_player.py` to accept a command-line argument.

---

## 📄 License

This project is open source. Feel free to use, modify, and share it!
