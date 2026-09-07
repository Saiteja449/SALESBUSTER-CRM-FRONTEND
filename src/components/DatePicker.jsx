import React, { useState, useEffect, useRef } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function DatePicker({ value, onChange, className }) {
  const [isOpen, setIsOpen] = useState(false);

  // Initialize currentMonth based on value or today's date
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      // Create date at noon to avoid timezone shift issues
      return new Date(value + "T12:00:00");
    }
    return new Date();
  });

  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update currentMonth if value changes externally
  useEffect(() => {
    if (value) {
      setCurrentMonth(new Date(value + "T12:00:00"));
    }
  }, [value]);

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  ).getDate();
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  ).getDay();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const handleDateSelect = (day, e) => {
    e.stopPropagation();
    const selectedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

    // Simulate event object for the parent's onChange
    onChange({ target: { value: formattedDate } });
    setIsOpen(false);
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const isSelected = value === dStr;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      d,
    );

    const isPastDate = currentDate < today;

    const todayStr = `${today.getFullYear()}-${String(
      today.getMonth() + 1,
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const isToday = dStr === todayStr;

    days.push(
      <button
        key={d}
        type="button"
        disabled={isPastDate}
        onClick={(e) => !isPastDate && handleDateSelect(d, e)}
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
          isPastDate
            ? "text-gray-400 cursor-not-allowed opacity-50"
            : isSelected
              ? "bg-purple-500 text-white font-bold"
              : isToday
                ? "bg-brand-secondary/30 text-purple-500 font-semibold"
                : "text-brand-primary hover:bg-brand-secondary/50"
        }`}
      >
        {d}
      </button>,
    );
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Format display value nicely, e.g. "May 26, 2026"
  const getDisplayValue = () => {
    if (!value) return "Select a date";
    const d = new Date(value + "T12:00:00");
    if (isNaN(d.getTime())) return value;
    return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  return (
    <div className="relative" ref={containerRef}>
      <div
        className={`w-full bg-brand-light border border-brand-secondary text-brand-primary text-sm rounded-lg p-2.5 flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${className || ""}`}
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setIsOpen(!isOpen);
        }}
      >
        <span>{getDisplayValue()}</span>
        <CalendarIcon size={16} className="text-brand-primary/70" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 bg-brand-light border border-brand-secondary rounded-lg shadow-xl p-4 w-72">
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-brand-secondary rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <ChevronLeft size={18} className="text-brand-primary" />
            </button>
            <span className="font-bold text-brand-primary">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-brand-secondary rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <ChevronRight size={18} className="text-brand-primary" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div
                key={day}
                className="text-xs font-semibold text-brand-primary/50"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">{days}</div>
        </div>
      )}
    </div>
  );
}
