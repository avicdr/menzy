export default function OwnerDashboardLoading() {
  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row bg-cream-100/40 w-full"
      aria-busy="true"
      aria-label="Loading Owner Console"
    >
      <aside className="hidden lg:block w-64 shrink-0 border-r border-cream-200 bg-cream-50 p-4 space-y-3">
        <div className="h-9 w-36 rounded-xl bg-cream-200 animate-pulse motion-reduce:animate-none" />
        <div className="h-10 w-full rounded-xl bg-cream-200/80 animate-pulse motion-reduce:animate-none" />
        <div className="space-y-2 pt-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-9 w-full rounded-xl bg-cream-200/70 animate-pulse motion-reduce:animate-none"
            />
          ))}
        </div>
      </aside>

      <main className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-cream-300">
          <div className="space-y-2">
            <div className="h-7 w-56 rounded-xl bg-cream-200 animate-pulse motion-reduce:animate-none" />
            <div className="h-4 w-40 rounded bg-cream-200/80 animate-pulse motion-reduce:animate-none" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-36 rounded-xl bg-cream-200 animate-pulse motion-reduce:animate-none" />
            <div className="h-9 w-36 rounded-xl bg-white border border-cream-300 animate-pulse motion-reduce:animate-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="p-4 sm:p-5 bg-white rounded-2xl border border-cream-200 shadow-soft space-y-3"
            >
              <div className="h-3 w-24 rounded bg-cream-200 animate-pulse motion-reduce:animate-none" />
              <div className="h-8 w-16 rounded bg-cream-200 animate-pulse motion-reduce:animate-none" />
              <div className="h-3 w-28 rounded bg-cream-100 animate-pulse motion-reduce:animate-none" />
            </div>
          ))}
        </div>

        <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
          <div className="h-5 w-44 rounded bg-cream-200 animate-pulse motion-reduce:animate-none" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((card) => (
              <div
                key={card}
                className="h-20 rounded-2xl bg-cream-100/80 border border-cream-200 animate-pulse motion-reduce:animate-none"
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

