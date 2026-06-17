"use client";

import { useState, useEffect } from "react";
import { RETRO_CRITERIA } from "@/lib/retrospective/types";

// ── Dimensions ────────────────────────────────────────────────────────────────
const SIZE    = 480;
const CX      = SIZE / 2;
const CY      = SIZE / 2;
const MAX_R   = 118;
const LABEL_R = 168;
const LEVELS  = 5;
const N       = RETRO_CRITERIA.length;

// ── Dark mode hook ─────────────────────────────────────────────────────────────
function useDarkMode(): boolean {
  const [dark, setDark] = useState<boolean>(false);

  useEffect(() => {
    const root = document.documentElement;
    // Init from current state
    setDark(root.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setDark(root.classList.contains("dark"));
    });

    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return dark;
}

// ── Color palette ─────────────────────────────────────────────────────────────
function getColors(dark: boolean) {
  return {
    bandEven:        dark ? "rgba(6,78,59,0.25)" : "#ecfdf5",
    bandOdd:         dark ? "transparent"        : "#ffffff",
    ringInner:       dark ? "#374151"             : "#a7f3d0",
    ringOuter:       dark ? "#6b7280"             : "#34d399",
    ringOuterWidth:  1.5,
    axis:            dark ? "#1f2937"             : "#e5e7eb",
    dataFill:        dark ? "rgba(74,222,128,0.15)" : "rgba(134,239,172,0.35)",
    dataStroke:      dark ? "#22c55e"             : "#16a34a",
    dataStrokeWidth: 2.5,
    labelFill:       dark ? "#f9fafb"             : "#111827",
  };
}

// ── Score dot colors — mirrors scoreColor() / scoreBgClass() in types.ts ──────
function dotColors(score: number): { bg: string; text: string } {
  if (score >= 4.5) return { bg: "#22c55e", text: "#ffffff" }; // green-500
  if (score >= 3.5) return { bg: "#84cc16", text: "#1f2937" }; // lime-500  — dark text for contrast
  if (score >= 2.5) return { bg: "#eab308", text: "#1f2937" }; // yellow-500 — dark text for contrast
  if (score >= 1.5) return { bg: "#f97316", text: "#ffffff" }; // orange-500
  return            { bg: "#ef4444", text: "#ffffff" };         // red-500
}

// ── Geometry helpers ──────────────────────────────────────────────────────────
const toRad = (deg: number) => (deg * Math.PI) / 180;
const axisAngle = (i: number) => -90 + (i * 360) / N;

function pt(deg: number, r: number): [number, number] {
  return [CX + r * Math.cos(toRad(deg)), CY + r * Math.sin(toRad(deg))];
}

function polyPts(r: number) {
  return RETRO_CRITERIA.map((_, i) => pt(axisAngle(i), r).join(",")).join(" ");
}

type TextAnchor  = "middle" | "start" | "end";
type DomBaseline = "auto" | "hanging" | "middle";

function anchor(deg: number): TextAnchor {
  const a = ((deg % 360) + 360) % 360;
  if (a > 345 || a < 15) return "middle";
  if (a < 165)           return "start";
  if (a < 195)           return "middle";
  return "end";
}

function baseline(deg: number): DomBaseline {
  const a = ((deg % 360) + 360) % 360;
  if (a > 345 || a < 15)   return "auto";
  if (a >= 165 && a < 195) return "hanging";
  return "middle";
}

function labelLines(label: string): string[] {
  if (label === "Support & Resources") return ["Support &", "Resources"];
  if (label === "Goal Alignment")      return ["Goal", "Alignment"];
  return [label];
}

// ── Component ─────────────────────────────────────────────────────────────────
export function RetroRadarChart({ scores }: { scores: Record<string, number> }) {
  const dark = useDarkMode();
  const c = getColors(dark);

  const dataPts = RETRO_CRITERIA
    .map((cr, i) => pt(axisAngle(i), ((scores[cr.id] ?? 0) / 5) * MAX_R).join(","))
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="w-full max-w-md mx-auto"
      overflow="visible"
      aria-label="Health Radar"
    >
      {/* 1. Bands outer→inner */}
      {Array.from({ length: LEVELS }).map((_, idx) => {
        const l = LEVELS - 1 - idx; // 4 → 3 → 2 → 1 → 0
        const r = ((l + 1) / LEVELS) * MAX_R;
        return (
          <polygon
            key={`band-${l}`}
            points={polyPts(r)}
            fill={l % 2 === 0 ? c.bandEven : c.bandOdd}
          />
        );
      })}

      {/* 2. Ring strokes */}
      {Array.from({ length: LEVELS }).map((_, l) => {
        const r = ((l + 1) / LEVELS) * MAX_R;
        const outer = l === LEVELS - 1;
        return (
          <polygon
            key={`ring-${l}`}
            points={polyPts(r)}
            fill="none"
            stroke={outer ? c.ringOuter : c.ringInner}
            strokeWidth={outer ? c.ringOuterWidth : 1}
          />
        );
      })}

      {/* 3. Axis lines */}
      {RETRO_CRITERIA.map((_, i) => {
        const [x2, y2] = pt(axisAngle(i), MAX_R);
        return (
          <line
            key={`axis-${i}`}
            x1={CX} y1={CY}
            x2={x2} y2={y2}
            stroke={c.axis}
            strokeWidth={1}
          />
        );
      })}

      {/* 4. Data polygon */}
      <polygon
        points={dataPts}
        fill={c.dataFill}
        stroke={c.dataStroke}
        strokeWidth={c.dataStrokeWidth}
        strokeLinejoin="round"
      />

      {/* 5. Score dots */}
      {RETRO_CRITERIA.map((cr, i) => {
        const s = scores[cr.id] ?? 0;
        if (!s) return null;
        const [x, y] = pt(axisAngle(i), (s / 5) * MAX_R);
        const dc = dotColors(s);
        return (
          <g key={`dot-${i}`}>
            <circle
              cx={x} cy={y} r={12}
              fill={dc.bg}
            />
            <text
              x={x} y={y}
              textAnchor="middle"
              dominantBaseline={"middle" as DomBaseline}
              fontSize={10}
              fontWeight={800}
              fill={dc.text}
            >
              {s % 1 === 0 ? s.toFixed(0) : s.toFixed(1)}
            </text>
          </g>
        );
      })}

      {/* 6. Criterion labels */}
      {RETRO_CRITERIA.map((cr, i) => {
        const a        = axisAngle(i);
        const [lx, ly] = pt(a, LABEL_R);
        const an       = anchor(a);
        const bl       = baseline(a);
        const lines    = labelLines(cr.label);

        if (lines.length === 1) {
          return (
            <text
              key={`crit-${i}`}
              x={lx} y={ly}
              textAnchor={an}
              dominantBaseline={bl as DomBaseline}
              fontSize={12}
              fontWeight={600}
              fill={c.labelFill}
            >
              {lines[0]}
            </text>
          );
        }

        const lh  = 14;
        const dy0 = bl === "middle" ? -lh / 2 : 0;
        return (
          <text
            key={`crit-${i}`}
            x={lx} y={ly}
            textAnchor={an}
            fontSize={11}
            fontWeight={600}
            fill={c.labelFill}
          >
            <tspan x={lx} dy={dy0}>{lines[0]}</tspan>
            <tspan x={lx} dy={lh}>{lines[1]}</tspan>
          </text>
        );
      })}
    </svg>
  );
}
