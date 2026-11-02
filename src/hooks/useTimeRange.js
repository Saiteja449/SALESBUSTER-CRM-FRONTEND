import { useState, useCallback } from "react";

const STORAGE_KEY = "sb_bi_time_range";

export const TIME_RANGE_OPTIONS = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "month", label: "This month" },
  { id: "custom", label: "Custom range" },
];

export function useTimeRange() {
  const [rangeState, setRangeState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) return parsed;
      }
    } catch {
      // Ignore storage errors
    }
    return { id: "month", startDate: "", endDate: "" };
  });

  const setTimeRange = useCallback((newRange) => {
    setRangeState((prev) => {
      const next = typeof newRange === "function" ? newRange(prev) : newRange;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage write failure
      }
      return next;
    });
  }, []);

  const getRangeLabel = useCallback(() => {
    if (rangeState.id === "today") return "Today";
    if (rangeState.id === "7d") return "Last 7 days";
    if (rangeState.id === "month") return "This month";
    if (rangeState.id === "custom" && (rangeState.startDate || rangeState.endDate)) {
      if (rangeState.startDate && rangeState.endDate) {
        return `${rangeState.startDate} to ${rangeState.endDate}`;
      }
      return rangeState.startDate || rangeState.endDate;
    }
    return "This month";
  }, [rangeState]);

  const injectRangeIntoPrompt = useCallback(
    (prompt) => {
      if (!prompt) return "";
      const label = getRangeLabel();
      // If prompt already mentions a relative time (e.g. "this morning", "today", "this month"),
      // replace or append the time range naturally
      if (rangeState.id === "today") {
        return prompt.replace(/this month|last 7 days/gi, "today");
      }
      if (rangeState.id === "7d") {
        return prompt.replace(/this month|today/gi, "in the last 7 days");
      }
      if (rangeState.id === "month") {
        return prompt.replace(/today|last 7 days/gi, "this month");
      }
      if (rangeState.id === "custom" && rangeState.startDate && rangeState.endDate) {
        return `${prompt} (between ${rangeState.startDate} and ${rangeState.endDate})`;
      }
      return `${prompt} (${label})`;
    },
    [getRangeLabel, rangeState]
  );

  return {
    rangeId: rangeState.id,
    startDate: rangeState.startDate,
    endDate: rangeState.endDate,
    setTimeRange,
    getRangeLabel,
    injectRangeIntoPrompt,
  };
}

export default useTimeRange;

