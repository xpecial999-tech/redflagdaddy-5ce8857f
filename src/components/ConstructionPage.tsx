import { Link } from "@tanstack/react-router";

export function ConstructionPage() {
  return (
    <section
      className="mx-auto max-w-xl py-2 text-center sm:py-8"
      aria-labelledby="construction-title"
    >
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl shadow-primary/10">
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
        <p>We are making improvements and will be back soon.</p>
      </div>
      <p className="mt-5 text-sm text-muted-foreground">
        Already have a private assessment or report link? It will continue to work.
      </p>
      <Link to="/about" className="mt-3 inline-flex text-sm text-primary hover:text-foreground">
        Learn about RedFlagDaddy
      </Link>
    </section>
  );
}
