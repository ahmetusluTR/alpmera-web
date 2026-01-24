export function AlpmeraBatchFlow() {
  const steps = [
    {
      number: "1",
      title: "A Campaign Is Defined",
      description: "Alpmera creates a campaign with clear rules, timelines, and outcomes — nothing implied.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      number: "2",
      title: "People Join Together",
      description: "Individuals join the campaign at their own pace and see real participation as it builds.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      number: "3",
      title: "Funds Stay Protected",
      description: "When you join, your funds are committed to escrow-style protection and are not released early.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      number: "4",
      title: "The Campaign Resolves",
      description: "The campaign either succeeds and moves forward, or fails and closes — clearly and explicitly.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      number: "5",
      title: "Fulfillment or Refund",
      description: "Successful campaigns are fulfilled by Alpmera, and failed campaigns result in refunds.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-6">
      {/* Main flow steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {steps.map((step, index) => (
          <div key={step.number} className="relative overflow-visible pt-6">
            {/* Step card */}
            <div className="relative bg-white rounded-lg border-2 border-alpmera-text p-6 flex flex-col h-full">
              {/* Step number badge - positioned relative to parent container */}
              <div className="absolute -top-11 left-0 w-12 h-12 rounded-full bg-alpmera-accent text-alpmera-text font-bold flex items-center justify-center text-lg shadow-md border-2 border-alpmera-text">
                {step.number}
              </div>

              {/* Icon container - top section with background */}
              <div className="flex items-center justify-center bg-alpmera-secondary/30 -mx-6 -mt-6 pt-8 pb-6 rounded-t-lg mb-6">
                <div className="text-alpmera-primary">
                  {step.icon}
                </div>
              </div>

              {/* Step title and description - inside card */}
              <div className="space-y-2 flex-1">
                <h3 className="font-bold text-lg text-alpmera-text font-display">
                  {step.title}
                </h3>
                <p className="text-sm text-alpmera-text-light font-body leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
