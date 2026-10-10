"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { currentUser, endSession, messageFor } from "./auth-api";
import { clearSemesterCache } from "./semester-api";

export default function Home() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    currentUser().then((me) => {
      setUserId(me?.user_id ?? null);
      setReady(true);
    });
  }, []);

  async function signOut() {
    setError("");
    setPending(true);
    try {
      await endSession();
      clearSemesterCache();
      router.push("/sign-in");
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

  if (!userId) {
    return (
      <main>
        <header>
          <h1>KnowledgeTree</h1>
        </header>
        <nav>
          <p>
            <Link href="/sign-in">Sign in</Link>
          </p>
          <p>
            <Link href="/sign-up">Create account</Link>
          </p>
        </nav>
      </main>
    );
  }

  return (
    <main>
      <header>
        <h1>KnowledgeTree</h1>
      </header>
      <section>
        <h2>Signed in</h2>
        <p>
          Account <output>{userId}</output>
        </p>
        <nav>
          <p>
            <Link href="/semesters">Semesters</Link>
          </p>
        </nav>
        <button type="button" onClick={signOut} disabled={pending}>
          Sign out
        </button>
        <p role="alert">{error}</p>
      </section>
    </main>
  );
}
