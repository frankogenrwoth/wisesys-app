"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { currentUser, messageFor } from "../../auth-api";
import {
  deleteDocument,
  fetchDocument,
  getDocument,
  removeDocument,
  setDocumentRole,
  type Document,
  type DocumentRole,
} from "../../document-api";

export default function DocumentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const documentId = params.id;

  const [ready, setReady] = useState(false);
  const [document, setDocument] = useState<Document | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"refresh" | "role" | "delete" | null>(null);

  useEffect(() => {
    currentUser().then(async (me) => {
      if (!me) {
        router.replace("/sign-in");
        return;
      }
      const cached = getDocument(documentId);
      if (cached) {
        setDocument(cached);
        setReady(true);
        return;
      }
      try {
        setDocument(await fetchDocument(documentId));
      } catch {
        setDocument(null);
      } finally {
        setReady(true);
      }
    });
  }, [router, documentId]);

  async function onRefresh() {
    setError("");
    setPending("refresh");
    try {
      setDocument(await fetchDocument(documentId));
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : "network";
      if (code === "not_found") {
        removeDocument(documentId);
        router.replace(document?.course_id ? `/courses/${document.course_id}` : "/semesters");
        return;
      }
      setError(messageFor(code));
    } finally {
      setPending(null);
    }
  }

  async function onSetRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!document) {
      return;
    }
    const data = new FormData(event.currentTarget);
    const role = String(data.get("role") ?? "") as DocumentRole;
    setError("");
    setPending("role");
    try {
      setDocument(await setDocumentRole(document.id, role));
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : "network";
      if (code === "not_found") {
        removeDocument(document.id);
        router.replace(document.course_id ? `/courses/${document.course_id}` : "/semesters");
        return;
      }
      setError(messageFor(code));
    } finally {
      setPending(null);
    }
  }

  async function onDelete() {
    if (!document) {
      return;
    }
    setError("");
    setPending("delete");
    try {
      await deleteDocument(document.id);
      router.push(document.course_id ? `/courses/${document.course_id}` : "/semesters");
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : "network";
      if (code === "not_found") {
        removeDocument(document.id);
        router.replace(document.course_id ? `/courses/${document.course_id}` : "/semesters");
        return;
      }
      setError(messageFor(code));
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

  if (!document) {
    return (
      <main>
        <header>
          <h1>KnowledgeTree</h1>
        </header>
        <p>That upload was not found.</p>
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
          {document.course_id ? (
            <Link href={`/courses/${document.course_id}`}>Back to course</Link>
          ) : (
            <Link href="/semesters">Semesters</Link>
          )}
        </p>
      </nav>
      <h2>{document.filename}</h2>
      <section>
        <h3>Upload details</h3>
        <dl>
          <dt>Status</dt>
          <dd>
            <output>{document.status}</output>
          </dd>
          <dt>Role</dt>
          <dd>
            <output>{document.role}</output>
          </dd>
          <dt>Extension</dt>
          <dd>
            <output>{document.extension}</output>
          </dd>
          <dt>Size (bytes)</dt>
          <dd>
            <output>{document.size_bytes}</output>
          </dd>
        </dl>
        <button type="button" onClick={onRefresh} disabled={pending === "refresh"}>
          Refresh status
        </button>
      </section>
      {document.status === "succeeded" ? (
        <section>
          <h3>Set role</h3>
          <form onSubmit={onSetRole}>
            <p>
              <label htmlFor="document-role">Role</label>
              <select id="document-role" name="role" defaultValue={document.role} key={document.role} required>
                <option value="materials">materials</option>
                <option value="past_paper">past_paper</option>
              </select>
            </p>
            <button type="submit" disabled={pending === "role"}>
              Save role
            </button>
          </form>
        </section>
      ) : (
        <section>
          <h3>Set role</h3>
          <p>Role can be changed only when status is succeeded. New uploads start as materials.</p>
        </section>
      )}
      <section>
        <h3>Delete upload</h3>
        <button type="button" onClick={onDelete} disabled={pending === "delete"}>
          Delete upload
        </button>
      </section>
      <p role="alert">{error}</p>
    </main>
  );
}
