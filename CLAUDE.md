# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Domino Vision 3000 is a React web app that uses AI (YOLOv8s model converted to TensorFlow.js) to detect dominoes from webcam/uploaded images, count pips, and solve domino sequences by finding valid play paths. The model is trained on a double-twelve domino set.

**Live Demo:** https://domino-vision-3000.vercel.app

## Commands

```bash
npm install          # Install dependencies
npm start            # Start development server (http://localhost:3000)
npm test             # Run tests in interactive watch mode
npm run build        # Build for production
```

## Architecture

**Tech Stack:** React 19, TypeScript, Material-UI 6, TensorFlow.js, React Router, Emotion

### Data Flow

1. User captures/uploads image via `Webcam` component
2. `YoloModelTF` runs inference on the image (640x480 grayscale input, 91 classes)
3. Predictions (class, score, bbox) passed to `CountAndSolve`
4. Domino pairs fed to `tiles.combine()` to find valid sequences
5. Results displayed with sorting options

### Key Modules

| Path | Purpose |
|------|---------|
| `src/components/CountAndSolve/CountAndSolve.tsx` | Main app state management, detection results, solving UI |
| `src/components/Webcam/Webcam.tsx` | Camera/image input, live detection, box editing, torch control |
| `src/ai/YoloModelTF.tsx` | TensorFlow.js YOLO model wrapper - preprocessing, inference, NMS |
| `src/ai/ModelConfig.tsx` | Model configuration (91 domino classes 0x0 through 12x12) |
| `src/utils/tiles.js` | Domino sequence solving algorithm (recursive backtracking) |
| `src/components/Domino/Domino.tsx` | Visual domino renderer using PNG sprites |

### Routes

- `/` → Home (landing page)
- `/start` → CountAndSolve (main detection interface)

### Assets

- `public/models/tiles_yolo8s_bw/` - Active TensorFlow.js model
- `public/images/domino_half_*.png` (0-12) - Domino sprite images

## Theme

Purple/indigo MUI theme defined in `App.tsx`:
- Primary: #7e57c2
- Dark background: #212121
