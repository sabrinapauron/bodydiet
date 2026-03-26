import type { EffortEntry, EffortIntensity, EffortLinearType } from "../storage/bodyStore";

export type MacroTargets = {
  protein: number;
  carbs: number;
  fat: number;
  kcal?: number;
};

const PRUDENCE = 0.7;

function round(n: number) {
  return Math.max(0, Math.round(n));
}

function kcalPerKm(type: EffortLinearType, intensity: EffortIntensity): number {
  // Simple + réaliste, ajustable plus tard
  const table: Record<EffortLinearType, Record<EffortIntensity, number>> = {
    walk: { light: 30, moderate: 40, intense: 50 },
    run: { light: 60, moderate: 72, intense: 85 },
    bike: { light: 25, moderate: 32, intense: 42 },
  };
  return table[type][intensity];
}

function kcalPerMinGym(intensity: EffortIntensity): number {
  const table: Record<EffortIntensity, number> = {
    light: 4,
    moderate: 6,
    intense: 8,
  };
  return table[intensity];
}

export function computeEffortBonus(effort: EffortEntry | null) {
  if (!effort) {
    return {
      rawKcal: 0,
      appliedKcal: 0,
      bonusCarbG: 0,
      bonusFatG: 0,
    };
  }

  let raw = 0;

  if (effort.kind === "linear") {
    raw = effort.km * kcalPerKm(effort.type, effort.intensity);
  } else {
    raw = effort.minutes * kcalPerMinGym(effort.intensity);
  }

  const applied = raw * PRUDENCE;

  // 80% carbs / 20% fat
  const bonusCarbG = (applied * 0.8) / 4;
  const bonusFatG = (applied * 0.2) / 9;

  return {
    rawKcal: raw,
    appliedKcal: applied,
    bonusCarbG: bonusCarbG,
    bonusFatG: bonusFatG,
  };
}

export function applyEffortToTargets(targets: MacroTargets, effort: EffortEntry | null): MacroTargets & {
  bonusCarbG: number;
  bonusFatG: number;
  appliedKcal: number;
} {
  const b = computeEffortBonus(effort);

  return {
    ...targets,
    // protéines inchangées
    carbs: round(targets.carbs + b.bonusCarbG),
    fat: round(targets.fat + b.bonusFatG),
    bonusCarbG: round(b.bonusCarbG),
    bonusFatG: round(b.bonusFatG),
    appliedKcal: Math.round(b.appliedKcal),
  };
}

export function formatEffortLabel(effort: EffortEntry | null) {
  if (!effort) return "Aucun";

  const intensityLabel =
    effort.intensity === "light" ? "léger" : effort.intensity === "moderate" ? "modéré" : "intense";

  if (effort.kind === "linear") {
    const typeLabel = effort.type === "walk" ? "Marche" : effort.type === "run" ? "Course" : "Vélo";
    return `${typeLabel} • ${effort.km} km • ${intensityLabel}`;
  }

  return `Salle • ${effort.minutes} min • ${intensityLabel}`;
}