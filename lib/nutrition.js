// All nutrition math lives here so the UI and API routes stay consistent.

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUSTMENT = {
  lose: -500,
  maintain: 0,
  gain: 350,
};

// Mifflin-St Jeor equation
export function calcBMR({ gender, weight_kg, height_cm, age }) {
  const base = 10 * Number(weight_kg) + 6.25 * Number(height_cm) - 5 * Number(age);
  return gender === "male" ? Math.round(base + 5) : Math.round(base - 161);
}

export function calcTDEE({ gender, weight_kg, height_cm, age, activity_level }) {
  const bmr = calcBMR({ gender, weight_kg, height_cm, age });
  const multiplier = ACTIVITY_MULTIPLIERS[activity_level] || ACTIVITY_MULTIPLIERS.moderate;
  return { bmr, tdee: Math.round(bmr * multiplier) };
}

export function calcTargets(user) {
  const { bmr, tdee } = calcTDEE(user);
  const adjustment = GOAL_ADJUSTMENT[user.goal] ?? 0;
  const targetCalories = Math.max(1200, tdee + adjustment);

  const proteinPct = Number(user.protein_pct) || 20;
  const carbsPct = Number(user.carbs_pct) || 50;
  const fatPct = Number(user.fat_pct) || 30;

  const proteinG = Math.round((targetCalories * (proteinPct / 100)) / 4);
  const carbsG = Math.round((targetCalories * (carbsPct / 100)) / 4);
  const fatG = Math.round((targetCalories * (fatPct / 100)) / 9);
  const fiberG = Math.round((targetCalories / 1000) * 14); // ~14g fiber per 1000 kcal

  return {
    bmr,
    tdee,
    targetCalories,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    waterTargetMl: Number(user.water_target_ml) || 2500,
  };
}

// Simple 0-100 "nutrition score" for the day based on how close intake is to targets.
export function calcDailyScore({ eaten, targets, waterMl }) {
  const calScore = 1 - Math.min(1, Math.abs(eaten.calories - targets.targetCalories) / targets.targetCalories);
  const proteinScore = Math.min(1, eaten.protein_g / targets.proteinG);
  const waterScore = Math.min(1, waterMl / targets.waterTargetMl);
  const fiberScore = Math.min(1, eaten.fiber_g / targets.fiberG);

  const weighted =
    calScore * 0.35 + proteinScore * 0.3 + waterScore * 0.2 + fiberScore * 0.15;

  return Math.max(0, Math.min(100, Math.round(weighted * 100)));
}

export function emptyMacros() {
  return { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
}

export function sumMacros(rows) {
  return rows.reduce(
    (acc, r) => ({
      calories: acc.calories + Number(r.calories),
      protein_g: acc.protein_g + Number(r.protein_g),
      carbs_g: acc.carbs_g + Number(r.carbs_g),
      fat_g: acc.fat_g + Number(r.fat_g),
      fiber_g: acc.fiber_g + Number(r.fiber_g),
    }),
    emptyMacros()
  );
}

export const MEALS = ["breakfast", "lunch", "dinner", "snacks"];

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
