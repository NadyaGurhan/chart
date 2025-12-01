import { useEffect, useMemo, useState } from "react";
import Chart from "./components/Chart";
import Controls from "./components/Controls";
import styles from "./App.module.css";

type VariationWithOptionalId = { id?: number; name: string };
type RawRow = { date: string; visits: Record<string, number>; conversions: Record<string, number> };
type RawData = { variations: VariationWithOptionalId[]; data: RawRow[] };
type ProcessedRow = {
  date: string;
  fullDate?: string;
  [key: string]: string | number | null | undefined;
};
type Granularity = "day" | "week";
type StyleMode = "line" | "smooth" | "area";

const parseId = (v: VariationWithOptionalId, i: number) => String(v.id ?? (i === 0 ? 0 : i));

export default function App() {
  const [raw, setRaw] = useState<RawData | null>(null);
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [style, setStyle] = useState<StyleMode>("line");
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/data.json")
      .then((r) => r.json())
      .then((json: RawData) => {
        setRaw(json);
        setVisible(
          Object.fromEntries(json.variations.map((v, i) => [parseId(v, i), true]))
        );
      });
  }, []);

  const { variations, processed } = useMemo(() => {
    if (!raw) return { variations: [], processed: [] };

    const vars = raw.variations.map((v, i) => ({ id: parseId(v, i), name: v.name }));
    const calcValues = (visits: Record<string, number>, conversions: Record<string, number>) => {
      const values: Record<string, number | null> = {};
      vars.forEach(({ id }) => {
        const v = visits[id] ?? 0;
        const c = conversions[id] ?? 0;
        values[id] = v > 0 ? (c / v) * 100 : null;
      });
      return values;
    };

    if (granularity === "day") {
      return {
        variations: vars,
        processed: raw.data.map((r) => {
          const day = new Date(r.date + "T00:00:00").getDate();
          return {
            date: String(day),
            fullDate: `${String(day).padStart(2, "0")}.01`,
            ...calcValues(r.visits, r.conversions),
          };
        }),
      };
    }

    const weekMap: Record<number, { visits: Record<string, number>; conversions: Record<string, number> }> = {};
    raw.data.forEach((r) => {
      const week = Math.ceil(new Date(r.date + "T00:00:00").getDate() / 7);
      if (!weekMap[week]) weekMap[week] = { visits: {}, conversions: {} };
      Object.keys(r.visits).forEach((id) => {
        weekMap[week].visits[id] = (weekMap[week].visits[id] ?? 0) + (r.visits[id] ?? 0);
        weekMap[week].conversions[id] = (weekMap[week].conversions[id] ?? 0) + (r.conversions[id] ?? 0);
      });
    });

    return {
      variations: vars,
      processed: Object.entries(weekMap)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map<ProcessedRow>(([w, data]) => ({
          date: `Неделя ${w}`,
          ...calcValues(data.visits, data.conversions),
        })),
    };
  }, [raw, granularity]);

  const toggleVisible = (id: string) => {
    const activeCount = Object.values(visible).filter(Boolean).length;
    if (visible[id] && activeCount === 1) return;
    setVisible((s) => ({ ...s, [id]: !s[id] }));
  };

  return (
    <div className={styles.app}>
      <h1 className={styles.title}>Test Kameleoon
      — Interactive Line Chart</h1>
      <Controls
        variations={variations}
        visible={visible}
        toggleVisible={toggleVisible}
        granularity={granularity}
        setGranularity={setGranularity}
        style={style}
        setStyle={setStyle}
      />
      <div className={styles.chartWrap}>
        <Chart data={processed} variations={variations} visible={visible} styleMode={style} />
      </div>
    </div>
  );
}
