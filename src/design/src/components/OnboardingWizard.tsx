import { useState } from "react";

interface OnboardingWizardProps {
  onBack: () => void;
}

const teams = [
  { name: "MCA-A", members: 45 },
  { name: "MCA-B", members: 43 },
  { name: "MSc CS-A", members: 38 },
  { name: "MSc CS-B", members: 36 },
  { name: "MSc AI", members: 30 },
  { name: "MSc Cyber Security", members: 28 },
];

const matchedStudents = [
  { name: "Ananya Sharma", email: "ananya.sharma@kristujayanti.com", rollNo: "MCA22001", checked: true },
  { name: "Rohit Krishnan", email: "rohit.k@kristujayanti.com", rollNo: "MCA22002", checked: true },
  { name: "Divya Nair", email: "divya.nair@kristujayanti.com", rollNo: "MCA22003", checked: true },
  { name: "Arun Pillai", email: "arun.pillai@kristujayanti.com", rollNo: "MCA22004", checked: true },
];

const unmatchedStudents = [
  { name: "Unknown", email: "sneha.raj@kristujayanti.com", rollNo: "MCA22005" },
  { name: "Unknown", email: "priya.m@kristujayanti.com", rollNo: "MCA22006" },
];

const stepLabels = ["Select Class", "Upload CSV", "Verify Students", "Confirm & Invite", "Complete"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center mt-8 mb-8">
      {stepLabels.map((label, i) => {
        const step = i + 1;
        const isComplete = step < current;
        const isActive = step === current;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isComplete
                    ? "bg-green-500 text-white"
                    : isActive
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {isComplete ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              <span
                className={`mt-1 text-xs whitespace-nowrap ${
                  isActive ? "text-indigo-600 font-medium" : "text-gray-500"
                }`}
              >
                {label}
              </span>
            </div>
            {i < stepLabels.length - 1 && (
              <div
                className={`h-0.5 w-12 md:w-20 mx-2 mb-4 ${
                  isComplete ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OnboardingWizard({ onBack }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [hasFile, setHasFile] = useState(false);
  const [checked, setChecked] = useState<boolean[]>(matchedStudents.map((s) => s.checked));
  const [inviting, setInviting] = useState(false);
  const [done, setDone] = useState(false);

  const handleInvite = async () => {
    setInviting(true);
    await new Promise((r) => setTimeout(r, 1800));
    setInviting(false);
    setDone(true);
    setStep(5);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Onboard Students</h1>
        <p className="mt-2 text-base text-gray-600">Add students to your GitHub org and class teams</p>
      </div>

      <StepIndicator current={step} />

      {/* Step 1 */}
      {step === 1 && (
        <div className="bg-white border border-gray-100 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select a class team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {teams.map((t) => (
              <button
                key={t.name}
                onClick={() => setSelectedTeam(t.name)}
                className={`w-full text-left px-4 py-4 border rounded-lg transition-colors ${
                  selectedTeam === t.name
                    ? "bg-indigo-50 border-indigo-300"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="text-base font-medium text-gray-900">{t.name}</div>
                <div className="text-sm text-gray-500">{t.members} members</div>
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!selectedTeam}
              className="bg-indigo-600 text-white text-sm font-medium px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="bg-white border border-gray-100 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Upload student list</h2>
          <p className="text-sm text-gray-500 mb-6">
            CSV format:{" "}
            <code className="bg-gray-100 rounded px-1.5 py-0.5 text-xs font-mono">roll_no, college_email</code>
          </p>

          <div
            onClick={() => setHasFile(true)}
            className={`w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              hasFile
                ? "border-green-400 bg-green-50"
                : "border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50"
            }`}
          >
            <svg className={`w-8 h-8 mx-auto ${hasFile ? "text-green-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              {hasFile ? "students-mca-a.csv uploaded" : "Drop your CSV here or click to browse"}
            </p>
          </div>

          {hasFile && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4 overflow-auto max-h-40">
              <table className="text-xs w-full">
                <thead>
                  <tr className="text-gray-500">
                    <th className="text-left pb-2">roll_no</th>
                    <th className="text-left pb-2">college_email</th>
                  </tr>
                </thead>
                <tbody>
                  {matchedStudents.map((s) => (
                    <tr key={s.rollNo} className="text-gray-800">
                      <td className="py-0.5">{s.rollNo}</td>
                      <td className="py-0.5">{s.email}</td>
                    </tr>
                  ))}
                  {unmatchedStudents.map((s) => (
                    <tr key={s.rollNo} className="text-gray-800">
                      <td className="py-0.5">{s.rollNo}</td>
                      <td className="py-0.5">{s.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => setStep(1)} className="text-sm text-gray-600 hover:text-gray-900">Back</button>
            <button
              onClick={() => setStep(3)}
              disabled={!hasFile}
              className="bg-indigo-600 text-white text-sm font-medium px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40"
            >
              Match with GitHub
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="bg-white border border-gray-100 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Verify matched accounts</h2>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Matched</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Unmatched</span>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto divide-y divide-gray-100">
            {matchedStudents.map((s, i) => (
              <div key={s.rollNo} className="px-3 py-3 flex items-center gap-3 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={checked[i]}
                  onChange={(e) => {
                    const next = [...checked];
                    next[i] = e.target.checked;
                    setChecked(next);
                  }}
                  className="w-4 h-4 rounded accent-indigo-600"
                />
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                  {s.name[0]}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.email}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="text-sm text-gray-500 font-medium mb-2">Unmatched ({unmatchedStudents.length})</div>
            <div className="border border-gray-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto divide-y divide-gray-100">
              {unmatchedStudents.map((s) => (
                <div key={s.rollNo} className="px-3 py-3 flex items-center gap-3 hover:bg-gray-50">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-xs font-medium text-red-600">?</div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{s.rollNo}</div>
                    <div className="text-xs text-gray-500">{s.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="mt-3 text-sm text-indigo-600 hover:text-indigo-700">
            Download unmatched list (CSV)
          </button>

          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => setStep(2)} className="text-sm text-gray-600 hover:text-gray-900">Back</button>
            <button
              onClick={() => setStep(4)}
              className="bg-indigo-600 text-white text-sm font-medium px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Confirm &amp; Send Invites
            </button>
          </div>
        </div>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <div className="bg-white border border-gray-100 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Review and confirm</h2>
          <div className="space-y-3">
            {[
              { label: "Students to invite", count: checked.filter(Boolean).length, color: "text-blue-600" },
              { label: "Already org members", count: 12, color: "text-gray-900" },
              { label: "No GitHub account", count: unmatchedStudents.length, color: "text-red-600" },
            ].map((row) => (
              <div key={row.label} className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">{row.label}</span>
                <span className={`text-sm font-medium ${row.color}`}>{row.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => setStep(3)} className="text-sm text-gray-600 hover:text-gray-900">Back</button>
            <button
              onClick={handleInvite}
              disabled={inviting}
              className="bg-green-600 text-white text-sm font-medium px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              {inviting ? "Sending invites..." : "Confirm & Send Invites"}
            </button>
          </div>
        </div>
      )}

      {/* Step 5 */}
      {step === 5 && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Onboarding complete!</h2>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-lg mx-auto">
            {[
              { label: "Invited", value: checked.filter(Boolean).length, color: "text-blue-600" },
              { label: "Already members", value: 12, color: "text-gray-900" },
              { label: "Errors", value: unmatchedStudents.length, color: "text-red-600" },
              { label: "Total", value: checked.filter(Boolean).length + 12, color: "text-indigo-600" },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-center gap-6">
            <button onClick={onBack} className="text-sm text-indigo-600 hover:text-indigo-700">View Roster</button>
            <button
              onClick={() => { setStep(1); setSelectedTeam(null); setHasFile(false); setDone(false); }}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Onboard Another Class
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
