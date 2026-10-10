import { authedRequest } from "./auth-api";

const SEMESTERS_KEY = "wisesys.semesters";
const COURSES_KEY = "wisesys.courses";

export type Semester = {
  id: string;
  owner_id: string;
  name: string;
  start_date: string;
  end_date: string;
};

export type Course = {
  id: string;
  semester_id: string;
  owner_id: string;
  name: string;
};

function readList<T>(key: string): T[] {
  const raw = sessionStorage.getItem(key);
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, items: T[]) {
  sessionStorage.setItem(key, JSON.stringify(items));
}

export function clearSemesterCache() {
  sessionStorage.removeItem(SEMESTERS_KEY);
  sessionStorage.removeItem(COURSES_KEY);
}

export function listSemesters(): Semester[] {
  return readList<Semester>(SEMESTERS_KEY);
}

export function getSemester(id: string): Semester | null {
  return listSemesters().find((semester) => semester.id === id) ?? null;
}

export function upsertSemester(semester: Semester) {
  const next = listSemesters().filter((item) => item.id !== semester.id);
  next.push(semester);
  writeList(SEMESTERS_KEY, next);
}

export function removeSemester(id: string) {
  writeList(
    SEMESTERS_KEY,
    listSemesters().filter((semester) => semester.id !== id),
  );
  writeList(
    COURSES_KEY,
    listCourses().filter((course) => course.semester_id !== id),
  );
}

export function listCourses(): Course[] {
  return readList<Course>(COURSES_KEY);
}

export function listCoursesForSemester(semesterId: string): Course[] {
  return listCourses().filter((course) => course.semester_id === semesterId);
}

export function getCourse(id: string): Course | null {
  return listCourses().find((course) => course.id === id) ?? null;
}

export function upsertCourse(course: Course) {
  const next = listCourses().filter((item) => item.id !== course.id);
  next.push(course);
  writeList(COURSES_KEY, next);
}

export function removeCourse(id: string) {
  writeList(
    COURSES_KEY,
    listCourses().filter((course) => course.id !== id),
  );
}

export async function createSemester(input: {
  name: string;
  start_date: string;
  end_date: string;
}) {
  const semester = (await authedRequest("/api/semesters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })) as Semester;
  upsertSemester(semester);
  return semester;
}

export async function updateSemester(
  id: string,
  input: { name: string; start_date: string; end_date: string },
) {
  const semester = (await authedRequest(`/api/semesters/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })) as Semester;
  upsertSemester(semester);
  return semester;
}

export async function deleteSemester(id: string) {
  await authedRequest(`/api/semesters/${id}`, { method: "DELETE" });
  removeSemester(id);
}

export async function addCourse(semesterId: string, name: string) {
  const course = (await authedRequest(`/api/semesters/${semesterId}/courses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  })) as Course;
  upsertCourse(course);
  return course;
}

export async function renameCourse(id: string, name: string) {
  const course = (await authedRequest(`/api/courses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  })) as Course;
  upsertCourse(course);
  return course;
}
