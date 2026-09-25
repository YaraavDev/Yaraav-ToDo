import React from "react";

interface HeatmapProps {
  logs: { date: string; done: number }[];
  weeks?: number;
  color?: string;
}

export const Heatmap: React.FC<HeatmapProps> = ({ logs, weeks = 20, color = "#FFFFFF" }) => {
  const doneSet = new Set(logs.filter((l) => l.done).map((l) => l.date));
  const days: string[] = [];
  const start = new Date();
  start.setDate(start.getDate() - weeks * 7);
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }
  const columns: string[][] = [];
  for (let i = 0; i < days.length; i += 7) columns.push(days.slice(i, i + 7));

  return (
    <div className="flex gap-1 overflow-x-auto py-1">
      {columns.map((col, ci) => (
        <div key={ci} className="flex flex-col gap-1">
          {col.map((date) => (
            <div
              key={date}
              title={date}
              className="w-3 h-3 rounded-sm"
              style={{
                backgroundColor: doneSet.has(date) ? color : "rgba(120,120,120,0.15)",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
