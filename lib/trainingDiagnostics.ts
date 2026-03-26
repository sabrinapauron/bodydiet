export type DiagnosticCategory = "musculation" | "course" | "silhouette" | "ia spécialisée";

export type DiagnosticQuestion =
  | {
    id: string;
    label: string;
    type: "choice";
    options: { value: string; label: string }[];
  }
  | {
    id: string;
    label: string;
    type: "boolean";
  }
  | {
    id: string;
    label: string;
    type: "text";
  };
export type DiagnosticCause = {
  id: string;
  label: string;
};

export type DiagnosticCase = {
  id: string;
  title: string;
  category: DiagnosticCategory;
  intro: string;
  questions: DiagnosticQuestion[];
  causes: DiagnosticCause[];
  computeScores: (answers: Record<string, string | boolean>) => DiagnosticCauseScore[];
  correction: string[];
  test14Days: string[];
};

export type DiagnosticCauseScore = {
  id: string;
  label: string;
  score: number; // 0..100
};

function normalizeScores(items: DiagnosticCauseScore[]): DiagnosticCauseScore[] {
  const max = Math.max(...items.map((i) => i.score), 1);
  return items
    .map((item) => ({
      ...item,
      score: Math.max(5, Math.min(100, Math.round((item.score / max) * 100))),
    }))
    .sort((a, b) => b.score - a.score);
}

