export const SESSION_KEY = "wisesys.session";

const messages: Record<string, string> = {
  account_exists: "An account with this email already exists.",
  invalid_input: "Check that names are 1–120 characters and other fields are valid.",
  invalid_credentials: "That email or password does not match an account.",
  unauthenticated: "Sign in to continue.",
  invalid_dates: "The end date must be on or after the start date.",
  not_found: "That semester or course was not found.",
  network: "The server could not be reached.",
};

export type MeResponse = {
  user_id: string;
};

type AuthSuccess = {
  account_id: string;
  session: string;
};

export function messageFor(code: string) {
  return messages[code] ?? "Something went wrong.";
}

async function errorCode(response: Response) {
  const text = await response.text();
  if (!text) {
    return response.status === 401 ? "unauthenticated" : "network";
  }
  try {
    const body: unknown = JSON.parse(text);
    if (
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      return body.error;
    }
  } catch {
    return "network";
  }
  return "network";
}

export async function request(path: string, init: RequestInit) {
  let response: Response;
  try {
    response = await fetch(path, init);
  } catch {
    throw new Error("network");
  }
  if (response.status === 204) {
    return null;
  }
  if (!response.ok) {
    throw new Error(await errorCode(response));
  }
  return response.json();
}

export function authHeaders(token: string | null, extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("Accept", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

export function readSession() {
  return sessionStorage.getItem(SESSION_KEY);
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export async function currentUser(): Promise<MeResponse | null> {
  const token = readSession();
  if (!token) {
    return null;
  }
  try {
    return (await request("/api/auth/me", { headers: authHeaders(token) })) as MeResponse;
  } catch {
    clearSession();
    return null;
  }
}

export async function submitCredentials(
  path: "/api/auth/sign-in" | "/api/auth/sign-up",
  email: FormDataEntryValue | null,
  password: FormDataEntryValue | null,
) {
  const result = (await request(path, {
    method: "POST",
    headers: authHeaders(null, { "Content-Type": "application/json" }),
    body: JSON.stringify({ email, password }),
  })) as AuthSuccess;
  sessionStorage.setItem(SESSION_KEY, result.session);
  return (await request("/api/auth/me", {
    headers: authHeaders(result.session),
  })) as MeResponse;
}

export async function endSession() {
  const token = readSession();
  try {
    await request("/api/auth/sign-out", {
      method: "POST",
      headers: authHeaders(token),
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "network";
    if (code !== "unauthenticated") {
      throw error;
    }
  }
  clearSession();
}

export async function authedRequest(path: string, init: RequestInit = {}) {
  const token = readSession();
  if (!token) {
    throw new Error("unauthenticated");
  }
  const headers = authHeaders(token, init.headers);
  return request(path, { ...init, headers });
}
