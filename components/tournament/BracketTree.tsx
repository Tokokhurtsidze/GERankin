"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BracketTree as BracketTreeData, TreeMatch } from "@/lib/bracket/tree";
import { BracketSlot, BRACKET_SLOT_SIZE } from "./BracketSlot";
import { MatchTimer } from "./MatchTimer";

/**
 * Connector-line / column-position geometry: pure math derived from
 * `tree` alone, not from measured DOM refs.
 *
 * A full ref-measurement pipeline (measure each BracketSlot box post-render
 * via refs + ResizeObserver, draw SVG lines between measured screen
 * coordinates) was considered, but this component computes everything
 * up front instead: bracket geometry is fully determined by (a) the fixed
 * `BRACKET_SLOT_SIZE` box size shared with BracketSlot, and (b) each
 * TreeMatch's round/slot indices, which are already known synchronously
 * from `tree`. Round-1 pairs are spaced evenly; every later round's pair is
 * centered exactly between the vertical centers of its two "child" pairs
 * from the round before (the standard recursive bracket-diagram layout) --
 * which automatically gives every column the same total height and doubles
 * the effective gap between pairs each round, satisfying the spacing-rhythm
 * requirement without ever inspecting the DOM. This sidesteps ref-timing /
 * hydration-mismatch risk and keeps the SVG and the boxes perfectly in sync
 * (both are positioned from the same numbers), at the cost of using
 * this component's own SLOT_GAP/BASE_GAP/COLUMN_GAP constants rather than
 * "real" browser layout -- acceptable since we render the boxes with the
 * exact same absolute pixel coordinates the math produces.
 */

const S = BRACKET_SLOT_SIZE; // 36 -- one competitor slot box, shared with BracketSlot
const SLOT_GAP = 4; // gap between the two stacked slots (A above B) of one pair
const BASE_GAP = 16; // gap between distinct pairs in round 1 (the widest-spaced round)
const COLUMN_GAP = 48; // horizontal space between columns, for the connector elbow
const HEADER_H = 28; // vertical space reserved above the content for column headers

const PAIR_HEIGHT = 2 * S + SLOT_GAP;
const COL_STEP = S + COLUMN_GAP;

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * centersByRound[c][i] = vertical center (in content-space px, relative to
 * the top of the pair area, i.e. before the HEADER_H offset is added) of
 * pair `i` in column `c`, where c=0 is round 1 (n0 pairs) and each
 * subsequent column has half as many pairs, each centered between its two
 * "parent" pairs from the previous column.
 */
function centersForRounds(n0: number, rounds: number): number[][] {
  if (rounds <= 0 || n0 <= 0) return [];
  const byRound: number[][] = [];
  let prev = Array.from({ length: n0 }, (_, i) => i * (PAIR_HEIGHT + BASE_GAP) + PAIR_HEIGHT / 2);
  byRound.push(prev);
  for (let c = 1; c < rounds; c++) {
    const n = Math.max(1, Math.floor(prev.length / 2));
    const cur = Array.from({ length: n }, (_, i) => {
      const a = prev[2 * i] ?? prev[prev.length - 1];
      const b = prev[2 * i + 1] ?? prev[prev.length - 1];
      return (a + b) / 2;
    });
    byRound.push(cur);
    prev = cur;
  }
  return byRound;
}

interface SlotGeom {
  x: number; // left edge, content-space px
  centerY: number;
  topY: number;
  isRight: boolean;
}

interface Connector {
  key: string;
  exitX: number;
  midX: number;
  entryX: number;
  ay: number;
  by: number;
  centerY: number;
  destY: number;
}

interface PairRender {
  match: TreeMatch;
  x: number;
  topY: number;
}

interface ColumnHeader {
  key: string;
  x: number;
  label: string;
}

