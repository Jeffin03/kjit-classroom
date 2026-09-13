import { useState } from "react";

const allStudents = [
  { rollNo: "MCA22001", email: "ananya.sharma@kristujayanti.com", github: "ananya-sharma", team: "MCA-A", status: "active" as const, onboardedBy: "priya.menon" },
  { rollNo: "MCA22002", email: "rohit.k@kristujayanti.com", github: "rohit-krishnan", team: "MCA-A", status: "active" as const, onboardedBy: "priya.menon" },
  { rollNo: "MCA22003", email: "divya.nair@kristujayanti.com", github: "divya-nair", team: "MCA-B", status: "active" as const, onboardedBy: "arjun.nair" },
  { rollNo: "MCA22004", email: "arun.pillai@kristujayanti.com", github: "arun-pillai-kjit", team: "MCA-B", status: "invited" as const, onboardedBy: "arjun.nair" },
  { rollNo: "MCA22005", email: "sneha.raj@kristujayanti.com", github: "", team: "MSc AI", status: "no-account" as const, onboardedBy: "priya.menon" },
  { rollNo: "MSc22001", email: "preethi.ravi@kristujayanti.com", github: "preethi-ravi", team: "MSc CS-A", status: "active" as const, onboardedBy: "arjun.nair" },
];

const statusConfig = {
  active: { label: "Active", bg: "bg-green-100", text: "text-green-700" },
  invited: { label: "Invited", bg: "bg-yellow-100", text: "text-yellow-700" },
  "no-account": { label: "No Account", bg: "bg-red-100", text: "text-red-700" },
};

export default function RosterView() {
  const [classFilter, setClassFilter] = useState("All Classes");
  const [search, setSearch] = useState("");

  const teams = ["All Classes", ...Array.from(new Set(allStudents.map((s) => s.team)))];

  const filtered = allStudents.filter((s) => {
    const matchClass = classFilter === "All Classes" || s.team === classFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || s.rollNo.toLowerCase().includes(q) || s.github.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    return matchClass && matchSearch;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Roster</h1>
          <p className="mt-2 text-base text-gray-600">View all onboarded students across classes</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            Onboard New Class
          </button>
          <button className="bg-white border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            Export CSV
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4 flex-wrap">
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {teams.map((t) => <option key={t}>{t}</option>)}
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or roll number..."
          className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="mt-6 bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {["Roll No", "Email", "GitHub", "Team", "Status", "Onboarded By"].map((col) => (
                <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">No students found</td>
              </tr>
            ) : (
              filtered.map((s) => {
                const cfg = statusConfig[s.status];
                return (
                  <tr key={s.rollNo} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{s.rollNo}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.email}</td>
                    <td className="px-4 py-3 text-sm">
                      {s.github ? (
                        <a href={`https://github.com/${s.github}`} className="text-indigo-600 hover:text-indigo-700">
                          @{s.github}
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.team}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.onboardedBy}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
