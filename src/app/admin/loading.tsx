export default function AdminPortalLoading() {
  return (
    <div
      className="min-h-screen bg-[#0E0A08] text-cream-100 flex flex-col font-sans"
      aria-busy="true"
      aria-label="Loading Menzy Founder Portal"
    >
      <div className="sticky top-0 z-30 bg-[#140E0A] border-b border-espresso-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-espresso-800 animate-pulse motion-reduce:animate-none" />
          <div className="space-y-1.5">
            <div className="h-5 w-44 rounded bg-espresso-800 animate-pulse motion-reduce:animate-none" />
            <div className="h-3 w-56 rounded bg-espresso-900 animate-pulse motion-reduce:animate-none" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-28 rounded-xl bg-espresso-800 animate-pulse motion-reduce:animate-none" />
          <div className="h-8 w-36 rounded-xl bg-espresso-800 animate-pulse motion-reduce:animate-none" />
        </div>
      </div>

      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((slot) => (
            <div
              key={slot}
              className="p-5 bg-[#160F0B] rounded-2xl border border-espresso-800 space-y-3"
            >
              <div className="h-3 w-28 rounded bg-espresso-800 animate-pulse motion-reduce:animate-none" />
              <div className="h-8 w-20 rounded bg-espresso-800 animate-pulse motion-reduce:animate-none" />
              <div className="h-3 w-36 rounded bg-espresso-900 animate-pulse motion-reduce:animate-none" />
            </div>
          ))}
        </div>

        <div className="p-6 bg-[#140E0A] rounded-3xl border border-espresso-800 space-y-4">
          <div className="h-5 w-48 rounded bg-espresso-800 animate-pulse motion-reduce:animate-none" />
          <div className="space-y-2.5">
            {[0, 1, 2].map((row) => (
              <div
                key={row}
                className="h-12 rounded-xl bg-espresso-900/50 animate-pulse motion-reduce:animate-none"
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

