type WorkModule = {
  label: string;
  route: string;
};

export const facultyWorkModules: WorkModule[] = [
  { label: "My Class", route: "/faculty/my-class" },
  { label: "My Roles", route: "/faculty/my-roles" },
  { label: "Assignments", route: "/assignments" },
  { label: "Internal Test", route: "/modules/internal-test" },
  { label: "Academic Planning", route: "/modules/academic-planning" },
  { label: "Curriculum", route: "/org/curriculum" },
  { label: "Certificate", route: "/modules/certificate" },
  { label: "Attendance", route: "/modules/attendance" },
  { label: "Manage Leaves", route: "/modules/leave" },
  { label: "Events", route: "/modules/events" },
  { label: "Result", route: "/results" },
  { label: "Feedback", route: "/modules/feedback" },
  { label: "My Time Table", route: "/modules/timetable" },
  { label: "Examination", route: "/modules/examination" },
  { label: "Quiz Manager", route: "/modules/quiz-manager" },
  { label: "Holidays", route: "/modules/holidays" },
  { label: "Go Live", route: "/modules/go-live" },
  { label: "Classgrid AI", route: "/modules/ai" },
  { label: "Online Exam Builder", route: "/exam/online/builder" },
  { label: "Exam Grading", route: "/exam/grading" },
  { label: "Analytics", route: "/faculty/analytics" },
  { label: "Notes Marketplace", route: "/marketplace" },
  { label: "Canteen", route: "/canteen" },
  { label: "Alumni", route: "/org/alumni" },
  { label: "Profile", route: "/profile" }
];

export const studentWorkModules: WorkModule[] = [
  { label: "My Class", route: "/student/my-class" },
  { label: "Assignments", route: "/assignments" },
  { label: "Internal Test", route: "/modules/internal-test" },
  { label: "Academic Planning", route: "/modules/academic-planning" },
  { label: "Curriculum", route: "/org/curriculum" },
  { label: "Certificate", route: "/modules/certificate" },
  { label: "Attendance", route: "/modules/attendance" },
  { label: "Apply for Leave", route: "/modules/leave" },
  { label: "Events", route: "/modules/events" },
  { label: "Result", route: "/results" },
  { label: "Feedback", route: "/modules/feedback" },
  { label: "My Time Table", route: "/modules/timetable" },
  { label: "Examination", route: "/modules/examination" },
  { label: "Quizzes", route: "/student/quizzes" },
  { label: "Holidays", route: "/modules/holidays" },
  { label: "Classgrid AI", route: "/modules/ai" },
  { label: "Hostel", route: "/modules/hostel" },
  { label: "Library", route: "/student/library" },
  { label: "Fees", route: "/modules/fees" },
  { label: "Canteen", route: "/canteen" },
  { label: "Notes Marketplace", route: "/marketplace" },
  { label: "Alumni", route: "/student/alumni" },
  { label: "Profile", route: "/profile" }
];
