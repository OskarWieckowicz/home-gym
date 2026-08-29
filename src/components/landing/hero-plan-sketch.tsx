type Rect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

type PlanItem = {
  readonly label: string;
  readonly footprint: Rect;
  readonly useZone: Rect;
  readonly tight: boolean;
};

const PLAN_ITEMS: readonly PlanItem[] = [
  {
    label: "Power rack",
    footprint: { x: 78, y: 78, width: 70, height: 44 },
    useZone: { x: 64, y: 64, width: 98, height: 72 },
    tight: false,
  },
  {
    label: "Treadmill",
    footprint: { x: 250, y: 78, width: 62, height: 36 },
    useZone: { x: 238, y: 66, width: 86, height: 60 },
    tight: false,
  },
  {
    label: "Bench",
    footprint: { x: 176, y: 168, width: 34, height: 68 },
    useZone: { x: 158, y: 154, width: 70, height: 96 },
    tight: true,
  },
];

const GRID_STEP = 20;
const ROOM = { x: 56, y: 56, width: 300, height: 210 } as const;

const LEGEND = [
  { label: "Physical outline", swatch: "bg-footprint" },
  {
    label: "Use zone",
    swatch: "border border-dashed border-use-zone bg-use-zone-soft",
  },
  {
    label: "Needs more space",
    swatch: "border border-dashed border-caution bg-caution-soft",
  },
] as const;

function gridLines() {
  const vertical = [];
  const horizontal = [];

  for (let x = ROOM.x + GRID_STEP; x < ROOM.x + ROOM.width; x += GRID_STEP) {
    vertical.push(x);
  }

  for (let y = ROOM.y + GRID_STEP; y < ROOM.y + ROOM.height; y += GRID_STEP) {
    horizontal.push(y);
  }

  return { vertical, horizontal };
}

export function HeroPlanSketch() {
  const { vertical, horizontal } = gridLines();

  return (
    <figure>
      <svg
        viewBox="0 0 400 300"
        role="img"
        aria-label="Top-down floor plan showing equipment outlines and the use zone each one needs"
        className="w-full rounded-xl bg-surface-muted"
      >
        <rect {...ROOM} fill="var(--surface)" rx="2" />

        <g stroke="var(--line)" strokeWidth="1">
          {vertical.map((x) => (
            <line
              key={`v${x}`}
              x1={x}
              y1={ROOM.y}
              x2={x}
              y2={ROOM.y + ROOM.height}
            />
          ))}
          {horizontal.map((y) => (
            <line
              key={`h${y}`}
              x1={ROOM.x}
              y1={y}
              x2={ROOM.x + ROOM.width}
              y2={ROOM.y + ROOM.height}
            />
          ))}
        </g>

        <rect
          {...ROOM}
          fill="none"
          stroke="var(--footprint)"
          strokeWidth="5"
          rx="2"
        />

        {PLAN_ITEMS.map((item) => (
          <g key={item.label}>
            <rect
              {...item.useZone}
              rx="6"
              fill={item.tight ? "var(--caution-soft)" : "var(--use-zone-soft)"}
              stroke={item.tight ? "var(--caution)" : "var(--use-zone)"}
              strokeWidth="1.5"
              strokeDasharray="5 4"
            />
            <rect {...item.footprint} rx="2" fill="var(--footprint)" />
          </g>
        ))}

        <g
          stroke="var(--ink-muted)"
          strokeWidth="1"
          fill="var(--ink-muted)"
          fontSize="11"
        >
          <line x1={ROOM.x} y1="38" x2={ROOM.x + ROOM.width} y2="38" />
          <text
            x={ROOM.x + ROOM.width / 2}
            y="30"
            textAnchor="middle"
            stroke="none"
          >
            5.80 m
          </text>
          <line x1="38" y1={ROOM.y} x2="38" y2={ROOM.y + ROOM.height} />
          <text
            x="26"
            y={ROOM.y + ROOM.height / 2}
            textAnchor="middle"
            stroke="none"
            transform={`rotate(-90 26 ${ROOM.y + ROOM.height / 2})`}
          >
            4.20 m
          </text>
        </g>
      </svg>
      <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-muted">
        {LEGEND.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`size-2.5 rounded-sm ${item.swatch}`}
            />
            {item.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
