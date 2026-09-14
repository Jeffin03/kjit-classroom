export type Role = "student" | "faculty";

export interface SprintSummary {
  completed: string[];
  changed: string;
  blockers: string;
  demoLink?: string;
}

export interface DiffMetrics {
  commits: number;
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
  newFiles: number;
  modifiedFiles: number;
}

export interface SprintSubmission {
  sprint: number;
  submittedAt: string;
  commitSha: string;
  docLink: string;
  summary: SprintSummary;
  metrics: DiffMetrics;
  pivoted?: boolean;
  pivotRepoUrl?: string;
}

export interface Submission {
  id: string;
  studentId: string;
  assignmentId: string;
  repoUrl: string;
  docLink: string;
  status: "active" | "completed" | "accepted";
  sprints: SprintSubmission[];
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  description: string;
  deadline: string;
  problemStatement: string;
  objectives: string[];
  requirements: string[];
  evaluationCriteria: string[];
  teams: string[];
  sprintCount: 4;
}

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  githubUsername: string;
  team: string;
  status: "active" | "inactive";
}

export const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: "a1",
    title: "Distributed Task Queue System",
    subject: "Cloud Computing",
    description: "Design and implement a fault-tolerant distributed task queue with workers, retry logic, and a monitoring dashboard.",
    deadline: "2026-11-30",
    problemStatement: "Modern cloud applications require asynchronous job processing at scale. Build a distributed task queue that supports multiple worker nodes, task prioritization, retry on failure, and dead-letter queues. The system must handle at least 1000 tasks/minute under normal load.",
    objectives: [
      "Implement a producer-consumer model across networked nodes",
      "Support task prioritization and scheduling",
      "Implement retry logic with exponential backoff",
      "Build a real-time monitoring dashboard"
    ],
    requirements: [
      "Minimum 3 worker nodes with independent operation",
      "Persist task state across worker restarts",
      "REST API for task submission and status queries",
      "Dashboard showing queue depth, throughput, and error rates"
    ],
    evaluationCriteria: [
      "Correctness of task ordering and execution",
      "Fault tolerance under simulated node failures",
      "Throughput benchmarks",
      "Code quality and documentation"
    ],
    teams: ["CE-A", "CE-B"],
    sprintCount: 4,
  },
  {
    id: "a2",
    title: "Peer-to-Peer File Sharing Protocol",
    subject: "Computer Networks",
    description: "Implement a BitTorrent-inspired P2P file sharing system with tracker discovery, chunked transfer, and integrity verification.",
    deadline: "2026-12-15",
    problemStatement: "Centralized file servers create bottlenecks and single points of failure. Design and implement a P2P file sharing protocol that distributes load across peers, verifies chunk integrity, and handles churn (peers joining and leaving).",
    objectives: [
      "Implement tracker-based peer discovery",
      "Support chunked file transfer with parallel downloads",
      "Verify file integrity using checksums",
      "Handle peer churn gracefully"
    ],
    requirements: [
      "Minimum 5 peers per swarm in testing",
      "Chunk size configurable between 256KB and 4MB",
      "SHA-256 integrity verification per chunk",
      "CLI interface for seeding and leeching"
    ],
    evaluationCriteria: [
      "Download speed vs centralized baseline",
      "Integrity verification accuracy",
      "Resilience to peer failures",
      "Protocol documentation"
    ],
    teams: ["CE-A"],
    sprintCount: 4,
  }
];

export const MOCK_STUDENTS: Student[] = [
  { id: "s1", name: "Aarav Mehta", rollNumber: "22CE001", email: "aarav.mehta@kjit.ac.in", githubUsername: "aarav-m", team: "CE-A", status: "active" },
  { id: "s2", name: "Priya Sharma", rollNumber: "22CE002", email: "priya.sharma@kjit.ac.in", githubUsername: "priya-s", team: "CE-A", status: "active" },
  { id: "s3", name: "Rohan Patel", rollNumber: "22CE003", email: "rohan.patel@kjit.ac.in", githubUsername: "rohanp99", team: "CE-B", status: "active" },
  { id: "s4", name: "Nisha Desai", rollNumber: "22CE004", email: "nisha.desai@kjit.ac.in", githubUsername: "nisha-dev", team: "CE-A", status: "active" },
  { id: "s5", name: "Vivek Joshi", rollNumber: "22CE005", email: "vivek.joshi@kjit.ac.in", githubUsername: "vjoshi", team: "CE-B", status: "active" },
];

