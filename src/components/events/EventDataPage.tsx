import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { useEventData, type EventData } from "@/api/useEventData";
import { getDifficultyHue, getEpaRanges, sortEvents } from "@/lib/event-data";
import { EmptyPanel, PageHeader } from "@/components/PageHeader";
import { ErrorPanel, LoadingPanel } from "@/components/drafts/QueryPanel";

const columns = [
  { key: "event_name", label: "Event Name", description: "Event name" },
  { key: "teamcount", label: "Team Count", description: "Number of teams at the event" },
  { key: "maxepa", label: "Max EPA", description: "Highest team EPA" },
  { key: "top8epa", label: "EPA 8", description: "8th-highest team EPA" },
  { key: "top24epa", label: "EPA 24", description: "24th-highest team EPA" },
  { key: "avgepa", label: "Average EPA", description: "Average team EPA, rounded" },
  { key: "medianepa", label: "Median EPA", description: "Median team EPA" },
] as const;
const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

export function EventDataPage() {
  const events = useEventData();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: keyof EventData; direction: "ascending" | "descending" }>(
    { key: "event_name", direction: "ascending" },
  );
  const ranges = useMemo(() => getEpaRanges(events.data ?? []), [events.data]);
  const rows = useMemo(
    () =>
      sortEvents(events.data ?? [], sort.key, sort.direction).filter((event) =>
        event.event_name.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [events.data, sort, search],
  );
  const requestSort = (key: keyof EventData) =>
    setSort((previous) => ({
      key,
      direction:
        previous.key === key && previous.direction === "ascending" ? "descending" : "ascending",
    }));

  return (
    <>
      <PageHeader title="Event data">
        Scout the field. Compare FIRST in Michigan events by team strength and EPA.
      </PageHeader>
      {events.isPending ? (
        <LoadingPanel label="Loading event data…" />
      ) : events.isError ? (
        <ErrorPanel
          label="Event data couldn’t be loaded."
          retry={() => {
            void events.refetch();
          }}
          busy={events.isFetching}
        />
      ) : !events.data.length ? (
        <EmptyPanel label="Event data isn’t available yet." />
      ) : (
        <section
          aria-labelledby="event-comparison-title"
          className="overflow-hidden rounded-2xl border bg-card shadow-soft"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5 sm:p-6">
            <div>
              <h2 id="event-comparison-title" className="text-lg font-bold">
                Event comparison
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {rows.length} of {events.data.length} events · Select a column to sort
              </p>
            </div>
            <label className="relative block w-full sm:w-64">
              <span className="sr-only">Find an event</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Find an event…"
                className="w-full rounded-xl border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/20 px-5 py-3 sm:px-6">
            <p className="text-xs text-muted-foreground">
              EPA colors compare events within each column.
            </p>
            <div
              aria-label="Event difficulty: green is lower, red is higher"
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
            >
              <span>Lower</span>
              <span
                aria-hidden="true"
                className="h-2 w-28 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, hsl(140 70% 45%), hsl(45 90% 55%), hsl(0 75% 55%))",
                }}
              />
              <span>Higher difficulty</span>
            </div>
          </div>
          {!rows.length ? (
            <div className="p-6">
              <EmptyPanel label="No events match your search." />
            </div>
          ) : (
            <div
              role="region"
              aria-label="Event comparison, scroll to see all data"
              tabIndex={0}
              className="max-h-[70vh] overflow-auto"
            >
              <table
                aria-labelledby="event-comparison-title"
                className="w-full min-w-[980px] border-separate border-spacing-0 text-sm"
              >
                <thead className="sticky top-0 z-20 bg-secondary">
                  <tr>
                    {columns.map((column, index) => (
                      <th
                        key={column.key}
                        scope="col"
                        aria-sort={sort.key === column.key ? sort.direction : "none"}
                        className={`border-b px-3 py-4 ${index === 0 ? "sticky left-0 z-30 w-48 bg-secondary pl-6 text-left sm:w-80" : "text-right"}`}
                      >
                        <button
                          type="button"
                          onClick={() => requestSort(column.key)}
                          title={column.description}
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md text-xs font-semibold transition hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring ${sort.key === column.key ? "text-primary" : "text-muted-foreground"}`}
                        >
                          {column.label}
                          {sort.key !== column.key ? (
                            <ArrowUpDown aria-hidden="true" className="h-3 w-3 opacity-50" />
                          ) : sort.direction === "ascending" ? (
                            <ArrowUp aria-hidden="true" className="h-3 w-3" />
                          ) : (
                            <ArrowDown aria-hidden="true" className="h-3 w-3" />
                          )}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((event) => (
                    <tr key={event.event_name} className="group">
                      <th
                        scope="row"
                        className="sticky left-0 z-10 border-b bg-card py-4 pl-6 pr-4 text-left font-semibold group-hover:bg-secondary"
                      >
                        <span className="block w-40 whitespace-normal sm:w-72">
                          {event.event_name}
                        </span>
                      </th>
                      <td className="border-b px-3 py-3 text-right font-medium tabular-nums text-muted-foreground group-hover:bg-muted/20">
                        {event.teamcount}
                      </td>
                      {columns.slice(2).map((column) => {
                        const key = column.key as Exclude<
                          keyof EventData,
                          "event_name" | "teamcount"
                        >;
                        const value = event[key],
                          range = ranges[key];
                        const hue = value !== null && range ? getDifficultyHue(value, range) : null;
                        return (
                          <td
                            key={key}
                            className="border-b px-2 py-2.5 text-right tabular-nums group-hover:bg-muted/20"
                          >
                            <div
                              className={`rounded-lg border px-3 py-2.5 font-semibold ${hue === null ? "border-transparent text-muted-foreground" : "text-foreground"}`}
                              style={
                                hue === null
                                  ? undefined
                                  : {
                                      background: `linear-gradient(110deg, hsl(${hue} 75% 50% / 0.20), hsl(${hue} 75% 50% / 0.08))`,
                                      borderColor: `hsl(${hue} 70% 50% / 0.16)`,
                                    }
                              }
                            >
                              {value === null
                                ? "—"
                                : key === "avgepa"
                                  ? Math.round(value)
                                  : numberFormat.format(value)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}