function sideProps(match: TreeMatch, side: "A" | "B") {
  const startup = side === "A" ? match.startupA : match.startupB;
  const isCompleted = match.status === "completed" && !!match.winnerId;
  const isWinner = isCompleted && !!startup && match.winnerId === startup.id;
  const isLoser = isCompleted && !!startup && match.winnerId !== startup.id;
  const votes = side === "A" ? match.votesA : match.votesB;
  return { startup, isWinner, isLoser, votes };
}

export function BracketTree({
  tree,
  locale,
  tournamentId,
  dict,
  interactive = true,
}: {
  tree: BracketTreeData;
  locale: string;
  tournamentId: string;
  dict: { round: string; final: string };
  /** false = no pan/zoom viewport, no clipping — renders at natural size (homepage teaser). */
  interactive?: boolean;
}) {
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ px: number; py: number; tx: number; ty: number } | null>(null);
  const dragDistance = useRef(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  const layout = useMemo(() => {
    const L = tree.leftColumns.length;
    const n0 = tree.leftColumns[0]?.length ?? tree.rightColumns[0]?.length ?? 0;
    const centersByRound = centersForRounds(n0, L);

    const totalPairsHeight = n0 > 0 ? n0 * PAIR_HEIGHT + (n0 - 1) * BASE_GAP : PAIR_HEIGHT;
    const contentHeight = HEADER_H + totalPairsHeight;

    const xLeft = (c: number) => c * COL_STEP;
    const xFinal = L * COL_STEP;
    const xRight = (c: number) => xFinal + (L - c) * COL_STEP;
    const contentWidth = (L > 0 ? xRight(0) : xFinal) + S;

    const finalCenterYRaw = L > 0 ? avg(centersByRound[L - 1] ?? [totalPairsHeight / 2]) : totalPairsHeight / 2;

    const geomMap = new Map<string, SlotGeom>();
    const pairs: PairRender[] = [];
    const headers: ColumnHeader[] = [];

    for (let c = 0; c < L; c++) {
      const col = tree.leftColumns[c];
      const centers = centersByRound[c] ?? [];
      const x = xLeft(c);
      headers.push({ key: `hl-${c}`, x, label: `${dict.round} ${c + 1}` });
      col.forEach((match, i) => {
        const centerY = HEADER_H + (centers[i] ?? totalPairsHeight / 2);
        const topY = centerY - PAIR_HEIGHT / 2;
        geomMap.set(match.id, { x, centerY, topY, isRight: false });
        pairs.push({ match, x, topY });
      });
    }

    for (let c = 0; c < L; c++) {
      const col = tree.rightColumns[c];
      const centers = centersByRound[c] ?? [];
      const x = xRight(c);
      headers.push({ key: `hr-${c}`, x, label: `${dict.round} ${c + 1}` });
      col.forEach((match, i) => {
        const centerY = HEADER_H + (centers[i] ?? totalPairsHeight / 2);
        const topY = centerY - PAIR_HEIGHT / 2;
        geomMap.set(match.id, { x, centerY, topY, isRight: true });
        pairs.push({ match, x, topY });
      });
    }

    if (tree.final) {
      const centerY = HEADER_H + finalCenterYRaw;
      const topY = centerY - PAIR_HEIGHT / 2;
      const x = xFinal;
      geomMap.set(tree.final.id, { x, centerY, topY, isRight: false });
      pairs.push({ match: tree.final, x, topY });
      headers.push({ key: "hf", x, label: dict.final });
    }

    // id -> TreeMatch lookup across the whole tree, for nextMatchId resolution.
    const matchMap = new Map<string, TreeMatch>();
    tree.leftColumns.forEach((col) => col.forEach((m) => matchMap.set(m.id, m)));
    tree.rightColumns.forEach((col) => col.forEach((m) => matchMap.set(m.id, m)));
    if (tree.final) matchMap.set(tree.final.id, tree.final);

    const connectors: Connector[] = [];
    const sourceMatches = [...tree.leftColumns.flat(), ...tree.rightColumns.flat()];
    for (const match of sourceMatches) {
      if (!match.nextMatchId) continue;
      const dest = matchMap.get(match.nextMatchId);
      const srcGeom = geomMap.get(match.id);
      if (!dest || !srcGeom) continue;
      const destGeom = geomMap.get(dest.id);
      if (!destGeom) continue;

      const destSide: "A" | "B" = match.slot % 2 === 0 ? "A" : "B";
      const ay = srcGeom.topY + S / 2;
      const by = srcGeom.topY + S + SLOT_GAP + S / 2;
      const destY = destSide === "A" ? destGeom.topY + S / 2 : destGeom.topY + S + SLOT_GAP + S / 2;

      const isRight = srcGeom.isRight;
      const exitX = isRight ? srcGeom.x : srcGeom.x + S;
      const midX = isRight ? exitX - COLUMN_GAP / 2 : exitX + COLUMN_GAP / 2;
      const entryX = isRight ? destGeom.x + S : destGeom.x;

      connectors.push({ key: match.id, exitX, midX, entryX, ay, by, centerY: srcGeom.centerY, destY });
    }

    return { contentWidth, contentHeight, pairs, headers, connectors };
  }, [tree, dict]);

  function clampPan(x: number, y: number, scale: number) {
    const viewport = viewportRef.current;
    if (!viewport) return { x, y };
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const cw = layout.contentWidth * scale;
    const ch = layout.contentHeight * scale;
    const margin = 120; // keep at least this much content on-screen at all times
    const minX = Math.min(vw - cw - margin, vw / 2 - cw);
    const maxX = Math.max(margin, vw / 2);
    const minY = Math.min(vh - ch - margin, vh / 2 - ch);
    const maxY = Math.max(margin, vh / 2);
    return { x: clamp(x, minX, maxX), y: clamp(y, minY, maxY) };
  }

  // clampPan closes over `layout`, which is recomputed whenever `tree` changes
  // (new round seeded, revalidation, etc). The wheel listener below is only
  // registered once, so it reads clampPan through this ref instead of
  // capturing one render's version directly — otherwise a stale `layout`
  // (old contentWidth/contentHeight) would keep clamping pan/zoom forever.
  const clampPanRef = useRef(clampPan);
  useEffect(() => {
    clampPanRef.current = clampPan;
  });

  // Native (non-passive) wheel listener: React's onWheel is registered passive
  // in React 19, so e.preventDefault() there is silently ignored and the page
  // scrolls underneath the zoom. Cursor-anchored so zooming doesn't fling the
  // content toward a corner. Only intercepts the wheel with Ctrl/Cmd held
  // (the standard Figma/Maps convention) so a plain scroll still scrolls the
  // page — the tree's a big box, and commandeering every wheel tick over it
  // would make the rest of the page unreachable by scroll.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    function handleWheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rect = viewport!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setTransform((t) => {
        const nextScale = clamp(t.scale * (1 - e.deltaY * 0.001), MIN_SCALE, MAX_SCALE);
        const contentX = (mouseX - t.x) / t.scale;
        const contentY = (mouseY - t.y) / t.scale;
        const rawX = mouseX - contentX * nextScale;
        const rawY = mouseY - contentY * nextScale;
        return { scale: nextScale, ...clampPanRef.current(rawX, rawY, nextScale) };
      });
    }

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, []);

  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault(); // stop native image/link drag-ghost from hijacking the gesture
    dragDistance.current = 0;
    setDragging(true);
    dragStart.current = { px: e.clientX, py: e.clientY, tx: transform.x, ty: transform.y };
  }

  function onMouseMove(e: React.MouseEvent) {
    const start = dragStart.current;
    if (!dragging || !start) return;
    const dx = e.clientX - start.px;
    const dy = e.clientY - start.py;
    dragDistance.current = Math.max(dragDistance.current, Math.hypot(dx, dy));
    setTransform((t) => ({ ...t, ...clampPan(start.tx + dx, start.ty + dy, t.scale) }));
  }

  function endDrag() {
    setDragging(false);
    dragStart.current = null;
  }

  // A drag that moved the pointer more than a few px shouldn't also fire the
  // slot Link's click/navigation once the button is released.
  function onClickCapture(e: React.MouseEvent) {
    if (dragDistance.current > 4) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function resetView() {
    setTransform({ scale: 1, x: 0, y: 0 });
  }

  const content = (
    <div
      style={{
        position: "relative",
        width: layout.contentWidth,
        height: layout.contentHeight,
        transform: interactive ? `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` : undefined,
        transformOrigin: "0 0",
      }}
    >
      {layout.headers.map((h) => (
        <div
          key={h.key}
          className="font-mono-score absolute top-0 whitespace-nowrap text-[10px] uppercase tracking-wide text-text-muted"
          style={{ left: h.x + S / 2, transform: "translateX(-50%)" }}
        >
          {h.label}
        </div>
      ))}

      <svg
        width={layout.contentWidth}
        height={layout.contentHeight}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {layout.connectors.map((c) => (
          <g key={c.key}>
            <line x1={c.exitX} y1={c.ay} x2={c.midX} y2={c.ay} stroke="var(--border)" strokeWidth={1} />
            <line x1={c.exitX} y1={c.by} x2={c.midX} y2={c.by} stroke="var(--border)" strokeWidth={1} />
            <line x1={c.midX} y1={c.ay} x2={c.midX} y2={c.by} stroke="var(--border)" strokeWidth={1} />
            <line x1={c.midX} y1={c.centerY} x2={c.midX} y2={c.destY} stroke="var(--border)" strokeWidth={1} />
            <line x1={c.midX} y1={c.destY} x2={c.entryX} y2={c.destY} stroke="var(--border)" strokeWidth={1} />
          </g>
        ))}
      </svg>

      {layout.pairs.map(({ match, x, topY }) => {
        const a = sideProps(match, "A");
        const b = sideProps(match, "B");
        const isLiveMatch = match.status === "live" || match.status === "overtime";
        return (
          <div key={match.id}>
            {interactive && isLiveMatch && (
              <div style={{ position: "absolute", left: x, top: topY - 14, zIndex: 1 }}>
                <MatchTimer status={match.status} endsAt={match.endsAt} overtimeEndsAt={match.overtimeEndsAt} />
              </div>
            )}
            <div style={{ position: "absolute", left: x, top: topY }}>
              <BracketSlot
                startup={a.startup}
                matchId={match.id}
                locale={locale}
                tournamentId={tournamentId}
                status={match.status}
                isWinner={a.isWinner}
                isLoser={a.isLoser}
                votes={a.votes}
              />
            </div>
            <div style={{ position: "absolute", left: x, top: topY + S + SLOT_GAP }}>
              <BracketSlot
                startup={b.startup}
                matchId={match.id}
                locale={locale}
                tournamentId={tournamentId}
                status={match.status}
                isWinner={b.isWinner}
                isLoser={b.isLoser}
                votes={b.votes}
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  if (!interactive) {
    // No pan/zoom viewport, no clipping — renders at its true natural size;
    // the caller (ScaleToFitBracket, on the homepage) scales it to fit.
    return content;
  }

  return (
    <div className="hidden h-full min-h-0 flex-col lg:flex">
      <div className="mb-2 flex shrink-0 items-center justify-between">
        <p className="text-xs text-text-muted">Scroll to zoom (Ctrl/⌘+scroll) · drag to pan</p>
        <button
          onClick={resetView}
          className="ink-border rounded-md bg-surface px-2.5 py-1 text-xs font-semibold text-text-muted hover:text-text"
        >
          Reset view
        </button>
      </div>
      <div
        ref={viewportRef}
        className={[
          "relative min-h-0 w-full flex-1 overflow-hidden rounded-lg bg-bg ink-border",
          dragging ? "cursor-grabbing select-none" : "cursor-grab",
        ].join(" ")}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onClickCapture={onClickCapture}
      >
        {content}
      </div>
    </div>
  );
}
