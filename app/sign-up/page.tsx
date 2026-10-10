"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { currentUser, messageFor, submitCredentials } from "../auth-api";

export default function SignUpPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    currentUser().then((me) => {
      if (me) {
        router.replace("/");
        return;
      }
      setReady(true);
    });
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError("");
    setPending(true);
    try {
      await submitCredentials("/api/auth/sign-up", data.get("email"), data.get("password"));
      form.reset();
      router.push("/");
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : "network";
      setError(messageFor(code));
      setPending(false);
    }
  }

  if (!ready) {
    return (
      <main>
        <p>Checking session.</p>
      </main>
    );
  }

  return (
    <main>
      <header>
        <h1>KnowledgeTree</h1>
      </header>
      <h2>Create account</h2>
      <form onSubmit={onSubmit}>
        <p>
          <label htmlFor="sign-up-email">Email</label>
          <input id="sign-up-email" name="email" type="email" autoComplete="username" required />
        </p>
        <p>
          <label htmlFor="sign-up-password">Password</label>
          <input
            id="sign-up-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
          />
        </p>
        <button type="submit" disabled={pending}>
          Create account
        </button>
        <p role="alert">{error}</p>
      </form>
      <p>
        <Link href="/sign-in">Sign in</Link>
      </p>
    </main>
  );
}
