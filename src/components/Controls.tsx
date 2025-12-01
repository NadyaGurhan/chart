import styles from "../Control_bar.module.css";

type Variation = { id: string; name: string };
type Granularity = "day" | "week";
type StyleMode = "line" | "smooth" | "area";

type ControlsProps = {
  variations: Variation[];
  visible: Record<string, boolean>;
  toggleVisible: (id: string) => void;
  granularity: Granularity;
  setGranularity: (g: Granularity) => void;
  style: StyleMode;
  setStyle: (s: StyleMode) => void;
};

export default function Controls({
  variations,
  visible,
  toggleVisible,
  granularity,
  setGranularity,
  style,
  setStyle,
}: ControlsProps) {
  return (
    <div className={styles.controls}>
      <div className={styles.right}>
        {variations.map((variation) => (
          <label key={variation.id} className={styles.varLabel}>
            <input type="checkbox" checked={!!visible[variation.id]} onChange={() => toggleVisible(variation.id)} />
            <span>{variation.name}</span>
          </label>
        ))}
      </div>

      <div className={styles.left}>
        <div>
          <label>Granularity: </label>
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as Granularity)}
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
          </select>
        </div>

        <div>
          <label>Style: </label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value as StyleMode)}
          >
            <option value="line">Line</option>
            <option value="smooth">Smooth</option>
            <option value="area">Area</option>
          </select>
        </div>
      </div>
    </div>
  );
}
