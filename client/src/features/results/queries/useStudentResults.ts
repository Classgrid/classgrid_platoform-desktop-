import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

// Matches the exact shape returned by GET /api/results/student/me
export type SubjectDetail = {
  subject_id: string;
  subject_code: string;
  subject_name: string;
  course_type: "THEORY" | "LAB" | "ELECTIVE";
  max_marks: number;
  credits: number;
  marks_obtained: number;
  internal_marks: number | null;
  external_marks: number | null;
  is_absent: boolean;
  grade: string;
  grade_points: number;
  earn_credits: number;
  pass_marks: number;
};

export type StudentResult = {
  id: string;
  scheme_id: string;
  org_id: string;
  student_id: string;
  total_marks: number;
  max_total_marks: number;
  percentage: number;
  grade: string;
  grade_points: number;
  sgpa: number | null;
  cgpa: number | null;
  percentage_equivalent: number | null;
  earn_credits: number | null;
  total_credits: number | null;
  status: string;
  scheme_rank: number;
  result_detail: SubjectDetail[];
  generated_at: string;
  version: number;
  result_schemes: {
    id: string;
    name: string;
    academic_year: string;
    semester: string;
    status: string;
    rules_json: {
      mode: "college" | "school";
      [key: string]: any;
    };
  };
};

export type StudentResultsResponse = {
  results: StudentResult[];
  student: {
    name: string;
    prn: string;
    email: string;
  };
};

export type CgpaResponse = {
  cgpa: number | null;
  percentage_equivalent: number | null;
  total_semesters: number;
  semesters: {
    scheme_id: string;
    scheme_name: string;
    semester: string;
    academic_year: string;
    sgpa: number | null;
    credits: number | null;
    earn_credits: number | null;
  }[];
};

/**
 * Fetches the logged-in student's published results.
 * Connects to: GET /api/results/student/me
 */
export function useStudentResults() {
  return useQuery<StudentResultsResponse>({
    queryKey: ["student-results"],
    queryFn: async () => {
      const { data } = await apiClient.get<StudentResultsResponse>("/api/results/student/me");
      return data;
    },
  });
}

/**
 * Fetches cumulative CGPA across all published semesters.
 * Connects to: GET /api/results/student/:studentId/cgpa
 */
export function useStudentCgpa(studentId: string) {
  return useQuery<CgpaResponse>({
    queryKey: ["student-cgpa", studentId],
    queryFn: async () => {
      if (!studentId) return { cgpa: null, percentage_equivalent: null, total_semesters: 0, semesters: [] };
      const { data } = await apiClient.get<CgpaResponse>(`/api/results/student/${studentId}/cgpa`);
      return data;
    },
    enabled: !!studentId,
  });
}
