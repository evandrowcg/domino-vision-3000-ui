export interface ModelConfig {
    modelUrl: string
    modelClasses: string[]
}

export const DOMINO_YOLOV8s: ModelConfig = {
    modelUrl: './models/tiles_yolo8s_bw/model.json',
    modelClasses: [
        "0x0", "0x1", "0x2", "0x3", "0x4", "0x5", "0x6", "0x7", "0x8", "0x9", "0x10", "0x11", "0x12",
        "1x1", "1x2", "1x3", "1x4", "1x5", "1x6", "1x7", "1x8", "1x9", "1x10", "1x11", "1x12",
        "2x2", "2x3", "2x4", "2x5", "2x6", "2x7", "2x8", "2x9", "2x10", "2x11", "2x12",
        "3x3", "3x4", "3x5", "3x6", "3x7", "3x8", "3x9", "3x10", "3x11", "3x12",
        "4x4", "4x5", "4x6", "4x7", "4x8", "4x9", "4x10", "4x11", "4x12",
        "5x5", "5x6", "5x7", "5x8", "5x9", "5x10", "5x11", "5x12",
        "6x6", "6x7", "6x8", "6x9", "6x10", "6x11", "6x12",
        "7x7", "7x8", "7x9", "7x10", "7x11", "7x12",
        "8x8", "8x9", "8x10", "8x11", "8x12",
        "9x9", "9x10", "9x11", "9x12",
        "10x10", "10x11", "10x12",
        "11x11", "11x12",
        "12x12"
      ]
}