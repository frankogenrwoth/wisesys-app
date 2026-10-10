"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { currentUser, messageFor } from "../../auth-api";
import { createSemester } from "../../semester-api";

export default function NewSemesterPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    currentUser().then((me) => {
      if (!me) {
        router.replace("/sign-in");
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
      const semester = await createSemester({
        name: String(data.get("name") ?? ""),
        start_date: String(data.get("start_date") ?? ""),
        end_date: String(data.get("end_date") ?? ""),
      });
      form.reset();
      router.push(`/semesters/${semester.id}`);
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
      <nav>
        <p>
          <Link href="/semesters">Semesters</Link>
        </p>
      </nav>
      <h2>Create semester</h2>
      <form onSubmit={onSubmit}>
        <p>
          <label htmlFor="semester-name">Name</label>
          <input id="semester-name" name="name" type="text" minLength={1} maxLength={120} required />
        </p>
        <p>
          <label htmlFor="semester-start">Start date</label>
          <input id="semester-start" name="start_date" type="date" required />
        </p>
        <p>
          <label htmlFor="semester-end">End date</label>
          <input id="semester-end" name="end_date" type="date" required />
        </p>
        <button type="submit" disabled={pending}>
          Create semester
        </button>
        <p role="alert">{error}</p>
      </form>
    </main>
  );
}
