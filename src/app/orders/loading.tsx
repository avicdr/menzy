export default function OrdersTerminalLoading() {
  return (
    <div
      className="min-h-screen bg-[#0A0705] text-cream-100 flex flex-col font-sans"
      aria-busy="true"
      aria-label="Loading Kitchen Display Terminal"
    >
      <header className="px-4 sm:px-6 py-3.5 bg-[#140E0A] border-b border-espresso-800/90 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-espresso-800 animate-pulse motion-reduce:animate-none" />
          <div className="space-y-1.5">
            <div className="h-5 w-44 rounded bg-espresso-800 animate-pulse motion-reduce:animate-none" />
            <div className="h-3 w-32 rounded bg-espresso-900 animate-pulse motion-reduce:animate-none" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 rounded-xl bg-espresso-800 animate-pulse motion-reduce:animate-none" />
          <div className="h-8 w-8 rounded-xl bg-espresso-800 animate-pulse motion-reduce:animate-none" />
        </div>
      </header>

      <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((col) => (
          <div
            key={col}
            className="rounded-3xl bg-[#140E0A] border border-espresso-800 p-4 space-y-3"
          >
            <div className="h-4 w-32 rounded bg-espresso-800 animate-pulse motion-reduce:animate-none" />
            {[0, 1].map((card) => (
              <div
                key={card}
                className="rounded-2xl bg-espresso-900/60 border border-espresso-800/70 p-4 space-y-2.5"
              >
                <div className="h-4 w-24 rounded bg-espresso-800 animate-pulse motion-reduce:animate-none" />
                <div className="h-3 w-full rounded bg-espresso-800/70 animate-pulse motion-reduce:animate-none" />
                <div className="h-8 w-full rounded-xl bg-espresso-800 animate-pulse motion-reduce:animate-none" />
              </div>
            ))}
          </div>
        ))}
      </main>
    </div>
  );
}

