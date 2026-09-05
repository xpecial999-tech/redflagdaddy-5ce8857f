export function ConstructionPage() {
  return (
    <section
      className="mx-auto max-w-xl py-2 text-center sm:py-8"
      aria-labelledby="construction-title"
    >
      <div className="overflow-hidden rounded-3xl border border-primary/30 bg-black shadow-2xl shadow-primary/20">
        <img
          src="/under-construction.png"
          alt=""
          width={1122}
          height={1402}
          className="h-auto w-full"
        />
      </div>
      <div className="sr-only">
        <h1 id="construction-title">RedFlagDaddy is under construction</h1>
        <p>RedFlagDaddy is currently undergoing improvements. We will be back soon.</p>
      </div>
      <p className="mt-5 text-sm text-muted-foreground">We will be back soon.</p>
    </section>
  );
}
