import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { BarChart3, LineChart as LineChartIcon } from "lucide-react";

export default function DynamicChart({ chartable }) {
  const [chartType, setChartType] = useState("bar"); // 'bar' | 'line'

  const { data, metricKeys } = chartable;

  const colors = useMemo(() => ["#0891b2", "#10b981", "#8b5cf6"], []);

  return (
    <div className="my-3 p-4 rounded-xl border border-border-main bg-bg-card shadow-xs animate-in fade-in duration-200">
      {/* Chart Toolbar */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-border-main text-xs">
        <span className="font-semibold text-text-primary">
          Visualization: {metricKeys.join(" & ")}
        </span>
        <div className="flex items-center gap-1 bg-bg-secondary p-0.5 rounded-lg border border-border-main">
          <button
            type="button"
            onClick={() => setChartType("bar")}
            className={`p-1.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
              chartType === "bar"
                ? "bg-bg-card text-text-primary shadow-2xs font-semibold"
                : "text-text-secondary hover:text-text-primary"
            }`}
            title="Bar Chart view"
            aria-label="Switch to bar chart"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Bar</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType("line")}
            className={`p-1.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
              chartType === "line"
                ? "bg-bg-card text-text-primary shadow-2xs font-semibold"
                : "text-text-secondary hover:text-text-primary"
            }`}
            title="Line Chart view"
            aria-label="Switch to line chart"
          >
            <LineChartIcon className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Line</span>
          </button>
        </div>
      </div>

      {/* Recharts Canvas */}
      <div className="h-56 sm:h-64 w-full" aria-label={`Chart for ${metricKeys.join(", ")}`}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
              <XAxis
                dataKey="name"
                stroke="var(--text-secondary)"
                fontSize={11}
                tickLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={35}
              />
              <YAxis
                stroke="var(--text-secondary)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border)",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  color: "var(--text-primary)",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              {metricKeys.map((key, idx) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[idx % colors.length]}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
              ))}
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
              <XAxis
                dataKey="name"
                stroke="var(--text-secondary)"
                fontSize={11}
                tickLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={35}
              />
              <YAxis
                stroke="var(--text-secondary)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border)",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  color: "var(--text-primary)",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              {metricKeys.map((key, idx) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[idx % colors.length]}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
