export interface WatermarkSettings {
  text: string;
  fontSize: number;
  opacity: number;
  rotation: number;
  color: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  shadowBlur: number;
  shadowColor: string;
  isTiled: boolean;
}

export interface PresetPosition {
  label: string;
  x: number;
  y: number;
}

export type Language = 'zh' | 'en';
