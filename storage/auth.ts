
import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_USER_KEY = "bodydiet_auth_user_v1";

export type AuthUser = {
  id: string;
  email: string;
};

function isValidAuthUser(value: any): value is AuthUser {
  return (
    value &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    typeof value.email === "string" &&
    value.email.trim().length > 0
  );
}

export async function saveAuthUser(user: AuthUser): Promise<void> {
  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (!isValidAuthUser(parsed)) {
      await AsyncStorage.removeItem(AUTH_USER_KEY);
      return null;
    }

    return {
      id: parsed.id.trim(),
      email: parsed.email.trim().toLowerCase(),
    };
  } catch (error) {
    console.log("❌ getAuthUser error", error);
    return null;
  }
}

export async function clearAuthUser(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_USER_KEY);
}