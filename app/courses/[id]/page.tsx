"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { currentUser, messageFor } from "../../auth-api";
import { getCourse, removeCourse, renameCourse, type Course } from "../../semester-api";

export default function CoursePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const courseId = params.id;

  const [ready, setReady] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    currentUser().then((me) => {
      if (!me) {
        router.replace("/sign-in");
        return;
      }
      setCourse(getCourse(courseId));
      setReady(true);
    });
  }, [router, courseId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!course) {
      return;
    }
    const data = new FormData(event.currentTarget);
    setError("");
    setPending(true);
    try {
      const updated = await renameCourse(course.id, String(data.get("name") ?? ""));
      setCourse(updated);
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : "network";
      if (code === "not_found") {
        removeCourse(course.id);
        router.replace("/semesters");
        return;
      }
      setError(messageFor(code));
      setCourse(getCourse(course.id));
    } finally {
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

  if (!course) {
    return (
      <main>
        <header>
          <h1>KnowledgeTree</h1>
        </header>
        <p>That course is not available in this browser session.</p>
        <p>
          <Link href="/semesters">Semesters</Link>
        </p>
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
          <Link href={`/semesters/${course.semester_id}`}>Back to semester</Link>
        </p>
      </nav>
      <h2>{course.name}</h2>
      <section>
        <h3>Rename course</h3>
        <form onSubmit={onSubmit}>
          <p>
            <label htmlFor="course-name">Name</label>
            <input
              id="course-name"
              name="name"
              type="text"
              minLength={1}
              maxLength={120}
              defaultValue={course.name}
              key={course.name}
              required
            />
          </p>
          <button type="submit" disabled={pending}>
            Save name
          </button>
          <p role="alert">{error}</p>
        </form>
      </section>
    </main>
  );
}
