import AsyncStorage from "@react-native-async-storage/async-storage";

export type DiagnosticTestState = {
  diagnosticId: string;
  startedAt: string;
  dayNumber: number;
  isActive: boolean;
};

const KEY = "bodydiet_training_diagnostic_tests";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function diffDays(start: string, end: string) {
  const a = new Date(start + "T00:00:00").getTime();
  const b = new Date(end + "T00:00:00").getTime();
  return Math.max(0, Math.floor((b - a) / 86400000));
}

export async function loadDiagnosticTests(): Promise<DiagnosticTestState[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveDiagnosticTests(items: DiagnosticTestState[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function startDiagnosticTest(
  diagnosticId: string
): Promise<DiagnosticTestState> {
  const today = todayKey();
  const all = await loadDiagnosticTests();

  const next: DiagnosticTestState = {
    diagnosticId,
    startedAt: today,
    dayNumber: 1,
    isActive: true,
  };

  const filtered = all.filter((x) => x.diagnosticId !== diagnosticId);
  const updated = [next, ...filtered];

  await saveDiagnosticTests(updated);
  return next;
}

export async function getDiagnosticTest(
  diagnosticId: string
): Promise<DiagnosticTestState | null> {
  const all = await loadDiagnosticTests();
  const found = all.find((x) => x.diagnosticId === diagnosticId);
  if (!found) return null;

  const days = diffDays(found.startedAt, todayKey());
  const dayNumber = Math.min(14, days + 1);

  return {
    ...found,
    dayNumber,
    isActive: dayNumber < 14,
  };
}

export async function completeDiagnosticTest(
  diagnosticId: string
): Promise<void> {
  const all = await loadDiagnosticTests();
  const updated = all.map((x) =>
    x.diagnosticId === diagnosticId
      ? { ...x, dayNumber: 14, isActive: false }
      : x
  );
  await saveDiagnosticTests(updated);
}