import type { Assignment, CreateAssignmentInput } from "../types"

const assignments: Assignment[] = [
  {
    id: "pbl-01",
    title: "Portfolio Website",
    description:
      "Build a personal portfolio website using HTML, CSS, and JavaScript. Showcase your projects, skills, and contact information.",
    assignedTeams: ["MCA-A-2025-26"],
    deadline: "2026-09-30",
    subject: "Web Development",
    problemStatement:
      "Build a personal portfolio website that showcases your projects, skills, and contact information. The website should be responsive and follow modern web design principles.",
    objectives: [
      "Create a responsive portfolio website",
      "Implement modern UI/UX design",
      "Showcase at least 3 projects",
      "Include a contact form",
    ],
    requirements: [
      "HTML5, CSS3, and vanilla JavaScript",
      "Responsive design (mobile-first)",
      "Clean and professional design",
      "Hosted on GitHub Pages",
    ],
    evaluationCriteria: [
      "Design and aesthetics (25%)",
      "Responsiveness (25%)",
      "Code quality (25%)",
      "Functionality (25%)",
    ],
    sprintCount: 4,
    createdBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "pbl-02",
    title: "Task Manager API",
    description:
      "Create a RESTful API for a task management system using Node.js and Express. Include CRUD operations and authentication.",
    assignedTeams: ["MCA-A-2025-26"],
    deadline: "2026-10-15",
    subject: "Backend Development",
    problemStatement:
      "Create a RESTful API for a task management system. The API should support user authentication, task CRUD operations, and task categorization.",
    objectives: [
      "Implement RESTful API design",
      "Add user authentication",
      "CRUD operations for tasks",
      "Input validation and error handling",
    ],
    requirements: [
      "Node.js and Express",
      "MongoDB or SQLite for data storage",
      "JWT authentication",
      "API documentation",
    ],
    evaluationCriteria: [
      "API design (25%)",
      "Authentication (25%)",
      "Code quality (25%)",
      "Documentation (25%)",
    ],
    sprintCount: 4,
    createdBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "pbl-03",
    title: "Data Analysis Dashboard",
    description:
      "Analyze a dataset and create an interactive dashboard using Python and Streamlit. Include visualizations and insights.",
    assignedTeams: ["MCA-B-2025-26"],
    deadline: "2026-10-30",
    subject: "Data Science",
    problemStatement:
      "Analyze a given dataset and create an interactive dashboard using Python and Streamlit. The dashboard should provide insights through visualizations and summary statistics.",
    objectives: [
      "Perform data cleaning and analysis",
      "Create interactive visualizations",
      "Build a Streamlit dashboard",
      "Present insights clearly",
    ],
    requirements: [
      "Python 3.x",
      "Pandas for data manipulation",
      "Streamlit for dashboard",
      "Matplotlib or Plotly for charts",
    ],
    evaluationCriteria: [
      "Data analysis quality (25%)",
      "Visualizations (25%)",
      "Dashboard usability (25%)",
      "Insights and conclusions (25%)",
    ],
    sprintCount: 4,
    createdBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]

export function getAssignments(): Assignment[] {
  return assignments
}

export function getAssignment(id: string): Assignment | undefined {
  return assignments.find((a) => a.id === id)
}

export function addAssignment(assignment: Assignment): void {
  const existing = assignments.findIndex((a) => a.id === assignment.id)
  if (existing >= 0) {
    assignments[existing] = { ...assignments[existing], ...assignment }
  } else {
    assignments.push(assignment)
  }
}

export function updateAssignment(
  id: string,
  updates: Partial<Assignment>
): void {
  const assignment = assignments.find((a) => a.id === id)
  if (assignment) {
    Object.assign(assignment, updates, { updatedAt: new Date().toISOString() })
  }
}

export function deleteAssignment(id: string): void {
  const idx = assignments.findIndex((a) => a.id === id)
  if (idx >= 0) {
    assignments.splice(idx, 1)
  }
}

export function toCreateAssignmentData(
  input: CreateAssignmentInput
): Omit<Assignment, "id" | "createdAt" | "updatedAt" | "createdBy"> {
  return {
    title: input.title,
    description: input.description,
    assignedTeams: input.assignedTeams,
    deadline: input.deadline,
    subject: input.subject,
    problemStatement: input.problemStatement,
    objectives: input.objectives || [],
    requirements: input.requirements || [],
    evaluationCriteria: input.evaluationCriteria || [],
    sprintCount: 4,
  }
}