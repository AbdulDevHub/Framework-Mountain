
# 🖼️ Image Resizer

<div style="display: flex; justify-content: center">
  <img src="assets/screen.png" width="400" />
</div>

## Overview

An Electron application that allows you to select an image and easily change its width and/or height.

## Setup

To run the Image Resizer locally:

1. Navigate to the project folder:

   ```bash
   cd "Image Resizer"
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the app:

   ```bash
   npm start
   ```

You can also use **Electronmon** to auto-reload during development:

```bash
npx electronmon .
```

## Packaging

There are multiple ways to package Electron apps.
[Eelectron Forge](https://www.electronforge.io/) is recommended, though packaging is not implemented in this project.

## Developer Mode

* When `NODE_ENV=development`, DevTools are enabled and open by default.
* When `NODE_ENV=production`, DevTools are disabled.
