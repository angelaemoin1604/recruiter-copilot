// CandidateConfirmAvailability.jsx - Candidate confirms their availability
import { useState, useEffect } from "react";
import { Calendar, Clock, CheckCircle2, X, ChevronLeft, ChevronRight } from "lucide-react";

export default function CandidateConfirmAvailability({ availabilityToken, onClose }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [candidateInfo, setCandidateInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Fetch available slots from backend using the token
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        // Replace with your actual API endpoint
        const response = await fetch(`/api/availability/${availabilityToken}`);
        const data = await response.json();
        
        // Split each slot into 1-hour intervals
        const oneHourSlots = splitIntoOneHourSlots(data.slots);
        
        setAvailableSlots(oneHourSlots);
        setCandidateInfo(data.candidate); // { name, email, job }
        setLoading(false);
      } catch (error) {
        console.error("Failed to load availability:", error);
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [availabilityToken]);

  // Split time ranges into 1-hour slots
  const splitIntoOneHourSlots = (slots) => {
    const oneHourSlots = [];
    
    slots.forEach(slot => {
      const startHour = parseInt(slot.start.split(':')[0]);
      const endHour = parseInt(slot.end.split(':')[0]);
      
      // Generate 1-hour slots
      for (let hour = startHour; hour < endHour; hour++) {
        const slotStart = `${hour.toString().padStart(2, '0')}:00`;
        const slotEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;
        
        // Format display
        const startDisplay = hour < 12 ? `${hour}:00 AM` : 
                            hour === 12 ? `12:00 PM` : 
                            `${hour - 12}:00 PM`;
        const endHourDisplay = hour + 1;
        const endDisplay = endHourDisplay < 12 ? `${endHourDisplay}:00 AM` : 
                          endHourDisplay === 12 ? `12:00 PM` : 
                          `${endHourDisplay - 12}:00 PM`;
        
        oneHourSlots.push({
          date: slot.date,
          start: slotStart,
          end: slotEnd,
          display: `${startDisplay} - ${endDisplay}`
        });
      }
    });
    
    return oneHourSlots;
  };

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
      
      const isToday = currentDate.toDateString() === today.toDateString();
      
      // Check if this date has available slots
      const slotsForDate = availableSlots.filter(s => s.date === dateStr);
      
      days.push({
        date: new Date(currentDate),
        dateStr,
        day: currentDate.getDate(),
        isPast,
        isCurrentMonth,
        isToday,
        hasSlots: slotsForDate.length > 0,
        slots: slotsForDate
      });
      
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

  const handleSubmit = async () => {
    if (!selectedSlot) {
      alert("Please select a time slot");
      return;
    }

    setSubmitting(true);

    try {
      // Replace with your actual API endpoint
      const response = await fetch(`/api/availability/${availabilityToken}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedSlot: selectedSlot,
          candidateEmail: candidateInfo.email
        })
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        alert("Failed to submit. Please try again.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading availability...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Confirmed!</h2>
          <p className="text-slate-600 mb-4">
            Your interview slot has been confirmed. You'll receive a calendar invite shortly.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900 font-medium mb-1">Selected Slot:</p>
            <p className="text-blue-700 font-semibold">
              {new Date(selectedSlot.date + 'T00:00:00').toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
            <p className="text-blue-700 font-semibold">{selectedSlot.display}</p>
          </div>
          <p className="text-xs text-slate-500">
            You can close this window now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-5xl mx-auto py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar size={32} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Confirm Your Interview Availability</h1>
          </div>
          {candidateInfo && (
            <div className="text-slate-600">
              <p className="font-medium">Hello {candidateInfo.name},</p>
              <p className="text-sm">Please select your preferred interview time for: <span className="font-semibold">{candidateInfo.job}</span></p>
            </div>
          )}
        </div>

        {/* Calendar and Slots */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
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

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, i) => {
                    const isDisabled = day.isPast || !day.isCurrentMonth || !day.hasSlots;
                    
                    return (
                      <div
                        key={`${day.dateStr}-${i}`}
                        className={`
                          h-10 w-full rounded-lg flex items-center justify-center text-sm font-medium
                          ${!day.isCurrentMonth ? 'text-slate-300 bg-slate-50' : ''}
                          ${day.isPast && day.isCurrentMonth ? 'text-slate-400 bg-slate-100' : ''}
                          ${day.isToday && !isDisabled ? 'ring-2 ring-orange-400' : ''}
                          ${day.hasSlots && !isDisabled 
                            ? 'bg-blue-100 text-blue-900 ring-2 ring-blue-400 font-bold cursor-pointer hover:bg-blue-200' 
                            : ''
                          }
                          ${!day.hasSlots && !isDisabled && !day.isPast 
                            ? 'bg-white border border-slate-300 text-slate-400' 
                            : ''
                          }
                        `}
                      >
                        {day.day}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-4 text-xs text-slate-600 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-blue-100 border-2 border-blue-400"></div>
                    <span className="font-semibold">Available dates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded border-2 border-orange-400"></div>
                    <span>Today's date</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Available Time Slots */}
            <div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Clock size={20} className="text-blue-600" />
                  Available Time Slots
                </h3>

                {/* Note about 1-hour slots */}
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-900 font-medium">
                    <strong>Note:</strong> Each slot will be of 1 hour.
                  </p>
                </div>

                {availableSlots.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Calendar size={48} className="mx-auto mb-3 text-slate-300" />
                    <p>No available slots at this time</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {/* Group slots by date */}
                    {Object.entries(
                      availableSlots.reduce((groups, slot) => {
                        if (!groups[slot.date]) {
                          groups[slot.date] = [];
                        }
                        groups[slot.date].push(slot);
                        return groups;
                      }, {})
                    ).map(([date, slotsForDate]) => (
                      <div key={date} className="border-b border-slate-200 pb-3 last:border-b-0">
                        {/* Date header */}
                        <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-2">
                          <Calendar size={14} />
                          {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'long', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                          <span className="text-slate-500 font-normal">({slotsForDate.length} slots)</span>
                        </div>
                        
                        {/* Time slots for this date */}
                        <div className="space-y-2">
                          {slotsForDate.map((slot, idx) => {
                            const isSelected = selectedSlot?.date === slot.date && selectedSlot?.start === slot.start;
                            
                            return (
                              <button
                                key={idx}
                                onClick={() => setSelectedSlot(slot)}
                                className={`
                                  w-full p-3 rounded-lg border-2 transition text-center
                                  ${isSelected 
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105' 
                                    : 'bg-white border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                                  }
                                `}
                              >
                                <div className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-blue-700'}`}>
                                  {slot.display}
                                </div>
                                {isSelected && (
                                  <div className="flex items-center justify-center gap-1 mt-1 text-white text-xs">
                                    <CheckCircle2 size={12} />
                                    <span>Selected</span>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              {selectedSlot ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <span>1 slot selected</span>
                </div>
              ) : (
                <span>Please select a time slot</span>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!selectedSlot || submitting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Confirm My Availability
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center text-sm text-slate-600">
          <p>After confirmation, you'll receive a calendar invite with interview details.</p>
        </div>
      </div>
    </div>
  );
}
