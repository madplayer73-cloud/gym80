import { Platform } from "react-native";
import { ThemeMode } from "../theme";
import { UserExerciseProfile, WorkoutSession } from "../types";

export type CloudUser = {
  id: string;
  email?: string;
  name?: string;
  user_metadata?: {
    full_name?: string;
  };
};

export type CloudDataSnapshot = {
  version: number;
  updatedAt: string;
  sessions: WorkoutSession[];
  favoriteMachineIds: string[];
  userExerciseProfiles?: Record<string, UserExerciseProfile>;
  themeMode?: ThemeMode;
};

type AuthModule = typeof import("@netlify/identity");
type CloudAuthMode = "off" | "netlify" | "pocketbase" | "pocketbase-single";
type CloudAuthSubscription = {
  onAuthChange: (
    callback: (_event: string, nextUser: CloudUser | null) => void
  ) => (() => void) | void;
};

let authModulePromise: Promise<AuthModule> | null = null;
const POCKETBASE_TOKEN_KEY = "gym80-pocketbase-token";
const POCKETBASE_USER_KEY = "gym80-pocketbase-user";
const POCKETBASE_DATA_COLLECTION = "user_data";
const POCKETBASE_SINGLE_DATA_COLLECTION = "single_app_data";
const POCKETBASE_SINGLE_DATA_KEY = "gym80-main";
const CASAOS_SYNC_ENDPOINT = "/sync/gym80";

declare const process:
  | {
      env: {
        EXPO_PUBLIC_CLOUD_AUTH?: string;
        EXPO_PUBLIC_POCKETBASE_URL?: string;
      };
    };

const configuredCloudAuthMode = process.env.EXPO_PUBLIC_CLOUD_AUTH;
const configuredPocketBaseUrl = process.env.EXPO_PUBLIC_POCKETBASE_URL;

function getCloudAuthMode(): CloudAuthMode {
  const mode = configuredCloudAuthMode;

  if (mode === "netlify" || mode === "pocketbase" || mode === "pocketbase-single") {
    return mode;
  }

  return "off";
}

export function getCloudLoginProviderLabel() {
  const mode = getCloudAuthMode();

  if (mode === "pocketbase") {
    return "ZimaBoard ucet";
  }

  if (mode === "pocketbase-single") {
    return "CasaOS zaloha";
  }

  if (mode === "netlify") {
    return "Google";
  }

  return "Iba lokalne";
}

export function isPocketBaseCloudEnabled() {
  const mode = getCloudAuthMode();
  return mode === "pocketbase" || mode === "pocketbase-single";
}

export function isSingleUserPocketBaseCloudEnabled() {
  return getCloudAuthMode() === "pocketbase-single";
}

function getPocketBaseBaseUrl() {
  return configuredPocketBaseUrl || "/pb";
}

function canUseNetlifyIdentity() {
  return (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    getCloudAuthMode() === "netlify"
  );
}

function canUsePocketBase() {
  return (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    isPocketBaseCloudEnabled()
  );
}

async function getAuthModule() {
  if (!canUseNetlifyIdentity()) {
    return null;
  }

  if (!authModulePromise) {
    authModulePromise = import("@netlify/identity");
  }

  return authModulePromise;
}

export function isProductionWebHost() {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return false;
  }

  const mode = getCloudAuthMode();
  return mode === "netlify" || mode === "pocketbase";
}

export async function initializeCloudAuth() {
  if (canUsePocketBase()) {
    if (isSingleUserPocketBaseCloudEnabled()) {
      return {
        onAuthChange() {
          return () => undefined;
        }
      } satisfies CloudAuthSubscription;
    }

    return {
      onAuthChange(callback) {
        const listener = () => {
          callback("authChange", getStoredPocketBaseUser());
        };

        window.addEventListener("gym80-pocketbase-auth-change", listener);
        return () => window.removeEventListener("gym80-pocketbase-auth-change", listener);
      }
    } satisfies CloudAuthSubscription;
  }

  const auth = await getAuthModule();

  if (!auth) {
    return null;
  }

  try {
    await auth.handleAuthCallback();
  } catch (error) {
    console.log("Cloud auth callback failed", error);
  }

  return auth;
}

