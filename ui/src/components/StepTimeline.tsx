import { CheckCircle, Loader2, Sparkles, Table } from "lucide-react";
import type { StepTimelineProps, GroupedStep } from "@/lib/types";
import { parseListItems, parseTableInfo } from "@/lib/utils";

export default function StepTimeline({ steps, loading }: StepTimelineProps) {
  const groupedSteps: GroupedStep[] = steps.reduce(
    (acc: GroupedStep[], step, idx) => {
      const existing = acc.find((g) => g.title === step.title);
      if (existing) {
        existing.items.push({ ...step, originalIndex: idx });
        existing.status = step.status;
      } else {
        acc.push({
          title: step.title,
          status: step.status,
          items: [{ ...step, originalIndex: idx }],
        });
      }
      return acc;
    },
    []
  );

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {groupedSteps.map((group, groupIdx) => (
        <div
          key={group.title}
          className="relative group bg-white border border-slate-200 shadow-sm rounded-xl p-5 transition-all hover:shadow-md hover:scale-[1.01] flex flex-col justify-between"
        >
          {/* Step header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              {group.status === "done" ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : groupIdx === groupedSteps.length - 1 && loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              ) : (
                <Sparkles className="w-4 h-4 text-slate-400" />
              )}
              <h3 className="text-sm font-semibold text-slate-800">
                {group.title}
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              {group.items.length} {group.items.length === 1 ? "step" : "steps"}
            </span>
          </div>

          {/* Progress bar */}
          <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
            <div
              className={`absolute inset-0 transition-all ${
                group.status === "done"
                  ? "bg-green-400 w-full"
                  : groupIdx === groupedSteps.length - 1 && loading
                  ? "bg-blue-400 w-1/2 animate-pulse"
                  : "bg-slate-300 w-1/3"
              }`}
            />
          </div>

          {/* Step contents */}
          <div className="text-sm space-y-4 text-slate-700">
            {group.items.map((item, i) => {
              const models = item.data?.models || item.data?.selected;
              const tables = item.description.includes("Found tables:")
                ? parseTableInfo(item.description)
                : null;
              const listItems = parseListItems(item.description);

              return (
                <div key={i} className="space-y-3">
                  {/* Model chips */}
                  {models?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {models.map((model, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1 px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded-md"
                        >
                          <Table className="w-3 h-3 text-blue-500" />
                          {model}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Table breakdown */}
                  {tables?.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-slate-500">
                        Tables identified:
                      </div>
                      {tables.map((t, i) => (
                        <div
                          key={i}
                          className="pl-2 border-l-2 border-blue-300"
                        >
                          <div className="text-xs font-medium text-slate-800">
                            {t.name}
                          </div>
                          <div className="text-xs text-slate-600">
                            {t.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* List breakdown */}
                  {listItems?.length > 0 && (
                    <ul className="list-decimal list-inside text-xs text-slate-700 space-y-1">
                      {listItems.map((li, i) => (
                        <li key={i}>
                          <span className="font-medium">{li.title}</span>{" "}
                          <span className="text-slate-600">{li.content}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Fallback text */}
                  {!models?.length &&
                    !tables?.length &&
                    !listItems?.length &&
                    item.description && (
                      <div className="text-xs text-slate-600">
                        {item.description}
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Loading thought */}
      {loading && (
        <div className="col-span-full bg-white border border-slate-200 shadow-sm rounded-xl p-5 flex items-center gap-4 animate-pulse">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          <div>
            <div className="text-sm font-medium text-slate-800">
              Thinking through the next SQL step...
            </div>
            <div className="text-xs text-slate-600">
              Generating optimized query logic...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
