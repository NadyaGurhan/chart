import { useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Area,
  ReferenceLine,
} from "recharts";
import html2canvas from "html2canvas";
import styles from "../Chart.module.css";

type ChartDataPoint = {
  date: string;
  fullDate?: string;
  [key: string]: string | number | null | undefined;
};

type Variation = { id: string; name: string };

type StyleMode = "line" | "smooth" | "area";

type ChartProps = {
  data: ChartDataPoint[];
  variations: Variation[];
  visible: Record<string, boolean>;
  styleMode: StyleMode;
};

export default function Chart({ data, variations, visible, styleMode }: ChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);

  const exportPNG = async () => {
    if (!containerRef.current) return;
    const canvas = await html2canvas(containerRef.current, {
      useCORS: true,
      backgroundColor: "#f5f5f7",
    });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "chart.png";
    a.click();
  };

  const colorPalette = ["#0066ff", "#ff6600", "#00ccff", "#00cc00", "#ff0000", "#9900ff"];
  const ChartComponent = styleMode === "area" ? ComposedChart : LineChart;

  const yDomain = useMemo(() => {
    if (!data.length || !variations.length) return [0, 100] as [number, number];
    
    const values: number[] = [];
    data.forEach((r) => {
      variations.forEach(({ id }) => {
        if (visible[id] && typeof r[id] === "number") {
          values.push(r[id] as number);
        }
      });
    });
    
    if (!values.length) return [0, 100] as [number, number];
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = min === max ? 1 : (max - min) * 0.1;
    
    return [Math.max(0, min - pad), max + pad] as [number, number];
  }, [data, variations, visible]);

  const tooltipStyle = {
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 40px rgba(15, 23, 42, 0.18)",
    backgroundColor: "#ffffff",
  };

  return (
    <>
      <div className={styles.topRow}>
        <button type="button" onClick={exportPNG} className={styles.exportButton}>
          Export PNG
        </button>
      </div>
      <div ref={containerRef} className={styles.chartBox}>
        <ResponsiveContainer width="100%" height={420}>
          <ChartComponent
            data={data}
            margin={{ top: 60 }}
            onMouseMove={(s: unknown) =>
              setActiveIndex((s as { activeTooltipIndex?: number })?.activeTooltipIndex ?? null)
            }
            onMouseLeave={() => setActiveIndex(null)}
          >
            <CartesianGrid stroke="#d4d4e0" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
            <YAxis
              domain={yDomain}
              tickFormatter={(v: number) => `${Math.round(v)}%`}
              tickLine={false}
              axisLine={false}
              width={50}
              tick={{ fill: "#6b7280", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(_, p) => p?.[0]?.payload?.fullDate ?? _}
              formatter={(v) => (typeof v === "number" ? `${v.toFixed(2)}%` : "—")}
              cursor={{ stroke: "#0066ff", strokeWidth: 1, strokeDasharray: "3 3" }}
            />
            {activeIndex !== null && data[activeIndex] && (
              <ReferenceLine x={data[activeIndex].date} stroke="#0066ff" strokeWidth={1} strokeDasharray="3 3" />
            )}
            <Legend verticalAlign="top" align="right" iconType="plainline" wrapperStyle={{ paddingBottom: 12, paddingTop: 8 }} />
            {variations.map((v, index) => {
              if (!visible[v.id]) return null;
              const color = colorPalette[index % colorPalette.length];
              const isActive = activeLineId === v.id;
              const opacity = isActive ? 1 : activeLineId ? 0.3 : 0.9;

              if (styleMode === "area") {
                return (
                  <Area
                    key={v.id}
                    type="monotone"
                    dataKey={v.id}
                    name={v.name}
                    stroke={color}
                    strokeWidth={isActive ? 3 : 2}
                    strokeOpacity={opacity}
                    fill={color}
                    fillOpacity={isActive ? 0.5 : 0.3}
                    dot={false}
                    isAnimationActive={false}
                    onMouseEnter={() => setActiveLineId(v.id)}
                    onMouseLeave={() => setActiveLineId(null)}
                  />
                );
              }

              return (
                <Line
                  key={v.id}
                  type={styleMode === "smooth" ? "monotone" : "linear"}
                  dataKey={v.id}
                  name={v.name}
                  stroke={color}
                  dot={false}
                  strokeWidth={isActive ? 3 : 2}
                  strokeOpacity={opacity}
                  isAnimationActive={false}
                  connectNulls={false}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  onMouseEnter={() => setActiveLineId(v.id)}
                  onMouseLeave={() => setActiveLineId(null)}
                />
              );
            })}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </>
  );
}