export async function getCloudUser() {
  if (canUsePocketBase()) {
    if (isSingleUserPocketBaseCloudEnabled()) {
      return {
        id: POCKETBASE_SINGLE_DATA_KEY,
        email: "CasaOS lokalna zaloha",
        name: "CasaOS"
      };
    }

    const token = getStoredPocketBaseToken();

    if (!token) {
      return null;
    }

    try {
      const response = await pocketBaseFetch("/api/collections/users/auth-refresh", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`
        }
      });

      const body = await response.json();
      storePocketBaseAuth(body.token, body.record);
      return mapPocketBaseUser(body.record);
    } catch (error) {
      clearPocketBaseAuth();
      return null;
    }
  }

  const auth = await getAuthModule();

  if (!auth) {
    return null;
  }

  return (await auth.getUser()) as CloudUser | null;
}

export async function loginWithGoogle() {
  if (canUsePocketBase()) {
    throw new Error("Google prihlasenie doplnime po nastaveni HTTPS domeny.");
  }

  const auth = await getAuthModule();

  if (!auth) {
    throw new Error("Prihlasenie funguje iba vo webovej verzii.");
  }

  await auth.oauthLogin("google");
}

export async function logoutCloudUser() {
  if (canUsePocketBase()) {
    if (isSingleUserPocketBaseCloudEnabled()) {
      clearPocketBaseAuth();
      return;
    }

    clearPocketBaseAuth();
    notifyPocketBaseAuthChange();
    return;
  }

  const auth = await getAuthModule();

  if (!auth) {
    return;
  }

  await auth.logout();
}

export async function fetchCloudData() {
  if (canUsePocketBase()) {
    if (isSingleUserPocketBaseCloudEnabled()) {
      const response = await fetch(CASAOS_SYNC_ENDPOINT, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("CasaOS zaloha sa nepodarila nacitat.");
      }

      const body = (await response.json()) as { data: CloudDataSnapshot | null };
      return body.data;
    }

    const user = getStoredPocketBaseUser();
    const token = getStoredPocketBaseToken();

    if (!user || !token) {
      throw new Error("Nie si prihlaseny.");
    }

    const existing = await findPocketBaseUserDataRecord(user.id, token);

    if (!existing) {
      return null;
    }

    return existing.data as CloudDataSnapshot | null;
  }

  const response = await fetch("/api/user-data", {
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error("Cloud data sa nepodarilo nacitat.");
  }

  const body = (await response.json()) as { data: CloudDataSnapshot | null };
  return body.data;
}

export async function saveCloudData(snapshot: CloudDataSnapshot) {
  if (canUsePocketBase()) {
    if (isSingleUserPocketBaseCloudEnabled()) {
      const response = await fetch(CASAOS_SYNC_ENDPOINT, {
        method: "PUT",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(snapshot)
      });

      if (!response.ok) {
        throw new Error("CasaOS zaloha sa nepodarila ulozit.");
      }

      return (await response.json()) as { ok: true; updatedAt: string };
    }

    const user = getStoredPocketBaseUser();
    const token = getStoredPocketBaseToken();

    if (!user || !token) {
      throw new Error("Nie si prihlaseny.");
    }

    const existing = await findPocketBaseUserDataRecord(user.id, token);
    const payload = {
      owner: user.id,
      data: snapshot
    };

    const response = existing
      ? await pocketBaseFetch(`/api/collections/${POCKETBASE_DATA_COLLECTION}/records/${existing.id}`, {
          method: "PATCH",
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json"
          },
          body: JSON.stringify(payload)
        })
      : await pocketBaseFetch(`/api/collections/${POCKETBASE_DATA_COLLECTION}/records`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json"
          },
          body: JSON.stringify(payload)
        });

    const body = await response.json();
    return { ok: true as const, updatedAt: body.updated || snapshot.updatedAt };
  }

  const response = await fetch("/api/user-data", {
    method: "PUT",
    credentials: "include",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(snapshot)
  });

  if (!response.ok) {
    throw new Error("Cloud data sa nepodarilo ulozit.");
  }

  return (await response.json()) as { ok: true; updatedAt: string };
}

export async function loginWithPassword(email: string, password: string) {
  if (!canUsePocketBase()) {
    throw new Error("Email prihlasenie je zapnute iba v ZimaBoard verzii.");
  }

  const response = await pocketBaseFetch("/api/collections/users/auth-with-password", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      identity: email.trim(),
      password
    })
  });
  const body = await response.json();
  storePocketBaseAuth(body.token, body.record);
  notifyPocketBaseAuthChange();
  return mapPocketBaseUser(body.record);
}

export async function registerWithPassword(email: string, password: string) {
  if (!canUsePocketBase()) {
    throw new Error("Registracia je zapnuta iba v ZimaBoard verzii.");
  }

  const normalizedEmail = email.trim();

  await pocketBaseFetch("/api/collections/users/records", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      email: normalizedEmail,
      password,
      passwordConfirm: password
    })
  });

  return loginWithPassword(normalizedEmail, password);
}

function getStoredPocketBaseToken() {
  return window.localStorage.getItem(POCKETBASE_TOKEN_KEY);
}

function getStoredPocketBaseUser() {
  const rawValue = window.localStorage.getItem(POCKETBASE_USER_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return mapPocketBaseUser(JSON.parse(rawValue));
  } catch (error) {
    return null;
  }
}

function storePocketBaseAuth(token: string, record: unknown) {
  window.localStorage.setItem(POCKETBASE_TOKEN_KEY, token);
  window.localStorage.setItem(POCKETBASE_USER_KEY, JSON.stringify(record));
}

function clearPocketBaseAuth() {
  window.localStorage.removeItem(POCKETBASE_TOKEN_KEY);
  window.localStorage.removeItem(POCKETBASE_USER_KEY);
}

function notifyPocketBaseAuthChange() {
  window.dispatchEvent(new Event("gym80-pocketbase-auth-change"));
}

function mapPocketBaseUser(record: unknown): CloudUser {
  const userRecord = record as { id?: string; email?: string; name?: string };

  return {
    id: userRecord.id || "",
    email: userRecord.email,
    name: userRecord.name
  };
}

async function findPocketBaseUserDataRecord(userId: string, token: string) {
  const filter = encodeURIComponent(`owner="${userId}"`);
  const response = await pocketBaseFetch(
    `/api/collections/${POCKETBASE_DATA_COLLECTION}/records?filter=${filter}&perPage=1`,
    {
      headers: {
        authorization: `Bearer ${token}`
      }
    }
  );
  const body = (await response.json()) as {
    items?: Array<{ id: string; data?: unknown }>;
  };

  return body.items?.[0] ?? null;
}

async function findPocketBaseSingleDataRecord() {
  const filter = encodeURIComponent(`key="${POCKETBASE_SINGLE_DATA_KEY}"`);
  const response = await pocketBaseFetch(
    `/api/collections/${POCKETBASE_SINGLE_DATA_COLLECTION}/records?filter=${filter}&perPage=1`
  );
  const body = (await response.json()) as {
    items?: Array<{ id: string; data?: unknown }>;
  };

  return body.items?.[0] ?? null;
}

async function pocketBaseFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${getPocketBaseBaseUrl()}${path}`, init);

  if (!response.ok) {
    const message = await getPocketBaseErrorMessage(response);
    throw new Error(message);
  }

  return response;
}

async function getPocketBaseErrorMessage(response: Response) {
  try {
    const body = await response.json();
    return body?.message || "PocketBase poziadavka zlyhala.";
  } catch (error) {
    return "PocketBase poziadavka zlyhala.";
  }
}
