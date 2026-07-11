"use client";

import type { ChartProps } from "@gloomy/a2ui-spec";

const CHART_WIDTH = 480;
const CHART_HEIGHT = 240;
const CHART_PADDING = 32;
const SERIES_COLORS = ["#168a41", "#ee7226", "#7a63f0", "#3d8bc2"];

export function Chart({ title, kind, xLabel, yLabel, series }: ChartProps) {
  const categories = series[0]?.points.map((p) => String(p.x)) ?? [];
  const allValues = series.flatMap((s) => s.points.map((p) => p.y));
  const maxY = Math.max(0, ...allValues);
  const minY = Math.min(0, ...allValues);
  const range = maxY - minY || 1;

  const innerWidth = CHART_WIDTH - CHART_PADDING * 2;
  const innerHeight = CHART_HEIGHT - CHART_PADDING * 2;

  const xForIndex = (i: number) =>
    categories.length > 1
      ? CHART_PADDING + (i / (categories.length - 1)) * innerWidth
      : CHART_PADDING + innerWidth / 2;

  const yForValue = (value: number) =>
    CHART_PADDING + innerHeight - ((value - minY) / range) * innerHeight;

  const barGroupWidth = innerWidth / Math.max(1, categories.length);
  const barWidth = barGroupWidth / Math.max(1, series.length) - 6;

  return (
    <div className="a2ui-card">
      <h3 className="a2ui-title">{title}</h3>
      <div className="a2ui-diagram-scroll">
        <svg width={CHART_WIDTH} height={CHART_HEIGHT} role="img" aria-label={title}>
          <line
            className="ch-axis"
            x1={CHART_PADDING}
            y1={CHART_PADDING}
            x2={CHART_PADDING}
            y2={CHART_HEIGHT - CHART_PADDING}
            stroke="#31313e"
          />
          <line
            className="ch-axis"
            x1={CHART_PADDING}
            y1={CHART_HEIGHT - CHART_PADDING}
            x2={CHART_WIDTH - CHART_PADDING}
            y2={CHART_HEIGHT - CHART_PADDING}
            stroke="#31313e"
          />

          {kind === "line" &&
            series.map((s, si) => (
              <polyline
                key={s.name}
                fill="none"
                stroke={SERIES_COLORS[si % SERIES_COLORS.length]}
                strokeWidth={2}
                points={s.points
                  .map((p, i) => `${xForIndex(i)},${yForValue(p.y)}`)
                  .join(" ")}
              />
            ))}

          {kind === "bar" &&
            series.map((s, si) =>
              s.points.map((p, i) => {
                const x =
                  CHART_PADDING +
                  i * barGroupWidth +
                  si * (barWidth + 6) +
                  3;
                const y = yForValue(Math.max(0, p.y));
                const zeroY = yForValue(0);
                const barHeight = Math.abs(zeroY - yForValue(p.y));
                return (
                  <rect
                    key={`${s.name}-${i}`}
                    x={x}
                    y={p.y >= 0 ? y : zeroY}
                    width={Math.max(1, barWidth)}
                    height={Math.max(1, barHeight)}
                    fill={SERIES_COLORS[si % SERIES_COLORS.length]}
                  />
                );
              }),
            )}

          {categories.map((cat, i) => (
            <text
              className="ch-cat"
              key={cat}
              x={xForIndex(i)}
              y={CHART_HEIGHT - CHART_PADDING + 16}
              fill="#70707e"
              fontSize={11}
              textAnchor="middle"
            >
              {cat}
            </text>
          ))}
        </svg>
      </div>
      <div className="a2ui-chart-legend">
        <span className="a2ui-chart-axis-label">
          {xLabel} / {yLabel}
        </span>
        {series.map((s, si) => (
          <span key={s.name} className="a2ui-chart-legend-item">
            <i style={{ background: SERIES_COLORS[si % SERIES_COLORS.length] }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
