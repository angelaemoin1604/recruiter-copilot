// CandidateAvailabilityPopup.jsx - WITH START/END TIME DROPDOWNS
import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Calendar, Clock, Send, Plus } from "lucide-react";

// Time Range Selector Component with Start/End dropdowns
function TimeRangeSelector({ selectedDate, selectedSlots, onSlotsChange, selectedDates }) {
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("19:00");

  // Auto-add default slot for all selected dates when dates change
  useEffect(() => {
    if (selectedDates.length > 0) {
      const startHour = parseInt(startTime.split(':')[0]);
      const endHour = parseInt(endTime.split(':')[0]);
      
      const startDisplay = startHour < 12 ? `${startHour}:00 AM` : 
                          startHour === 12 ? `12:00 PM` : 
                          `${startHour - 12}:00 PM`;
      const endDisplay = endHour < 12 ? `${endHour}:00 AM` : 
                        endHour === 12 ? `12:00 PM` : 
                        `${endHour - 12}:00 PM`;
      
      const display = `${startDisplay} - ${endDisplay}`;
      
      // Add/update slots for all selected dates
      const newSlots = selectedDates.map(dateStr => ({
        date: dateStr,
        start: startTime,
        end: endTime,
        display
      }));
      
      onSlotsChange(newSlots);
    }
  }, [selectedDates, startTime, endTime]);

  // Generate time options from 7 AM to 8 PM
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 7; hour <= 20; hour++) {
      const time24 = `${hour.toString().padStart(2, '0')}:00`;
      const display = hour < 12 ? `${hour}:00 AM` : 
                      hour === 12 ? `12:00 PM` : 
                      `${hour - 12}:00 PM`;
      options.push({ value: time24, label: display, hour });
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Get available end times based on selected start time
  const getEndTimeOptions = () => {
    if (!startTime) return timeOptions;
    const startHour = parseInt(startTime.split(':')[0]);
    return timeOptions.filter(opt => opt.hour > startHour && opt.hour <= 20);
  };

  return (
    <div className="space-y-4">
      {/* Note about time slot */}
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-900 font-medium">
          <strong>Note:</strong> Select your preferred start and end times. These times will apply to all selected dates.
        </p>
      </div>

      {/* Start and End Time Dropdowns */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">START TIME</label>
          <select
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          >
            {timeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">END TIME</label>
          <select
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          >
            {getEndTimeOptions().map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default function CandidateAvailabilityPopup({ candidate, onClose, onSend }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);

  // Proper calendar day generation
  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get first day of the selected month
    const firstDayOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    
    // Get the starting Sunday (may be from previous month)
    const startDate = new Date(firstDayOfMonth);
    const dayOfWeek = firstDayOfMonth.getDay();
    startDate.setDate(firstDayOfMonth.getDate() - dayOfWeek);
    
    // Generate exactly 42 days (6 weeks)
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const isPast = currentDate < today;
      const isCurrentMonth = currentDate.getMonth() === selectedMonth.getMonth();
      const dateStr = currentDate.toISOString().split('T')[0];
      const isToday = currentDate.toDateString() === today.toDateString();
      
      days.push({
        date: new Date(currentDate),
        dateStr,
        day: currentDate.getDate(),
        isPast,
        isCurrentMonth,
        isToday
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const months = ["January", "February", "March", "April", "May", "June", 
                  "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1));
  };

  const toggleSlot = (dateStr, timeSlot) => {
    const slotKey = `${dateStr}-${timeSlot.start}`;
    const existingIndex = selectedSlots.findIndex(s => `${s.date}-${s.start}` === slotKey);
    
    if (existingIndex >= 0) {
      setSelectedSlots(selectedSlots.filter((_, i) => i !== existingIndex));
    } else {
      setSelectedSlots([...selectedSlots, { 
        date: dateStr, 
        start: timeSlot.start, 
        end: timeSlot.end, 
        display: timeSlot.display 
      }]);
    }
  };

  const isSlotSelected = (dateStr, timeSlot) => {
    return selectedSlots.some(s => s.date === dateStr && s.start === timeSlot.start);
  };

  const hasSlotOnDate = (dateStr) => {
    return selectedSlots.some(s => s.date === dateStr);
  };

  // Global mouseup to stop dragging
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const handleSend = () => {
    if (selectedSlots.length === 0) {
      alert("Please select at least one time slot");
      return;
    }
    onSend(selectedSlots);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <Calendar size={24} />
            <div>
              <h2 className="text-lg font-bold">Request Availability</h2>
              <p className="text-sm text-blue-100">Send interview slot options to {candidate.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left: Calendar */}
            <div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                {/* Month navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button onClick={prevMonth} className="p-2 hover:bg-slate-200 rounded">
                    <ChevronLeft size={20} />
                  </button>
                  <div className="font-bold text-lg text-slate-900">
                    {months[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
                  </div>
                  <button onClick={nextMonth} className="p-2 hover:bg-slate-200 rounded">
                    <ChevronRight size={20} />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                    <div key={day} className="text-center text-xs font-bold text-slate-600">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days - MULTI-SELECT WITH DRAG */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, i) => {
                    const hasSlots = hasSlotOnDate(day.dateStr);
                    const isSelected = selectedDates.includes(day.dateStr);
                    const isDisabled = day.isPast || !day.isCurrentMonth;
                    
                    return (
                      <button
                        key={`${day.dateStr}-${i}`}
                        onMouseDown={() => {
                          if (!isDisabled) {
                            setIsDragging(true);
                            setDragStart(day.dateStr);
                            // Toggle single date
                            if (isSelected) {
                              setSelectedDates(selectedDates.filter(d => d !== day.dateStr));
                            } else {
                              setSelectedDates([...selectedDates, day.dateStr]);
                            }
                          }
                        }}
                        onMouseEnter={() => {
                          if (isDragging && !isDisabled && dragStart) {
                            // Add date to selection while dragging
                            if (!selectedDates.includes(day.dateStr)) {
                              setSelectedDates([...selectedDates, day.dateStr]);
                            }
                          }
                        }}
                        onMouseUp={() => {
                          setIsDragging(false);
                          setDragStart(null);
                        }}
                        disabled={isDisabled}
                        className={`
                          h-10 w-full rounded-lg transition-all flex items-center justify-center select-none
                          ${!day.isCurrentMonth ? 'text-slate-300 cursor-not-allowed bg-slate-50' : ''}
                          ${day.isPast && day.isCurrentMonth ? 'text-slate-400 cursor-not-allowed bg-slate-100' : ''}
                          ${day.isToday && !isSelected ? 'ring-2 ring-orange-400' : ''}
                          
                          ${isSelected 
                            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-base shadow-lg ring-4 ring-blue-300 scale-105 transform' 
                            : ''
                          }
                          
                          ${hasSlots && !isSelected && !isDisabled 
                            ? 'bg-emerald-100 text-emerald-900 ring-2 ring-emerald-400 font-bold text-sm' 
                            : ''
                          }
                          
                          ${!isDisabled && !isSelected && !hasSlots 
                            ? 'bg-white border border-slate-300 hover:bg-blue-50 hover:border-blue-400 hover:shadow-md text-slate-700 font-medium text-sm' 
                            : ''
                          }
                        `}
                      >
                        {day.day}
                      </button>
                    );
                  })}
                </div>

                {/* Updated Legend */}
                <div className="mt-4 text-xs text-slate-600 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md ring-2 ring-blue-300"></div>
                    <span className="font-semibold">Selected dates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-emerald-100 border-2 border-emerald-400"></div>
                    <span className="font-semibold">Has time slots selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded border-2 border-orange-400"></div>
                    <span>Today's date</span>
                  </div>
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                    <span className="font-semibold text-blue-900">💡 Tip:</span> Click to select single date, or drag to select multiple dates
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Time slots with dropdowns */}
            <div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                {selectedDates.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-300">
                      <Clock size={20} className="text-blue-600" />
                      <div>
                        <div className="font-bold text-slate-900">Dates & Time Selected</div>
                        <div className="text-sm text-slate-600">
                          {selectedDates.length} date{selectedDates.length > 1 ? 's' : ''} selected
                        </div>
                      </div>
                    </div>

                    {/* Time Range Selector */}
                    <TimeRangeSelector 
                      selectedDate={selectedDates[0]}
                      selectedSlots={selectedSlots}
                      onSlotsChange={setSelectedSlots}
                      selectedDates={selectedDates}
                    />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20">
                    <Calendar size={48} className="text-slate-300 mb-3" />
                    <p className="text-slate-600 font-medium">Select date(s) from the calendar</p>
                    <p className="text-sm text-slate-500 mt-1">Click one date or drag to select multiple dates</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selected slots summary */}
          {selectedSlots.length > 0 && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="font-bold text-blue-900 mb-2">Selected Slots ({selectedSlots.length})</div>
              <div className="flex flex-wrap gap-2">
                {selectedSlots.map((slot, i) => (
                  <div key={i} className="inline-flex items-center gap-2 bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-sm shadow-sm">
                    <span className="font-medium text-blue-900">
                      {new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-blue-700">{slot.display}</span>
                    <button
                      onClick={() => toggleSlot(slot.date, { start: slot.start, end: slot.end, display: slot.display })}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="text-sm text-slate-600">
            {selectedSlots.length > 0 ? (
              <span className="font-medium text-slate-900">{selectedSlots.length} slot(s) selected</span>
            ) : (
              <span>Select time slots to send to candidate</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={selectedSlots.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition flex items-center gap-2 shadow-md"
            >
              <Send size={16} />
              Send to Candidate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
