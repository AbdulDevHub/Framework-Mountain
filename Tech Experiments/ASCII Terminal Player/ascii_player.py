import cv2
import os
import time
import shutil
import sys
import numpy as np
from moviepy import VideoFileClip
import pygame

ASCII_CHARS = np.array(list("@"))

def play_audio():
    pygame.mixer.init()
    pygame.mixer.music.load(audio_file)
    pygame.mixer.music.play()


def audio_delete():
    while pygame.mixer.music.get_busy():
        pygame.time.Clock().tick(10)
    pygame.mixer.quit()
    os.remove(audio_file)


def detect_crop(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    h = gray.shape[0]
    threshold = 8
    top = 0
    bot = h
    for y in range(h // 3):
        if gray[y, :].mean() > threshold:
            top = y
            break
    for y in range(h - 1, 2 * h // 3, -1):
        if gray[y, :].mean() > threshold:
            bot = y + 1
            break
    if bot - top < h * 0.5:
        return 0, h
    return top, bot


def frame_to_ascii(frame, new_width, new_height, crop_top, crop_bot):
    cropped = frame[crop_top:crop_bot, :]
    resized = cv2.resize(cropped, (new_width, new_height))

    lab = cv2.cvtColor(resized, cv2.COLOR_BGR2LAB)
    l, a, b_ch = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(4, 4))
    l = clahe.apply(l)
    resized = cv2.cvtColor(cv2.merge((l, a, b_ch)), cv2.COLOR_LAB2BGR)

    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY).astype(np.float32)

    sobel_x = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    sobel_y = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    edges = np.sqrt(sobel_x**2 + sobel_y**2)
    emax = edges.max()
    if emax > 0:
        edges = (edges / emax) * 60
    boosted = np.clip(gray + edges, 0, 255)

    char_idx = (boosted / 255.0 * (len(ASCII_CHARS) - 1)).astype(np.uint8)
    chars = ASCII_CHARS[char_idx]

    quant = 16
    r_q = ((resized[:, :, 2].astype(np.uint16) // quant) * quant).astype(np.uint8)
    g_q = ((resized[:, :, 1].astype(np.uint16) // quant) * quant).astype(np.uint8)
    b_q = ((resized[:, :, 0].astype(np.uint16) // quant) * quant).astype(np.uint8)

    lines = []
    for row_idx in range(new_height):
        row_r = r_q[row_idx]
        row_g = g_q[row_idx]
        row_b = b_q[row_idx]
        row_chars = chars[row_idx]

        colors = np.stack([row_r, row_g, row_b], axis=1)
        change_mask = np.any(colors[1:] != colors[:-1], axis=1)
        change_cols = np.where(change_mask)[0] + 1
        boundaries = np.concatenate([[0], change_cols, [new_width]])

        parts = []
        for i in range(len(boundaries) - 1):
            s = int(boundaries[i])
            e = int(boundaries[i + 1])
            rc = int(row_r[s])
            gc = int(row_g[s])
            bc = int(row_b[s])
            seg = "".join(row_chars[s:e].tolist())
            parts.append(f"\033[38;2;{rc};{gc};{bc}m{seg}")

        lines.append("".join(parts) + "\033[0m")

    return "\n".join(lines)


def play_video(video_path):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Cannot open video {video_path!r}")
        return

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 30
    frame_delay = 1.0 / fps

    os.system("")
    sys.stdout.write("\033[?25l")
    sys.stdout.flush()

    ret, first_frame = cap.read()
    if not ret:
        print("Error: Cannot read video.")
        cap.release()
        return
    crop_top, crop_bot = detect_crop(first_frame)
    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)

    terminal_size = shutil.get_terminal_size((80, 24))
    cols = terminal_size.columns
    rows = terminal_size.lines - 1
    cropped_h = crop_bot - crop_top
    video_w = first_frame.shape[1]
    aspect = cropped_h / video_w
    new_width = cols
    new_height = int(new_width * aspect * 0.45)
    if new_height >= rows:
        new_height = rows
        new_width = int(new_height / (aspect * 0.45))
        if new_width > cols:
            new_width = cols
    new_width = max(1, new_width)
    new_height = max(1, new_height)

    try:
        sys.stdout.write("\033[2J\033[H")
        sys.stdout.flush()

        frame_num = 0
        video_start = time.perf_counter()

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            frame_num += 1

            if frame_num % 30 == 0:
                terminal_size = shutil.get_terminal_size((80, 24))
                cols = terminal_size.columns
                rows = terminal_size.lines - 1
                new_width = cols
                new_height = int(new_width * aspect * 0.45)
                if new_height >= rows:
                    new_height = rows
                    new_width = int(new_height / (aspect * 0.45))
                    if new_width > cols:
                        new_width = cols
                new_width = max(1, new_width)
                new_height = max(1, new_height)

            ascii_str = frame_to_ascii(frame, new_width, new_height, crop_top, crop_bot)
            sys.stdout.write("\033[H" + ascii_str)
            sys.stdout.flush()

            actual_elapsed = time.perf_counter() - video_start
            expected_time = frame_num * frame_delay
            sleep_time = expected_time - actual_elapsed

            if sleep_time > 0:
                time.sleep(sleep_time)
            elif sleep_time < -frame_delay:
                frames_to_skip = int(-sleep_time / frame_delay)
                frames_to_skip = min(frames_to_skip, 8)
                for _ in range(frames_to_skip):
                    cap.read()
                    frame_num += 1

    except KeyboardInterrupt:
        pass
    finally:
        cap.release()
        sys.stdout.write("\033[?25h\033[0m\033[2J\033[H")
        sys.stdout.flush()
        print("Playback finished.")


if __name__ == "__main__":
    video_path = "Sample-5s.mp4"
    audio_file = "temp_audio.mp3"

    clip = VideoFileClip(video_path)
    clip.audio.write_audiofile(audio_file, logger=None)  
 
    play_audio() 
    play_video(video_path)
    audio_delete()