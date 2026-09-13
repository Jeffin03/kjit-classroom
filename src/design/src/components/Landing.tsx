interface LandingProps {
  isLoggedIn: boolean;
  onSignIn: () => void;
  onNavigate: (page: "assignments") => void;
}

export default function Landing({ isLoggedIn, onSignIn, onNavigate }: LandingProps) {
  const features = [
    {
      color: "bg-green-100",
      iconColor: "text-green-600",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      title: "Student-Owned Repos",
      description: "Projects live in your GitHub account. Pin them to your profile. Show them to employers.",
    },
    {
      color: "bg-blue-100",
      iconColor: "text-blue-600",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      title: "Real-World Workflow",
      description: "Fork, branch, commit, PR. Learn the workflow used by professional development teams.",
    },
    {
      color: "bg-purple-100",
      iconColor: "text-purple-600",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      title: "Permanent Portfolio",
      description: "Unlike GitHub Classroom, your work stays with you forever. Build your developer profile.",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-3xl w-full mx-auto text-center">
        {/* Logo */}
        <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <span className="text-white font-bold text-3xl">K</span>
        </div>

        {/* Hero Text */}
        <h1 className="mt-6 text-5xl font-bold text-gray-900 tracking-tight">
          KJIT Classroom
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          GitHub-native project submission &amp; portfolio management platform
        </p>
        <p className="mt-4 text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Fork project templates to your own GitHub account. Build real projects. Create a portfolio
          that follows you beyond graduation.
        </p>

        {/* CTA */}
        <div className="mt-8">
          {isLoggedIn ? (
            <button
              onClick={() => onNavigate("assignments")}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white font-medium text-lg px-8 py-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
            >
              View Assignments
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={onSignIn}
              className="inline-flex items-center gap-3 bg-gray-900 text-white font-medium text-lg px-8 py-4 rounded-xl hover:bg-gray-800 transition-colors shadow-lg"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              Sign in with GitHub
            </button>
          )}
        </div>

        {/* Feature Cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <div className={`w-10 h-10 ${f.color} ${f.iconColor} rounded-lg flex items-center justify-center`}>
                {f.icon}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