export const TRAINING_DIAGNOSTICS: DiagnosticCase[] = [
  {
    id: "pecs_stagnate",
    title: "Pectoraux qui ne se développent pas",
    category: "musculation",
    intro: "Analyse basée sur les erreurs les plus fréquentes observées chez les sportifs.",
    questions: [
      {
        id: "bench_freq",
        label: "Tu travailles les pectoraux combien de fois par semaine ?",
        type: "choice",
        options: [
          { value: "low", label: "0 à 1 fois" },
          { value: "medium", label: "2 fois" },
          { value: "high", label: "3 fois ou plus" },
        ],
      },
      {
        id: "shoulders_take_over",
        label: "Tu sens surtout les épaules pendant les développés ?",
        type: "boolean",
      },
      {
        id: "full_range",
        label: "Tu descends suffisamment sur tes mouvements ?",
        type: "choice",
        options: [
          { value: "partial", label: "Pas toujours" },
          { value: "full", label: "Oui, amplitude complète" },
        ],
      },
      {
        id: "load_level",
        label: "La charge utilisée est plutôt :",
        type: "choice",
        options: [
          { value: "light", label: "Légère" },
          { value: "medium", label: "Moyenne" },
          { value: "heavy", label: "Lourde" },
        ],
      },
    ],
    causes: [
      { id: "shoulder_dominance", label: "Épaules dominantes" },
      { id: "short_range", label: "Amplitude trop courte" },
      { id: "load_too_light", label: "Charge trop faible" },
      { id: "frequency_too_low", label: "Fréquence insuffisante" },
    ],
    computeScores: (answers) =>
      normalizeScores([
        {
          id: "shoulder_dominance",
          label: "Épaules dominantes",
          score: (answers.shoulders_take_over === true ? 45 : 10) + (answers.full_range === "partial" ? 10 : 0),
        },
        {
          id: "short_range",
          label: "Amplitude trop courte",
          score: answers.full_range === "partial" ? 40 : 10,
        },
        {
          id: "load_too_light",
          label: "Charge trop faible",
          score: answers.load_level === "light" ? 38 : answers.load_level === "medium" ? 18 : 8,
        },
        {
          id: "frequency_too_low",
          label: "Fréquence insuffisante",
          score: answers.bench_freq === "low" ? 35 : answers.bench_freq === "medium" ? 18 : 8,
        },
      ]),
    correction: [
      "Rapprocher les omoplates avant la poussée",
      "Contrôler la descente",
      "Chercher une vraie tension dans les pectoraux",
      "Garder 2 séances poitrine par semaine si besoin",
    ],
    test14Days: [
      "2 séances pectoraux par semaine",
      "Amplitude propre sur chaque répétition",
      "Tempo contrôlé à la descente",
      "Noter les sensations pectoraux après chaque séance",
    ],
  },
  {
    id: "calves_stagnate",
    title: "Mollets qui ne grossissent pas",
    category: "musculation",
    intro: "Analyse basée sur les erreurs les plus fréquentes observées chez les sportifs.",
    questions: [
      {
        id: "calves_freq",
        label: "Tu entraînes les mollets combien de fois par semaine ?",
        type: "choice",
        options: [
          { value: "low", label: "0 à 1 fois" },
          { value: "medium", label: "2 fois" },
          { value: "high", label: "3 fois ou plus" },
        ],
      },
      {
        id: "calves_load",
        label: "La charge est plutôt :",
        type: "choice",
        options: [
          { value: "light", label: "Légère" },
          { value: "medium", label: "Moyenne" },
          { value: "heavy", label: "Lourde" },
        ],
      },
      {
        id: "calves_range",
        label: "Tu descends complètement le talon ?",
        type: "choice",
        options: [
          { value: "partial", label: "Pas toujours" },
          { value: "full", label: "Oui" },
        ],
      },
      {
        id: "calves_tempo",
        label: "Ton mouvement est plutôt :",
        type: "choice",
        options: [
          { value: "fast", label: "Rapide" },
          { value: "slow", label: "Contrôlé" },
        ],
      },
      {
        id: "running_often",
        label: "Tu cours souvent en plus ?",
        type: "boolean",
      },
    ],
    causes: [
      { id: "range_incomplete", label: "Amplitude incomplète" },
      { id: "load_too_light", label: "Charge trop faible" },
      { id: "frequency_too_low", label: "Fréquence insuffisante" },
      { id: "tempo_too_fast", label: "Tempo trop rapide" },
    ],
    computeScores: (answers) =>
      normalizeScores([
        {
          id: "range_incomplete",
          label: "Amplitude incomplète",
          score: answers.calves_range === "partial" ? 45 : 10,
        },
        {
          id: "load_too_light",
          label: "Charge trop faible",
          score: answers.calves_load === "light" ? 40 : answers.calves_load === "medium" ? 18 : 10,
        },
        {
          id: "frequency_too_low",
          label: "Fréquence insuffisante",
          score:
            (answers.calves_freq === "low" ? 35 : answers.calves_freq === "medium" ? 15 : 8) +
            (answers.running_often === true ? 8 : 0),
        },
        {
          id: "tempo_too_fast",
          label: "Tempo trop rapide",
          score: answers.calves_tempo === "fast" ? 28 : 8,
        },
      ]),
    correction: [
      "Descendre complètement le talon",
      "Monter fort, redescendre lentement",
      "Ajouter de la charge progressivement",
      "Passer à 2 séances par semaine minimum",
    ],
    test14Days: [
      "2 séances mollets par semaine",
      "4 séries de 10 à 15 répétitions",
      "Pause 1 seconde en haut",
      "Descente lente à chaque répétition",
    ],
  },
  {
    id: "arms_stagnate",
    title: "Bras qui stagnent",
    category: "musculation",
    intro: "Analyse basée sur les erreurs les plus fréquentes observées chez les sportifs.",
    questions: [
      {
        id: "direct_arm_work",
        label: "Tu fais du travail direct biceps/triceps ?",
        type: "choice",
        options: [
          { value: "low", label: "Très peu" },
          { value: "medium", label: "Un peu" },
          { value: "high", label: "Oui régulièrement" },
        ],
      },
      {
        id: "mind_muscle",
        label: "Tu sens bien les bras travailler ?",
        type: "boolean",
      },
      {
        id: "recovery_ok",
        label: "Tu récupères bien entre les séances ?",
        type: "boolean",
      },
      {
        id: "training_volume",
        label: "Ton volume bras est plutôt :",
        type: "choice",
        options: [
          { value: "low", label: "Faible" },
          { value: "medium", label: "Moyen" },
          { value: "high", label: "Élevé" },
        ],
      },
    ],
    causes: [
      { id: "not_enough_isolation", label: "Pas assez de travail direct" },
      { id: "poor_connection", label: "Connexion muscle insuffisante" },
      { id: "recovery_issue", label: "Récupération insuffisante" },
      { id: "volume_issue", label: "Volume mal ajusté" },
    ],
    computeScores: (answers) =>
      normalizeScores([
        {
          id: "not_enough_isolation",
          label: "Pas assez de travail direct",
          score: answers.direct_arm_work === "low" ? 42 : answers.direct_arm_work === "medium" ? 18 : 8,
        },
        {
          id: "poor_connection",
          label: "Connexion muscle insuffisante",
          score: answers.mind_muscle === false ? 35 : 10,
        },
        {
          id: "recovery_issue",
          label: "Récupération insuffisante",
          score: answers.recovery_ok === false ? 34 : 10,
        },
        {
          id: "volume_issue",
          label: "Volume mal ajusté",
          score: answers.training_volume === "low" || answers.training_volume === "high" ? 28 : 10,
        },
      ]),
    correction: [
      "Ajouter un peu plus de travail direct bras",
      "Chercher la contraction avant la charge pure",
      "Éviter de surcharger si la récupération baisse",
      "Stabiliser le volume sur 2 semaines",
    ],
    test14Days: [
      "2 exercices biceps + 2 exercices triceps par semaine",
      "Exécution propre et lente",
      "Ne pas changer les exercices pendant 14 jours",
    ],
  },
  {
    id: "back_not_wide",
    title: "Dos qui ne s’élargit pas",
    category: "musculation",
    intro: "Analyse basée sur les erreurs les plus fréquentes observées chez les sportifs.",
    questions: [
      {
        id: "pull_with_arms",
        label: "Tu sens surtout les bras sur les tirages ?",
        type: "boolean",
      },
      {
        id: "lat_connection",
        label: "Tu arrives à sentir les dorsaux ?",
        type: "boolean",
      },
      {
        id: "back_volume",
        label: "Ton volume dos est plutôt :",
        type: "choice",
        options: [
          { value: "low", label: "Faible" },
          { value: "medium", label: "Moyen" },
          { value: "high", label: "Élevé" },
        ],
      },
      {
        id: "row_variety",
        label: "Tu varies entre tirages verticaux et horizontaux ?",
        type: "boolean",
      },
    ],
    causes: [
      { id: "arms_dominate", label: "Les bras prennent trop le travail" },
      { id: "poor_lat_activation", label: "Mauvaise activation des dorsaux" },
      { id: "not_enough_volume", label: "Volume d’entraînement insuffisant" },
      { id: "exercise_balance", label: "Travail du dos pas assez équilibré" },
    ],
    computeScores: (answers) =>
      normalizeScores([
        {
          id: "arms_dominate",
          label: "Les bras prennent trop le travail",
          score: answers.pull_with_arms === true ? 42 : 10,
        },
        {
          id: "poor_lat_activation",
          label: "Mauvaise activation des dorsaux",
          score: answers.lat_connection === false ? 40 : 10,
        },
        {
          id: "not_enough_volume",
          label: "Volume d’entraînement insuffisant",
          score: answers.back_volume === "low" ? 34 : answers.back_volume === "medium" ? 16 : 8,
        },
        {
          id: "exercise_balance",
          label: "Travail du dos pas assez équilibré",
          score: answers.row_variety === false ? 28 : 8,
        },
      ]),
    correction: [
      "Initier le mouvement par les coudes",
      "Chercher les dorsaux avant de charger",
      "Combiner tirages verticaux et horizontaux",
      "Stabiliser le volume dos sur plusieurs séances",
    ],
    test14Days: [
      "2 séances dos structurées",
      "1 tirage vertical + 1 horizontal minimum par séance",
      "Pause de contraction en fin de tirage",
    ],
  },
  {
    id: "running_plateau",
    title: "Je stagne en course",
    category: "course",
    intro: "Analyse basée sur les erreurs les plus fréquentes observées chez les sportifs.",
    questions: [
      {
        id: "same_pace",
        label: "Tu cours presque toujours à la même allure ?",
        type: "boolean",
      },
      {
        id: "intervals",
        label: "Tu fais du fractionné ?",
        type: "choice",
        options: [
          { value: "never", label: "Jamais" },
          { value: "sometimes", label: "Parfois" },
          { value: "often", label: "Oui régulièrement" },
        ],
      },
      {
        id: "recovery_running",
        label: "Tu récupères bien entre tes sorties ?",
        type: "boolean",
      },
      {
        id: "weekly_runs",
        label: "Nombre de sorties par semaine :",
        type: "choice",
        options: [
          { value: "low", label: "1 à 2" },
          { value: "medium", label: "3" },
          { value: "high", label: "4 ou plus" },
        ],
      },
    ],
    causes: [
      { id: "same_intensity", label: "Toujours la même intensité" },
      { id: "lack_intervals", label: "Manque de fractionné" },
      { id: "recovery_issue", label: "Récupération insuffisante" },
      { id: "training_structure", label: "Structure d’entraînement peu progressive" },
    ],
    computeScores: (answers) =>
      normalizeScores([
        {
          id: "same_intensity",
          label: "Toujours la même intensité",
          score: answers.same_pace === true ? 40 : 10,
        },
        {
          id: "lack_intervals",
          label: "Manque de fractionné",
          score: answers.intervals === "never" ? 42 : answers.intervals === "sometimes" ? 18 : 8,
        },
        {
          id: "recovery_issue",
          label: "Récupération insuffisante",
          score: answers.recovery_running === false ? 34 : 8,
        },
        {
          id: "training_structure",
          label: "Structure d’entraînement peu progressive",
          score: answers.weekly_runs === "low" ? 28 : 12,
        },
      ]),
    correction: [
      "Varier les allures de travail",
      "Ajouter une séance de fractionné légère",
      "Garder une vraie sortie facile",
      "Éviter d’accélérer toutes les sorties",
    ],
    test14Days: [
      "1 sortie facile",
      "1 sortie plus soutenue",
      "1 séance de fractionné léger",
      "Observer la sensation de jambes et de souffle",
    ],
  },
  {
    id: "shin_pain",
    title: "Douleurs aux tibias en course",
    category: "course",
    intro: "Analyse basée sur les erreurs les plus fréquentes observées chez les sportifs.",
    questions: [
      {
        id: "hard_surface",
        label: "Tu cours souvent sur du bitume ou sol très dur ?",
        type: "boolean",
      },
      {
        id: "shoes_old",
        label: "Tes chaussures sont-elles usées ?",
        type: "boolean",
      },
      {
        id: "volume_jump",
        label: "Tu as augmenté vite ton volume récemment ?",
        type: "boolean",
      },
      {
        id: "warmup",
        label: "Tu échauffes les chevilles/mollets avant ?",
        type: "boolean",
      },
    ],
    causes: [
      { id: "hard_surface", label: "Terrain trop dur" },
      { id: "worn_shoes", label: "Chaussures usées" },
      { id: "too_fast_progression", label: "Progression trop rapide" },
      { id: "poor_preparation", label: "Échauffement insuffisant" },
    ],
    computeScores: (answers) =>
      normalizeScores([
        {
          id: "hard_surface",
          label: "Terrain trop dur",
          score: answers.hard_surface === true ? 42 : 8,
        },
        {
          id: "worn_shoes",
          label: "Chaussures usées",
          score: answers.shoes_old === true ? 38 : 10,
        },
        {
          id: "too_fast_progression",
          label: "Progression trop rapide",
          score: answers.volume_jump === true ? 40 : 10,
        },
        {
          id: "poor_preparation",
          label: "Échauffement insuffisant",
          score: answers.warmup === false ? 28 : 8,
        },
      ]),
    correction: [
      "Alterner avec un terrain plus souple",
      "Vérifier l’état des chaussures",
      "Réduire un peu la charge si besoin",
      "Échauffer mollets et chevilles avant la sortie",
    ],
    test14Days: [
      "2 semaines avec surfaces plus souples si possible",
      "Échauffement 5 minutes avant chaque sortie",
      "Limiter les hausses brusques de volume",
    ],
  },
  {
    id: "running_fatigue",
    title: "Fatigue rapide en course",
    category: "course",
    intro: "Analyse basée sur les erreurs les plus fréquentes observées chez les sportifs.",
    questions: [
      {
        id: "breathing_bad",
        label: "Tu te sens vite essoufflé ?",
        type: "boolean",
      },
      {
        id: "carb_intake_low",
        label: "Tu manges assez de glucides autour de l’effort ?",
        type: "boolean",
      },
      {
        id: "easy_runs",
        label: "Tu fais des sorties vraiment faciles ?",
        type: "boolean",
      },
      {
        id: "sleep_ok",
        label: "Ton sommeil est correct ?",
        type: "boolean",
      },
    ],
    causes: [
      { id: "breathing_efficiency", label: "Respiration inefficace" },
      { id: "low_carbs", label: "Apport glucidique insuffisant" },
      { id: "not_enough_base", label: "Endurance fondamentale insuffisante" },
      { id: "recovery_issue", label: "Récupération générale insuffisante" },
    ],
    computeScores: (answers) =>
      normalizeScores([
        {
          id: "breathing_efficiency",
          label: "Respiration inefficace",
          score: answers.breathing_bad === true ? 35 : 10,
        },
        {
          id: "low_carbs",
          label: "Apport glucidique insuffisant",
          score: answers.carb_intake_low === false ? 38 : 10,
        },
        {
          id: "not_enough_base",
          label: "Endurance fondamentale insuffisante",
          score: answers.easy_runs === false ? 40 : 8,
        },
        {
          id: "recovery_issue",
          label: "Récupération générale insuffisante",
          score: answers.sleep_ok === false ? 30 : 8,
        },
      ]),
    correction: [
      "Garder plus de sorties faciles",
      "Vérifier les glucides autour des séances",
      "Mieux contrôler le départ d’allure",
      "Surveiller sommeil et récupération",
    ],
    test14Days: [
      "2 semaines avec une sortie vraiment facile minimum",
      "Départ plus calme sur chaque course",
      "Noter la fatigue ressentie après chaque séance",
    ],
  },
  {
    id: "running_no_fat_loss",
    title: "Je cours mais je ne perds pas de gras",
    category: "course",
    intro: "Analyse basée sur les erreurs les plus fréquentes observées chez les sportifs.",
    questions: [
      {
        id: "eat_more_after_running",
        label: "Tu compenses en mangeant plus après la course ?",
        type: "boolean",
      },
      {
        id: "running_duration",
        label: "Tes sorties sont plutôt :",
        type: "choice",
        options: [
          { value: "short", label: "Courtes" },
          { value: "medium", label: "Moyennes" },
          { value: "long", label: "Longues" },
        ],
      },
      {
        id: "running_intensity",
        label: "Ton intensité est plutôt :",
        type: "choice",
        options: [
          { value: "low", label: "Faible" },
          { value: "medium", label: "Modérée" },
          { value: "high", label: "Élevée" },
        ],
      },
      {
        id: "overall_calorie_control",
        label: "Tu contrôles vraiment ton alimentation globale ?",
        type: "boolean",
      },
    ],
    causes: [
      { id: "food_compensation", label: "Compensation alimentaire" },
      { id: "intensity_too_low", label: "Intensité trop faible" },
      { id: "duration_too_short", label: "Durée trop courte" },
      { id: "calorie_control", label: "Contrôle alimentaire global insuffisant" },
    ],
    computeScores: (answers) =>
      normalizeScores([
        {
          id: "food_compensation",
          label: "Compensation alimentaire",
          score: answers.eat_more_after_running === true ? 42 : 10,
        },
        {
          id: "intensity_too_low",
          label: "Intensité trop faible",
          score: answers.running_intensity === "low" ? 34 : 12,
        },
        {
          id: "duration_too_short",
          label: "Durée trop courte",
          score: answers.running_duration === "short" ? 30 : 10,
        },
        {
          id: "calorie_control",
          label: "Contrôle alimentaire global insuffisant",
          score: answers.overall_calorie_control === false ? 40 : 8,
        },
      ]),
    correction: [
      "Surveiller l’alimentation de compensation",
      "Garder une logique globale déficit modéré",
      "Ne pas compter uniquement sur la course",
      "Ajouter si besoin un peu de renforcement",
    ],
    test14Days: [
      "Noter les repas post-course",
      "Limiter les extras automatiques",
      "Comparer faim réelle et envie de récompense",
    ],
  },
  {
    id: "belly_fat",
    title: "Graisse persistante au ventre",
    category: "silhouette",
    intro: "Analyse basée sur les erreurs les plus fréquentes observées chez les sportifs.",
    questions: [
      {
        id: "calorie_deficit_real",
        label: "Tu es vraiment en déficit calorique ?",
        type: "boolean",
      },
      {
        id: "sleep_short",
        label: "Tu dors peu ?",
        type: "boolean",
      },
      {
        id: "liquid_sugars",
        label: "Tu consommes souvent des calories liquides ?",
        type: "boolean",
      },
      {
        id: "protein_enough",
        label: "Tu manges assez de protéines ?",
        type: "boolean",
      },
    ],
    causes: [
      { id: "deficit_too_small", label: "Déficit calorique insuffisant" },
      { id: "sleep_stress", label: "Sommeil/stress défavorables" },
      { id: "liquid_calories", label: "Trop de calories liquides" },
      { id: "protein_too_low", label: "Apport protéique insuffisant" },
    ],
    computeScores: (answers) =>
      normalizeScores([
        {
          id: "deficit_too_small",
          label: "Déficit calorique insuffisant",
          score: answers.calorie_deficit_real === false ? 42 : 10,
        },
        {
          id: "sleep_stress",
          label: "Sommeil/stress défavorables",
          score: answers.sleep_short === true ? 34 : 10,
        },
        {
          id: "liquid_calories",
          label: "Trop de calories liquides",
          score: answers.liquid_sugars === true ? 36 : 8,
        },
        {
          id: "protein_too_low",
          label: "Apport protéique insuffisant",
          score: answers.protein_enough === false ? 30 : 8,
        },
      ]),
    correction: [
      "Vérifier le déficit réel sur la semaine",
      "Réduire les boissons caloriques",
      "Monter l’apport protéique",
      "Mieux protéger le sommeil si possible",
    ],
    test14Days: [
      "14 jours sans calories liquides inutiles",
      "Suivi plus strict des portions",
      "Protéines présentes à chaque repas",
    ],
  },
  {
    id: "cellulite_despite_sport",
    title: "Cellulite malgré le sport",
    category: "silhouette",
    intro: "Analyse basée sur les erreurs les plus fréquentes observées chez les sportifs.",
    questions: [
      {
        id: "run_on_hard",
        label: "Tu cours souvent sur sol dur ?",
        type: "boolean",
      },
      {
        id: "water_retention",
        label: "Tu as facilement une sensation de rétention d’eau ?",
        type: "boolean",
      },
      {
        id: "lower_body_strength",
        label: "Tu fais du renforcement bas du corps ?",
        type: "boolean",
      },
      {
        id: "shoes_absorb",
        label: "Tes chaussures absorbent bien les chocs ?",
        type: "boolean",
      },
    ],
    causes: [
      { id: "repeated_impacts", label: "Impacts répétés sur sol dur" },
      { id: "water_retention", label: "Rétention d’eau locale" },
      { id: "circulation_tone", label: "Renforcement local insuffisant" },
      { id: "poor_shock_absorption", label: "Absorption des chocs insuffisante" },
    ],
    computeScores: (answers) =>
      normalizeScores([
        {
          id: "repeated_impacts",
          label: "Impacts répétés sur sol dur",
          score: answers.run_on_hard === true ? 40 : 10,
        },
        {
          id: "water_retention",
          label: "Rétention d’eau locale",
          score: answers.water_retention === true ? 34 : 10,
        },
        {
          id: "circulation_tone",
          label: "Renforcement local insuffisant",
          score: answers.lower_body_strength === false ? 32 : 10,
        },
        {
          id: "poor_shock_absorption",
          label: "Absorption des chocs insuffisante",
          score: answers.shoes_absorb === false ? 30 : 8,
        },
      ]),
    correction: [
      "Alterner avec un terrain plus souple",
      "Ajouter du renforcement cuisses/fessiers",
      "Vérifier les chaussures et l’amorti",
      "Mieux répartir impacts et récupération",
    ],
    test14Days: [
      "2 semaines avec plus de terrain souple",
      "2 séances bas du corps simples par semaine",
      "Observer jambes lourdes et sensation locale",
    ],
  },
  {
    id: "muscle_and_fat",
    title: "Je prends du muscle mais aussi du gras",
    category: "silhouette",
    intro: "Analyse basée sur les erreurs les plus fréquentes observées chez les sportifs.",
    questions: [
      {
        id: "surplus_high",
        label: "Ton surplus calorique est-il important ?",
        type: "boolean",
      },
      {
        id: "protein_split",
        label: "Tes protéines sont-elles bien réparties sur la journée ?",
        type: "boolean",
      },
      {
        id: "cardio_present",
        label: "Tu gardes un peu de cardio ?",
        type: "boolean",
      },
      {
        id: "food_quality",
        label: "La qualité alimentaire est-elle stable ?",
        type: "boolean",
      },
    ],
    causes: [
      { id: "surplus_too_high", label: "Surplus calorique trop élevé" },
      { id: "protein_distribution", label: "Protéines mal réparties" },
      { id: "not_enough_cardio", label: "Cardio insuffisant" },
      { id: "food_quality_unstable", label: "Qualité alimentaire irrégulière" },
    ],
    computeScores: (answers) =>
      normalizeScores([
        {
          id: "surplus_too_high",
          label: "Surplus calorique trop élevé",
          score: answers.surplus_high === true ? 44 : 10,
        },
        {
          id: "protein_distribution",
          label: "Protéines mal réparties",
          score: answers.protein_split === false ? 28 : 8,
        },
        {
          id: "not_enough_cardio",
          label: "Cardio insuffisant",
          score: answers.cardio_present === false ? 30 : 8,
        },
        {
          id: "food_quality_unstable",
          label: "Qualité alimentaire irrégulière",
          score: answers.food_quality === false ? 26 : 8,
        },
      ]),
    correction: [
      "Réduire légèrement le surplus",
      "Mieux répartir les protéines",
      "Garder un peu de cardio léger",
      "Stabiliser la qualité alimentaire",
    ],
    test14Days: [
      "Surplus plus modéré pendant 14 jours",
      "Protéines réparties sur 3 à 4 prises",
      "2 séances cardio léger dans la semaine",
    ],
  },
  {
    id: "not_gaining_muscle",
    title: "Je ne prends pas de muscle",
    category: "silhouette",
    intro: "Analyse basée sur les erreurs les plus fréquentes observées chez les sportifs.",
    questions: [
      {
        id: "train_heavy_enough",
        label: "Tes charges sont-elles vraiment stimulantes ?",
        type: "boolean",
      },
      {
        id: "eat_enough",
        label: "Tu manges assez pour construire ?",
        type: "boolean",
      },
      {
        id: "recover_enough",
        label: "Ta récupération est-elle correcte ?",
        type: "boolean",
      },
      {
        id: "program_progressive",
        label: "Ton programme progresse-t-il vraiment ?",
        type: "boolean",
      },
    ],
    causes: [
      { id: "load_not_stimulating", label: "Charge pas assez stimulante" },
      { id: "not_enough_food", label: "Apport énergétique insuffisant" },
      { id: "recovery_issue", label: "Récupération insuffisante" },
      { id: "lack_progression", label: "Progression d’entraînement insuffisante" },
    ],
    computeScores: (answers) =>
      normalizeScores([
        {
          id: "load_not_stimulating",
          label: "Charge pas assez stimulante",
          score: answers.train_heavy_enough === false ? 38 : 10,
        },
        {
          id: "not_enough_food",
          label: "Apport énergétique insuffisant",
          score: answers.eat_enough === false ? 42 : 10,
        },
        {
          id: "recovery_issue",
          label: "Récupération insuffisante",
          score: answers.recover_enough === false ? 34 : 10,
        },
        {
          id: "lack_progression",
          label: "Progression d’entraînement insuffisante",
          score: answers.program_progressive === false ? 30 : 8,
        },
      ]),
    correction: [
      "Vérifier la surcharge progressive",
      "Manger suffisamment pour construire",
      "Mieux protéger la récupération",
      "Stabiliser un programme simple et mesurable",
    ],
    test14Days: [
      "Noter les charges sur 14 jours",
      "Vérifier que l’apport alimentaire suit",
      "Comparer énergie, récupération et congestion",
    ],
  },
  {
    id: "bodymind_ai",
    title: " ✨ IA BodyMind",
    category: "ia spécialisée",
    intro:
      "Ton problème ne correspond pas aux diagnostics ? Décris ta situation et l’IA BodyMind t’aidera à y voir plus clair.",

    questions: [
      {
        id: "problem",
        label: "Décris ton problème ou ta question fitness",
        type: "text",
      },
    ],

    causes: [
      { id: "bodymind_analysis", label: "Analyse personnalisée BodyMind" },
    ],

    computeScores: () =>
      normalizeScores([
        {
          id: "bodymind_analysis",
          label: "Analyse personnalisée BodyMind",
          score: 100,
        },
      ]),

    correction: [
      "Analyse guidée par IA selon ta description.",
      "Les conseils peuvent concerner l'entraînement, la récupération, la technique ou la nutrition.",
    ],

    test14Days: [
      "Appliquer les recommandations proposées.",
      "Observer l’évolution pendant 14 jours.",
      "Réévaluer les sensations, performances ou zones ciblées.",
    ],
  },

];

export function getDiagnosticById(id: string): DiagnosticCase | undefined {
  return TRAINING_DIAGNOSTICS.find((item) => item.id === id);
}

export function getDiagnosticsByCategory(category: DiagnosticCategory): DiagnosticCase[] {
  return TRAINING_DIAGNOSTICS.filter((item) => item.category === category)
};










