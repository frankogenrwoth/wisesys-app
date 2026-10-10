"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { currentUser, messageFor } from "../../auth-api";
import {
  addCourse,
  deleteSemester,
  getSemester,
  listCoursesForSemester,
  removeSemester,
  updateSemester,
  type Course,
  type Semester,
} from "../../semester-api";

export default function SemesterDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const semesterId = params.id;

  const [ready, setReady] = useState(false);
  const [semester, setSemester] = useState<Semester | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [editError, setEditError] = useState("");
  const [courseError, setCourseError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [pending, setPending] = useState<"edit" | "course" | "delete" | null>(null);
  const [editFormKey, setEditFormKey] = useState(0);

  useEffect(() => {
    currentUser().then((me) => {
      if (!me) {
        router.replace("/sign-in");
        return;
      }
      setSemester(getSemester(semesterId));
      setCourses(listCoursesForSemester(semesterId));
      setReady(true);
    });
  }, [router, semesterId]);

  async function onEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!semester) {
      return;
    }
    const data = new FormData(event.currentTarget);
    setEditError("");
    setPending("edit");
    try {
      const updated = await updateSemester(semester.id, {
        name: String(data.get("name") ?? ""),
        start_date: String(data.get("start_date") ?? ""),
        end_date: String(data.get("end_date") ?? ""),
      });
      setSemester(updated);
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : "network";
      if (code === "not_found") {
        removeSemester(semester.id);
        router.replace("/semesters");
        return;
      }
      setEditError(messageFor(code));
      setSemester(getSemester(semester.id));
      setEditFormKey((value) => value + 1);
    } finally {
      setPending(null);
    }
  }

  async function onAddCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!semester) {
      return;
    }
    const form = event.currentTarget;
    const data = new FormData(form);
    setCourseError("");
    setPending("course");
    try {
      await addCourse(semester.id, String(data.get("name") ?? ""));
      form.reset();
      setCourses(listCoursesForSemester(semester.id));
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : "network";
      if (code === "not_found") {
        removeSemester(semester.id);
        router.replace("/semesters");
        return;
      }
      setCourseError(messageFor(code));
    } finally {
      setPending(null);
    }
  }

  async function onDelete() {
    if (!semester) {
      return;
    }
    setDeleteError("");
    setPending("delete");
    try {
      await deleteSemester(semester.id);
      router.push("/semesters");
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : "network";
      if (code === "not_found") {
        removeSemester(semester.id);
        router.replace("/semesters");
        return;
      }
      setDeleteError(messageFor(code));
      setPending(null);
    }
  }

  if (!ready) {
    return (
      <main>
        <p>Checking session.</p>
      </main>
    );
  }

  if (!semester) {
    return (
      <main>
        <header>
          <h1>KnowledgeTree</h1>
        </header>
        <p>That semester is not available in this browser session.</p>
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
          <Link href="/semesters">Semesters</Link>
        </p>
      </nav>
      <h2>{semester.name}</h2>

      <section>
        <h3>Edit semester</h3>
        <form key={editFormKey} onSubmit={onEdit}>
          <p>
            <label htmlFor="edit-name">Name</label>
            <input
              id="edit-name"
              name="name"
              type="text"
              minLength={1}
              maxLength={120}
              defaultValue={semester.name}
              required
            />
          </p>
          <p>
            <label htmlFor="edit-start">Start date</label>
            <input
              id="edit-start"
              name="start_date"
              type="date"
              defaultValue={semester.start_date}
              required
            />
          </p>
          <p>
            <label htmlFor="edit-end">End date</label>
            <input
              id="edit-end"
              name="end_date"
              type="date"
              defaultValue={semester.end_date}
              required
            />
          </p>
          <button type="submit" disabled={pending === "edit"}>
            Save changes
          </button>
          <p role="alert">{editError}</p>
        </form>
      </section>

      <section>
        <h3>Courses</h3>
        {courses.length === 0 ? (
          <p>No courses yet.</p>
        ) : (
          <ul>
            {courses.map((course) => (
              <li key={course.id}>
                <Link href={`/courses/${course.id}`}>{course.name}</Link>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={onAddCourse}>
          <p>
            <label htmlFor="course-name">Course name</label>
            <input id="course-name" name="name" type="text" minLength={1} maxLength={120} required />
          </p>
          <button type="submit" disabled={pending === "course"}>
            Add course
          </button>
          <p role="alert">{courseError}</p>
        </form>
      </section>

      <section>
        <h3>Delete semester</h3>
        <p>Deletes this semester, its courses, and those courses&apos; nodes and links.</p>
        <button type="button" onClick={onDelete} disabled={pending === "delete"}>
          Delete semester
        </button>
        <p role="alert">{deleteError}</p>
      </section>
    </main>
  );
}
