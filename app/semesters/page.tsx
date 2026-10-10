"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { currentUser } from "../auth-api";
import { listSemesters, type Semester } from "../semester-api";

export default function SemestersPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  useEffect(() => {
    currentUser().then((me) => {
      if (!me) {
        router.replace("/sign-in");
        return;
      }
      setSemesters(listSemesters());
      setReady(true);
    });
  }, [router]);

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
          <Link href="/">Home</Link>
        </p>
      </nav>
      <h2>Semesters</h2>
      <p>
        <Link href="/semesters/new">Create semester</Link>
      </p>
      {semesters.length === 0 ? (
        <p>No semesters created in this browser session yet.</p>
      ) : (
        <ul>
          {semesters.map((semester) => (
            <li key={semester.id}>
              <Link href={`/semesters/${semester.id}`}>
                {semester.name} ({semester.start_date} to {semester.end_date})
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
