import { authedRequest } from "./auth-api";

const DOCUMENTS_KEY = "wisesys.documents";

export type DocumentStatus = "queued" | "running" | "succeeded" | "failed";
export type DocumentRole = "materials" | "past_paper";

export type Document = {
  id: string;
  owner_id: string;
  course_id: string | null;
  filename: string;
  extension: string;
  size_bytes: number;
  role: DocumentRole;
  status: DocumentStatus;
};

function readList(): Document[] {
  const raw = sessionStorage.getItem(DOCUMENTS_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Document[]) : [];
  } catch {
    return [];
  }
}

function writeList(items: Document[]) {
  sessionStorage.setItem(DOCUMENTS_KEY, JSON.stringify(items));
}

export function clearDocumentCache() {
  sessionStorage.removeItem(DOCUMENTS_KEY);
}

export function listDocuments(): Document[] {
  return readList();
}

export function listDocumentsForCourse(courseId: string): Document[] {
  return listDocuments().filter((document) => document.course_id === courseId);
}

export function getDocument(id: string): Document | null {
  return listDocuments().find((document) => document.id === id) ?? null;
}

export function upsertDocument(document: Document) {
  const next = listDocuments().filter((item) => item.id !== document.id);
  next.push(document);
  writeList(next);
}

export function removeDocument(id: string) {
  writeList(listDocuments().filter((document) => document.id !== id));
}

export function removeDocumentsForCourse(courseId: string) {
  writeList(listDocuments().filter((document) => document.course_id !== courseId));
}

export async function uploadDocument(courseId: string, file: File) {
  const body = new FormData();
  body.append("file", file);
  const document = (await authedRequest(`/api/courses/${courseId}/documents`, {
    method: "POST",
    body,
  })) as Document;
  upsertDocument(document);
  return document;
}

export async function fetchDocument(id: string) {
  const document = (await authedRequest(`/api/documents/${id}`)) as Document;
  upsertDocument(document);
  return document;
}

export async function deleteDocument(id: string) {
  await authedRequest(`/api/documents/${id}`, { method: "DELETE" });
  removeDocument(id);
}

export async function setDocumentRole(id: string, role: DocumentRole) {
  const document = (await authedRequest(`/api/documents/${id}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  })) as Document;
  upsertDocument(document);
  return document;
}