export const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: "sub1",
    studentId: "s1",
    assignmentId: "a1",
    repoUrl: "https://github.com/aarav-m/dist-task-queue",
    docLink: "https://docs.google.com/document/d/abc123",
    status: "active",
    sprints: [
      {
        sprint: 0,
        submittedAt: "2026-09-02T10:30:00Z",
        commitSha: "f3a1b2c",
        docLink: "https://docs.google.com/document/d/abc123",
        summary: {
          completed: ["Project scaffolding", "Redis integration", "Basic worker process"],
          changed: "Set up the repository structure with Docker Compose for Redis and PostgreSQL. Implemented a basic worker that polls the queue and executes tasks.",
          blockers: "None at this stage.",
          demoLink: ""
        },
        metrics: { commits: 8, filesChanged: 14, linesAdded: 892, linesRemoved: 23, newFiles: 12, modifiedFiles: 2 }
      },
      {
        sprint: 1,
        submittedAt: "2026-09-16T14:20:00Z",
        commitSha: "9d4e5f6",
        docLink: "https://docs.google.com/document/d/abc456",
        summary: {
          completed: ["Priority queue implementation", "Retry logic with exponential backoff", "Task state persistence"],
          changed: "Moved from a simple FIFO queue to a priority-based system using Redis sorted sets. Added retry mechanism with configurable max attempts and exponential backoff.",
          blockers: "Redis cluster mode requires paid plan — using single-node for now.",
          demoLink: "https://youtu.be/demo1"
        },
        metrics: { commits: 12, filesChanged: 9, linesAdded: 634, linesRemoved: 187, newFiles: 3, modifiedFiles: 6 }
      },
      {
        sprint: 2,
        submittedAt: "2026-09-30T11:00:00Z",
        commitSha: "a7b8c9d",
        docLink: "https://docs.google.com/document/d/abc789",
        summary: {
          completed: ["REST API for task submission", "Worker health checks", "Dead-letter queue"],
          changed: "Built a FastAPI layer exposing /tasks/submit, /tasks/status/:id, and /workers/health. Dead-letter queue collects tasks that fail after max retries.",
          blockers: "Load testing revealed a bottleneck at ~400 tasks/minute — investigating worker concurrency model.",
          demoLink: "https://youtu.be/demo2"
        },
        metrics: { commits: 19, filesChanged: 21, linesAdded: 1243, linesRemoved: 98, newFiles: 8, modifiedFiles: 13 }
      }
    ]
  },
  {
    id: "sub2",
    studentId: "s2",
    assignmentId: "a1",
    repoUrl: "https://github.com/priya-s/task-queue-proj",
    docLink: "https://docs.google.com/document/d/xyz123",
    status: "accepted",
    sprints: [
      {
        sprint: 0,
        submittedAt: "2026-09-01T09:00:00Z",
        commitSha: "b1c2d3e",
        docLink: "https://docs.google.com/document/d/xyz123",
        summary: {
          completed: ["Repo setup", "Architecture diagram", "Docker environment"],
          changed: "Created the initial project with Dockerfile and docker-compose. Wrote architecture documentation.",
          blockers: "None.",
        },
        metrics: { commits: 5, filesChanged: 7, linesAdded: 412, linesRemoved: 0, newFiles: 7, modifiedFiles: 0 }
      },
      {
        sprint: 1,
        submittedAt: "2026-09-14T16:45:00Z",
        commitSha: "c3d4e5f",
        docLink: "https://docs.google.com/document/d/xyz456",
        summary: {
          completed: ["Queue core logic", "Worker pool", "Basic monitoring"],
          changed: "Implemented the core queue with RabbitMQ. Built a worker pool that scales horizontally. Added Prometheus metrics endpoint.",
          blockers: "None.",
          demoLink: "https://youtu.be/demo-priya"
        },
        metrics: { commits: 15, filesChanged: 18, linesAdded: 1102, linesRemoved: 45, newFiles: 10, modifiedFiles: 8 }
      },
      {
        sprint: 2,
        submittedAt: "2026-09-28T10:30:00Z",
        commitSha: "d5e6f7a",
        docLink: "https://docs.google.com/document/d/xyz789",
        summary: {
          completed: ["Grafana dashboard", "Load testing at 1200 tasks/min", "API documentation"],
          changed: "Integrated Grafana with pre-built dashboards. Achieved 1200 tasks/minute across 3 workers. Wrote OpenAPI spec.",
          blockers: "None.",
          demoLink: "https://youtu.be/demo-priya-2"
        },
        metrics: { commits: 22, filesChanged: 14, linesAdded: 876, linesRemoved: 234, newFiles: 4, modifiedFiles: 10 }
      },
      {
        sprint: 3,
        submittedAt: "2026-10-14T12:00:00Z",
        commitSha: "e7f8a9b",
        docLink: "https://docs.google.com/document/d/xyzfinal",
        summary: {
          completed: ["Final performance tuning", "Fault tolerance tests", "Final documentation"],
          changed: "Ran chaos engineering tests simulating node failures. System recovered automatically within 15 seconds. Updated all documentation.",
          blockers: "None — project complete.",
          demoLink: "https://youtu.be/demo-priya-final"
        },
        metrics: { commits: 11, filesChanged: 6, linesAdded: 203, linesRemoved: 89, newFiles: 1, modifiedFiles: 5 }
      }
    ]
  },
  {
    id: "sub3",
    studentId: "s3",
    assignmentId: "a1",
    repoUrl: "https://github.com/rohanp99/task-q",
    docLink: "https://docs.google.com/document/d/rp123",
    status: "active",
    sprints: [
      {
        sprint: 0,
        submittedAt: "2026-09-03T13:00:00Z",
        commitSha: "f1a2b3c",
        docLink: "https://docs.google.com/document/d/rp123",
        summary: {
          completed: ["Initial setup", "Tech stack decision"],
          changed: "Set up the project. Decided to use Celery + Redis.",
          blockers: "None.",
        },
        metrics: { commits: 4, filesChanged: 5, linesAdded: 198, linesRemoved: 0, newFiles: 5, modifiedFiles: 0 }
      }
    ]
  }
];

export const MOCK_ANNOUNCEMENTS = [
  {
    id: "ann1",
    title: "Sprint 3 Review Schedule",
    date: "2026-09-10",
    author: "Prof. D. Raval",
    content: "Sprint 3 lab reviews will be held on October 18–20 in Lab 204. Please ensure your repositories are updated before 9 AM on your review date. Slots will be posted on the department notice board."
  },
  {
    id: "ann2",
    title: "GitHub Organization Invite",
    date: "2026-09-01",
    author: "Prof. D. Raval",
    content: "All students must accept the GitHub organization invite sent to their registered email addresses. Students who have not accepted by September 5 will be unable to submit Sprint 0."
  }
];
