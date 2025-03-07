export interface ModelConfig {
    modelUrl: string
    modelClasses: string[]
}

export const DOMINO_YOLOV8s: ModelConfig = {
    modelUrl: './models/tiles_yolo8s/model.json',
    modelClasses: [
        "3x6", "3x10", "2x5", "11x11", "0x8", "4x10", "1x6", "5x9", "0x3", "4x8",
        "2x12", "11x12", "9x9", "2x11", "6x11", "3x12", "5x5", "3x11", "4x6", "5x8",
        "2x2", "3x3", "5x11", "9x12", "7x11", "1x11", "9x11", "4x12", "4x4", "5x10",
        "0x4", "7x9", "2x9", "7x12", "2x4", "5x7", "5x12", "7x7", "10x12", "8x8",
        "1x1", "2x3", "3x9", "8x9", "12x12", "0x6", "7x8", "8x11", "6x7", "2x8",
        "3x4", "0x11", "1x7", "0x2", "3x5", "1x10", "6x8", "1x8", "0x1", "1x3",
        "6x6", "2x10", "0x10", "6x12", "1x2", "0x9", "4x9", "1x4", "0x12", "2x7",
        "10x10", "0x7", "4x7", "10x11", "8x12", "6x9", "2x6", "3x7", "3x8", "1x12",
        "4x11", "1x5", "7x10", "5x6", "9x10", "8x10", "4x5", "0x5", "0x0", "6x10",
        "1x9"
      ]
}