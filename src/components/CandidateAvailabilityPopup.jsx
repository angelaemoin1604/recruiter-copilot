// CandidateAvailabilityPopup.jsx - COMPACT VERSION
import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Calendar, Send } from "lucide-react";

export default function CandidateAvailabilityPopup({ candidate, job, onClose, onSend, confirmedSlots = [] }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const isDraggingRef = useRef(false); // Use ref for immediate sync
  const dragStartRef = useRef(null); // Use ref for immediate sync
  const hoveredDateRef = useRef(null);
  const committedDatesRef = useRef([]); // Stores dates from previous drag operations
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [tempYear, setTempYear] = useState(null);

  // Fixed time range: 7 AM to 10 PM
  const FIXED_START_TIME = "07:00";
  const FIXED_END_TIME = "22:00";
  const FIXED_TIME_DISPLAY = "7:00 AM - 10:00 PM";

  // Get current year/month/date to highlight properly
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();

  // Global mouseup - only reset drag if clicking OUTSIDE the calendar
  useEffect(() => {
    const handleGlobalMouseUp = (e) => {
      console.log('[GLOBAL MOUSEUP]', Date.now(), 'isDragging:', isDraggingRef.current);
      // Only reset if clicking outside calendar AND drag is active
      if (isDraggingRef.current) {
        const clickedInsideCalendar = e.target.closest('button');
        if (!clickedInsideCalendar) {
          console.log('  → OUTSIDE calendar - committing and resetting drag');
          isDraggingRef.current = false;
          dragStartRef.current = null;
        } else {
          console.log('  → INSIDE calendar button - NOT resetting drag');
        }
      }
    };
    
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Close year/month picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if ((showYearPicker || showMonthPicker) && !e.target.closest('.year-picker-container')) {
        setShowYearPicker(false);
        setShowMonthPicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showYearPicker, showMonthPicker]);

  // Auto-create slots when dates are selected
  useEffect(() => {
    if (selectedDates.length > 0) {
      const newSlots = selectedDates.map(dateStr => ({
        date: dateStr,
        start: FIXED_START_TIME,
        end: FIXED_END_TIME,
        display: FIXED_TIME_DISPLAY
      }));
      setSelectedSlots(newSlots);
    } else {
      setSelectedSlots([]);
    }
  }, [selectedDates]);

  // Generate calendar days
  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const firstDayOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const startDate = new Date(firstDayOfMonth);
    const dayOfWeek = firstDayOfMonth.getDay();
    startDate.setDate(firstDayOfMonth.getDate() - dayOfWeek);
    
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const isPast = currentDate < today;
      const isCurrentMonth = currentDate.getMonth() === selectedMonth.getMonth();
      
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const isToday = currentDate.getFullYear() === today.getFullYear() &&
                      currentDate.getMonth() === today.getMonth() &&
                      currentDate.getDate() === today.getDate();
      
      days.push({
        date: new Date(currentDate),
        dateStr,
        day: currentDate.getDate(),
        isPast,
        isCurrentMonth,
        isToday
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  const prevMonth = () => {
    const newDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1);
    // Prevent going to past months
    if (newDate.getFullYear() < currentYear || 
        (newDate.getFullYear() === currentYear && newDate.getMonth() < currentMonth)) {
      return; // Don't allow
    }
    setSelectedMonth(newDate);
  };

  const nextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1));
  };

  const selectYear = (year) => {
    if (year === currentYear) {
      // Current year selected - go directly to calendar with current month
      setSelectedMonth(new Date(year, currentMonth, 1));
      setShowYearPicker(false);
      setShowMonthPicker(false);
    } else {
      // Other year selected - show month picker
      setTempYear(year);
      setShowYearPicker(false);
      setShowMonthPicker(true);
    }
  };

  const selectMonth = (monthIndex) => {
    setSelectedMonth(new Date(tempYear, monthIndex, 1));
    setShowMonthPicker(false);
    setTempYear(null);
  };

  const openYearPicker = () => {
    setShowYearPicker(true);
    setShowMonthPicker(false);
  };

  const handleSend = () => {
    if (selectedSlots.length === 0) {
      alert("Please select at least one date");
      return;
    }
    onSend(selectedSlots);
  };

  const removeSlot = (dateStr) => {
    setSelectedDates(prev => prev.filter(d => d !== dateStr));
    committedDatesRef.current = committedDatesRef.current.filter(d => d !== dateStr);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Prevent closing when clicking on background
        e.stopPropagation();
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Calendar size={20} />
              Request Availability
            </h2>
            <p className="text-blue-100 text-xs mt-0.5">
              Send slots to {candidate.name} for {job?.title || 'position'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          {/* Note about fixed time */}
          <div className="mb-3 p-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-orange-400 rounded text-xs">
            <div className="flex items-start gap-2">
              <span className="text-orange-600 text-base">📌</span>
              <div className="text-amber-900">
                <strong>Note:</strong> Select dates from the calendar. All slots will have the time range{' '}
                <span className="font-bold text-orange-700">7:00 AM - 10:00 PM</span>. 
                These availability options will be sent to the candidate to choose their{' '}
                <span className="font-bold">preferred date and time</span>.
              </div>
            </div>
          </div>

          {/* Horizontal Layout: Calendar | Selected Slots */}
          <div className="grid grid-cols-[1.2fr,1fr] gap-4">
            {/* Left: Compact Calendar */}
            <div>
              {/* Month Navigation with Year & Month Picker */}
              <div className="flex items-center justify-between mb-2 relative year-picker-container">
                <button 
                  onClick={prevMonth} 
                  disabled={selectedMonth.getFullYear() === currentYear && selectedMonth.getMonth() === currentMonth}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <button
                  onClick={openYearPicker}
                  className="text-sm font-bold hover:bg-gray-100 px-2 py-1 rounded flex items-center gap-1"
                >
                  {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  <span className="text-xs">▼</span>
                </button>
                
                <button 
                  onClick={nextMonth} 
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronRight size={16} />
                </button>

                {/* Year Picker Dropdown */}
                {showYearPicker && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-300 rounded-lg shadow-xl z-10 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold text-slate-700">
                        {currentYear} - {currentYear + 29}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                      {Array.from({ length: 30 }, (_, i) => currentYear + i).map(year => {
                        const isCurrentYear = year === currentYear;
                        const isSelectedYear = year === selectedMonth.getFullYear();
                        
                        return (
                          <button
                            key={year}
                            onClick={() => selectYear(year)}
                            className={`
                              px-3 py-1.5 text-xs rounded transition font-medium
                              ${isSelectedYear 
                                ? 'bg-blue-700 text-white font-bold ring-2 ring-blue-400' 
                                : isCurrentYear
                                  ? 'bg-blue-100 text-blue-900 font-bold border-2 border-blue-500'
                                  : 'bg-slate-100 hover:bg-blue-50 text-slate-700'
                              }
                            `}
                          >
                            {year}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Month Picker Dropdown */}
                {showMonthPicker && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-300 rounded-lg shadow-xl z-10 p-3">
                    <div className="text-xs font-bold text-slate-700 mb-3 text-center">{tempYear}</div>
                    <div className="grid grid-cols-3 gap-2">
                      {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map((monthName, idx) => {
                        // Always highlight current month (May = 4) regardless of year
                        const isCurrentMonth = idx === currentMonth;
                        const isSelectedMonth = tempYear === selectedMonth.getFullYear() && idx === selectedMonth.getMonth();
                        
                        return (
                          <button
                            key={idx}
                            onClick={() => selectMonth(idx)}
                            className={`
                              px-3 py-2 text-xs rounded transition font-medium
                              ${isSelectedMonth
                                ? 'bg-blue-700 text-white font-bold ring-2 ring-blue-400'
                                : isCurrentMonth
                                  ? 'bg-orange-100 text-orange-900 font-bold border-2 border-orange-500'
                                  : 'bg-slate-100 hover:bg-blue-50 text-slate-700'
                              }
                            `}
                          >
                            {monthName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-[10px] font-bold text-gray-600 py-1">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  const isSelected = selectedDates.includes(day.dateStr);
                  const isDisabled = day.isPast || !day.isCurrentMonth;

                  // Check if candidate has confirmed this slot
                  const hasConfirmedSlot = confirmedSlots.includes(day.dateStr);

                  // Check if this is today's date (18th May 2026) - show even in other months/years
                  const isTodayDate = day.day === currentDate && 
                                     day.date.getMonth() === currentMonth &&
                                     day.isCurrentMonth;

                  return (
                    <button
                      key={i}
                      onClick={(e) => {
                        if (isDisabled) return;
                        e.preventDefault();
                        e.stopPropagation();
                        
                        console.log('[ONCLICK]', Date.now());
                        
                        // Read ref values IMMEDIATELY at click time
                        const currentlyDragging = isDraggingRef.current;
                        const currentDragStart = dragStartRef.current;
                        
                        console.log('=== CLICK ===', day.dateStr);
                        console.log('  isDraggingRef.current:', currentlyDragging);
                        console.log('  dragStartRef.current:', currentDragStart);
                        console.log('  isSelected:', isSelected);
                        console.log('  selectedDates:', selectedDates);
                        console.log('  selectedDates.length:', selectedDates.length);
                        console.log('  selectedDates[0]:', selectedDates[0]);
                        console.log('  day.dateStr:', day.dateStr);
                        console.log('  Are they equal?', selectedDates[0] === day.dateStr);
                        
                        // CASE 1: Drag is active - END it and COMMIT current selection
                        if (currentlyDragging && currentDragStart) {
                          console.log('  → CASE 1: END DRAG at:', day.dateStr);
                          isDraggingRef.current = false;
                          dragStartRef.current = null;
                          // Commit all currently selected dates
                          committedDatesRef.current = [...selectedDates];
                          return;
                        }
                        
                        // CASE 2: Clicking same single date again - DESELECT it
                        if (isSelected && selectedDates.length === 1 && selectedDates[0] === day.dateStr) {
                          console.log('  → CASE 2: Deselecting single date');
                          setSelectedDates([]);
                          committedDatesRef.current = committedDatesRef.current.filter(d => d !== day.dateStr);
                          return;
                        }
                        
                        // CASE 3: Clicking already selected date in a range - remove it
                        if (isSelected && !currentlyDragging) {
                          console.log('  → CASE 3: REMOVE date:', day.dateStr);
                          setSelectedDates(prev => prev.filter(d => d !== day.dateStr));
                          committedDatesRef.current = committedDatesRef.current.filter(d => d !== day.dateStr);
                          return;
                        }
                        
                        // CASE 4: Start new drag from this unselected date
                        console.log('  → CASE 4: START DRAG from:', day.dateStr);
                        isDraggingRef.current = true;
                        dragStartRef.current = day.dateStr;
                        // KEEP committed dates, add new one
                        const newDates = [...new Set([...committedDatesRef.current, day.dateStr])];
                        setSelectedDates(newDates);
                        
                        console.log('  After setting: isDraggingRef.current =', isDraggingRef.current);
                        console.log('  After setting: dragStartRef.current =', dragStartRef.current);
                      }}
                      onMouseEnter={() => {
                        // Update range while dragging (NO button press needed!)
                        if (isDraggingRef.current && !isDisabled && dragStartRef.current) {
                          const allDates = calendarDays
                            .filter(d => !d.isPast && d.isCurrentMonth)
                            .map(d => d.dateStr);
                          
                          const startIdx = allDates.indexOf(dragStartRef.current);
                          const endIdx = allDates.indexOf(day.dateStr);
                          
                          if (startIdx !== -1 && endIdx !== -1) {
                            const minIdx = Math.min(startIdx, endIdx);
                            const maxIdx = Math.max(startIdx, endIdx);
                            const rangeSelected = allDates.slice(minIdx, maxIdx + 1);
                            // MERGE with committed dates from previous drags
                            const merged = [...new Set([...committedDatesRef.current, ...rangeSelected])];
                            setSelectedDates(merged);
                          }
                        }
                      }}
                      disabled={isDisabled}
                      className={`
                        h-8 w-full rounded transition-all flex items-center justify-center text-xs font-medium select-none
                        ${!day.isCurrentMonth ? 'text-slate-300 cursor-not-allowed bg-slate-50' : ''}
                        ${day.isPast && day.isCurrentMonth ? 'text-slate-400 cursor-not-allowed bg-slate-100' : ''}
                        ${isTodayDate && !isSelected ? 'ring-2 ring-orange-400' : ''}
                        ${hasConfirmedSlot && !isSelected ? 'bg-green-50 text-green-700 font-semibold border border-green-400' : ''}
                        ${!hasConfirmedSlot && isTodayDate && !isSelected ? 'bg-orange-50' : ''}
                        ${isSelected 
                          ? 'bg-gradient-to-br from-blue-700 to-indigo-700 text-white font-bold shadow-md' 
                          : !isDisabled && !hasConfirmedSlot
                            ? 'bg-white border border-slate-300 hover:bg-blue-50 hover:border-blue-400' 
                            : ''
                        }
                      `}
                    >
                      {day.day}
                    </button>
                  );
                })}
              </div>

              {/* Compact Legend */}
              <div className="mt-2 text-[10px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-700 to-indigo-700"></div>
                  <span>Selected dates</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-green-50 border border-green-400"></div>
                  <span>Candidate confirmed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded ring-2 ring-orange-400 bg-orange-50"></div>
                  <span>Today</span>
                </div>
              </div>
            </div>

            {/* Right: Selected Slots */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex flex-col h-[380px]">
              {selectedSlots.length > 0 ? (
                <>
                  <div className="text-xs font-bold text-slate-900 mb-2 flex-shrink-0">
                    Selected Slots ({selectedSlots.length})
                  </div>
                  <div className="space-y-1.5 overflow-y-auto flex-1">
                    {selectedSlots.map((slot, i) => (
                      <div 
                        key={i} 
                        className="bg-white border border-blue-300 rounded px-2 py-1.5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-blue-900">
                            {new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="text-blue-700 text-[10px]">{slot.display}</div>
                        </div>
                        <button
                          onClick={() => removeSlot(slot.date)}
                          className="text-blue-600 hover:text-blue-800 p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Calendar size={32} className="text-slate-300 mb-2" />
                  <p className="text-xs text-slate-600 font-medium">Select dates from calendar</p>
                  <p className="text-[10px] text-slate-500 mt-1">Click or drag to select</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Compact Footer */}
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="text-xs text-slate-600">
            {selectedSlots.length > 0 ? (
              <span className="font-medium text-slate-900">{selectedSlots.length} slot(s) selected</span>
            ) : (
              <span>Select dates to continue</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-200 rounded font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={selectedSlots.length === 0}
              className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition flex items-center gap-1.5"
            >
              <Send size={12} />
              Send to Candidate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
