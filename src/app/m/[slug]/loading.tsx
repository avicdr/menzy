export default function DinerMenuLoading() {
  return (
    <div
      className="min-h-screen w-full bg-[#F7F3EC] text-[#35271F] flex flex-col"
      aria-busy="true"
      aria-label="Loading restaurant menu"
    >
      <div className="sticky top-0 z-10 border-b border-black/10 bg-white/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="space-y-2 flex-1">
            <div className="h-5 w-44 rounded-lg bg-black/10 animate-pulse motion-reduce:animate-none" />
            <div className="h-3 w-28 rounded-md bg-black/5 animate-pulse motion-reduce:animate-none" />
          </div>
          <div className="h-9 w-24 rounded-xl bg-black/10 animate-pulse motion-reduce:animate-none shrink-0" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
        <div className="rounded-3xl bg-white border border-black/5 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="w-full aspect-[2/1] rounded-2xl bg-black/5 animate-pulse motion-reduce:animate-none" />
          <div className="flex gap-2">
            <div className="h-8 w-20 rounded-full bg-black/10 animate-pulse motion-reduce:animate-none" />
            <div className="h-8 w-24 rounded-full bg-black/5 animate-pulse motion-reduce:animate-none" />
            <div className="h-8 w-20 rounded-full bg-black/5 animate-pulse motion-reduce:animate-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
          {[0, 1, 2, 3].map((slot) => (
            <div
              key={slot}
              className="rounded-2xl bg-white border border-black/5 overflow-hidden p-2.5 space-y-2.5"
            >
              <div className="aspect-square w-full rounded-xl bg-black/5 animate-pulse motion-reduce:animate-none" />
              <div className="h-3.5 w-3/4 rounded bg-black/10 animate-pulse motion-reduce:animate-none" />
              <div className="h-3 w-1/2 rounded bg-black/5 animate-pulse motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

