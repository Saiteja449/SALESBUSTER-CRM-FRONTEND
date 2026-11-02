import { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronDown, Check } from "lucide-react";
import { TIME_RANGE_OPTIONS } from "../../hooks/useTimeRange.js";
import DatePicker from "../DatePicker.jsx";

export default function TimeRangeSelect({
  rangeId,
  startDate,
  endDate,
  onRangeChange,
  getRangeLabel,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectPreset = (id) => {
    if (id === "custom") {
      onRangeChange((prev) => ({
        ...prev,
        id: "custom",
      }));
    } else {
      onRangeChange({
        id,
        startDate: "",
        endDate: "",
      });
      setIsOpen(false);
    }
  };

  const handleStartDateChange = (e) => {
    onRangeChange((prev) => ({
      ...prev,
      id: "custom",
      startDate: e.target.value,
    }));
  };

  const handleEndDateChange = (e) => {
    onRangeChange((prev) => ({
      ...prev,
      id: "custom",
      endDate: e.target.value,
    }));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-bg-secondary/70 hover:bg-bg-secondary text-xs font-medium text-text-primary border border-border-main transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 shadow-2xs"
        title="Filter analysis by time range"
        aria-label="Select analysis time range"
        aria-expanded={isOpen}
      >
        <CalendarIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
        <span className="max-w-[130px] truncate">{getRangeLabel()}</span>
        <ChevronDown className="w-3 h-3 text-text-secondary" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-64 bg-bg-card border border-border-main rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1 text-[10px] font-bold text-text-secondary uppercase tracking-wider">
            Analysis Time Range
          </div>

          <div className="space-y-0.5 mt-1">
            {TIME_RANGE_OPTIONS.map((opt) => {
              const isSelected = rangeId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectPreset(opt.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 font-semibold"
                      : "text-text-primary hover:bg-bg-secondary/60"
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                </button>
              );
            })}
          </div>

          {/* Custom Date Pickers */}
          {rangeId === "custom" && (
            <div className="mt-3 pt-3 border-t border-border-main space-y-2">
              <div>
                <label className="text-[10px] font-semibold text-text-secondary block mb-1">
                  Start Date
                </label>
                <DatePicker value={startDate} onChange={handleStartDateChange} className="py-1 text-xs" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-text-secondary block mb-1">
                  End Date
                </label>
                <DatePicker value={endDate} onChange={handleEndDateChange} className="py-1 text-xs" />
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full mt-2 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors cursor-pointer"
              >
                Apply Range
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
