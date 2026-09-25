/** Lightweight skeleton shown while a page's data loads. */
export function PageLoading() {
  return (
    <main id="main" aria-busy="true" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-muted" />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </main>
  );
}
