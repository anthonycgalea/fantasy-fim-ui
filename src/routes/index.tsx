import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fantasy FiM · Fantasy FIRST Robotics in Michigan" },
      { name: "description", content: "Draft Michigan FRC teams, set lineups and compete across the district season." },
      { property: "og:title", content: "Fantasy FiM" },
      { property: "og:description", content: "Fantasy FIRST Robotics Competition for Michigan." },
    ],
  }),
  component: Index,
});

const stats = [
  ["Teams", "—"],
  ["Events", "—"],
  ["Leagues", "—"],
  ["Week", "—"],
];

function Index() {
  return (
    <section className="py-10">
      <div className="rounded-[2rem] border bg-card p-10 shadow-soft sm:p-16">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
          <span className="h-2 w-2 rounded-full bg-maize" /> FIRST in Michigan fantasy season
        </span>
        <h1 className="mt-6 max-w-3xl text-5xl font-extrabold leading-[1.05] sm:text-6xl">
          Draft robots. Build your lineup. <span className="text-primary">Win Michigan.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">
          Pick Michigan FRC teams, set your weekly lineup, and score points from every match through States.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/leagues" className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-soft transition hover:opacity-90">
            Find a league
          </Link>
          <Link to="/teams" className="rounded-full bg-secondary px-6 py-3 font-semibold text-secondary-foreground transition hover:bg-accent">
            Scout teams
          </Link>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-2xl border bg-card p-6 shadow-soft">
            <div className="text-sm font-medium text-muted-foreground">{k}</div>
            <div className="mt-1 text-3xl font-extrabold">{v}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
