import { getStore } from "@netlify/blobs";
import type { Config, Context } from "@netlify/functions";
import { getUser } from "@netlify/identity";

type UserDataPayload = {
  version: number;
  updatedAt: string;
  sessions: unknown[];
  favoriteMachineIds: unknown[];
  userExerciseProfiles?: Record<string, unknown>;
  themeMode?: "light" | "dark";
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}

function isValidPayload(value: unknown): value is UserDataPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as UserDataPayload;

  return (
    typeof payload.version === "number" &&
    typeof payload.updatedAt === "string" &&
    Array.isArray(payload.sessions) &&
    Array.isArray(payload.favoriteMachineIds) &&
    (payload.userExerciseProfiles === undefined ||
      (payload.userExerciseProfiles !== null &&
        typeof payload.userExerciseProfiles === "object" &&
        !Array.isArray(payload.userExerciseProfiles))) &&
    (payload.themeMode === undefined ||
      payload.themeMode === "light" ||
      payload.themeMode === "dark")
  );
}

export default async (req: Request, _context: Context) => {
  const user = await getUser();

  if (!user?.id) {
    return jsonResponse({ error: "Najprv sa prihlas." }, 401);
  }

  const store = getStore("gym80-user-data", { consistency: "strong" });
  const key = `users/${encodeURIComponent(user.id)}.json`;

  if (req.method === "GET") {
    const data = await store.get(key, { type: "json" });
    return jsonResponse({ data: data ?? null });
  }

  if (req.method === "PUT") {
    const payload = await req.json().catch(() => null);

    if (!isValidPayload(payload)) {
      return jsonResponse({ error: "Data nemaju spravny format." }, 400);
    }

    await store.setJSON(key, payload);
    return jsonResponse({ ok: true, updatedAt: payload.updatedAt });
  }

  return jsonResponse({ error: "Nepodporovana metoda." }, 405);
};

export const config: Config = {
  path: "/api/user-data"
};
