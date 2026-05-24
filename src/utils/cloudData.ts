import { Platform } from "react-native";
import { ThemeMode } from "../theme";
import { WorkoutSession } from "../types";

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
  themeMode?: ThemeMode;
};

type AuthModule = typeof import("@netlify/identity");

let authModulePromise: Promise<AuthModule> | null = null;

function canUseNetlifyIdentity() {
  return Platform.OS === "web" && typeof window !== "undefined";
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
  if (!canUseNetlifyIdentity()) {
    return false;
  }

  const host = window.location.hostname;
  return host !== "localhost" && host !== "127.0.0.1";
}

export async function initializeCloudAuth() {
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
  const auth = await getAuthModule();

  if (!auth) {
    return null;
  }

  return (await auth.getUser()) as CloudUser | null;
}

export async function loginWithGoogle() {
  const auth = await getAuthModule();

  if (!auth) {
    throw new Error("Prihlasenie funguje iba vo webovej verzii.");
  }

  await auth.oauthLogin("google");
}

export async function logoutCloudUser() {
  const auth = await getAuthModule();

  if (!auth) {
    return;
  }

  await auth.logout();
}

export async function fetchCloudData() {
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
