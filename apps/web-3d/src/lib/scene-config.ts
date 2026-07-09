export const SCENE_PRESETS = ["waveField", "orbitals", "torusKnot"] as const;
export type ScenePreset = (typeof SCENE_PRESETS)[number];

export interface SceneConfig {
  preset: ScenePreset;
  /** Base hue in degrees, 0-360. */
  hue: number;
  /** Animation speed multiplier, 0.1-3. */
  speed: number;
  /** Structure density: grid size / body count / knot detail, 6-24. */
  density: number;
}

export const DEFAULT_SCENE: SceneConfig = {
  preset: "waveField",
  hue: 258,
  speed: 1,
  density: 14,
};

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/**
 * Normalizes whatever the model (or a user) hands us into a valid config.
 * Same philosophy as apps/api's Zod gate: model output is never applied
 * to the scene unchecked.
 */
export function sanitizeSceneConfig(
  input: Partial<Record<keyof SceneConfig, unknown>>,
  base: SceneConfig,
): SceneConfig {
  const preset = SCENE_PRESETS.includes(input.preset as ScenePreset)
    ? (input.preset as ScenePreset)
    : base.preset;
  const hue =
    typeof input.hue === "number" && Number.isFinite(input.hue)
      ? ((input.hue % 360) + 360) % 360
      : base.hue;
  const speed =
    typeof input.speed === "number" && Number.isFinite(input.speed)
      ? clamp(input.speed, 0.1, 3)
      : base.speed;
  const density =
    typeof input.density === "number" && Number.isFinite(input.density)
      ? Math.round(clamp(input.density, 6, 24))
      : base.density;

  return { preset, hue, speed, density };
}

export const PRESET_LABELS: Record<ScenePreset, string> = {
  waveField: "Wave field",
  orbitals: "Orbitals",
  torusKnot: "Torus knot",
};
