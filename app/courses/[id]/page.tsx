"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { currentUser, messageFor } from "../../auth-api";
import {
  listDocumentsForCourse,
  uploadDocument,
  type Document,
} from "../../document-api";
import { getCourse, removeCourse, renameCourse, type Course } from "../../semester-api";

export default function CoursePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const courseId = params.id;

  const [ready, setReady] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [renameError, setRenameError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [pending, setPending] = useState<"rename" | "upload" | null>(null);

  useEffect(() => {
    currentUser().then((me) => {
      if (!me) {
        router.replace("/sign-in");
        return;
      }
      setCourse(getCourse(courseId));
      setDocuments(listDocumentsForCourse(courseId));
      setReady(true);
    });
  }, [router, courseId]);

  async function onRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!course) {
      return;
    }
    const data = new FormData(event.currentTarget);
    setRenameError("");
    setPending("rename");
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
      setRenameError(messageFor(code));
      setCourse(getCourse(course.id));
    } finally {
      setPending(null);
    }
  }

  async function onUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!course) {
      return;
    }
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    if (!(file instanceof File)) {
      setUploadError(messageFor("empty_file"));
      return;
    }
    setUploadError("");
    setPending("upload");
    try {
      await uploadDocument(course.id, file);
      form.reset();
      setDocuments(listDocumentsForCourse(course.id));
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : "network";
      if (code === "not_found") {
        removeCourse(course.id);
        router.replace("/semesters");
        return;
      }
      setUploadError(messageFor(code));
    } finally {
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
        <form onSubmit={onRename}>
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
          <button type="submit" disabled={pending === "rename"}>
            Save name
          </button>
          <p role="alert">{renameError}</p>
        </form>
      </section>
      <section>
        <h3>Uploads</h3>
        <p>Allowed types: .pdf, .pptx, .txt. Size: 1 to 26,214,400 bytes.</p>
        <form onSubmit={onUpload}>
          <p>
            <label htmlFor="upload-file">File</label>
            <input id="upload-file" name="file" type="file" accept=".pdf,.pptx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain" required />
          </p>
          <button type="submit" disabled={pending === "upload"}>
            Upload
          </button>
          <p role="alert">{uploadError}</p>
        </form>
        {documents.length === 0 ? (
          <p>No uploads in this browser session yet.</p>
        ) : (
          <ul>
            {documents.map((document) => (
              <li key={document.id}>
                <Link href={`/documents/${document.id}`}>
                  {document.filename} — {document.status} — {document.role}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
