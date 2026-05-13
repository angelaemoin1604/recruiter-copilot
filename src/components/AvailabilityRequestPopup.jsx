// AvailabilityRequestPopup.jsx - STANDALONE availability request popup
import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Calendar, Clock, Send } from "lucide-react";

export default function AvailabilityRequestPopup({ candidate, onClose }) {
  const [selectedDates, setSelectedDates] = useState([]);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("19:00");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);

  if (!candidate) return null;

  // Generate calendar days
  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const startDate = new Date(firstDayOfMonth);
    const dayOfWeek = firstDayOfMonth.getDay();
    startDate.setDate(firstDayOfMonth.getDate() - dayOfWeek);
    
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const isCurrentMonth = currentDate.getMonth() === currentMonth.getMonth();
      const isPast = currentDate < today;
      
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      days.push({
        date: new Date(currentDate),
        dateStr,
        day: currentDate.getDate(),
        isPast,
        isCurrentMonth
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  const handleSend = () => {
    if (selectedDates.length === 0) {
      alert("Please select at least one date");
      return;
    }

    // Generate token
    const token = `avail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create slots
    const slots = selectedDates.map(dateStr => ({
      date: dateStr,
      start: startTime,
      end: endTime,
      display: formatTimeRange(startTime, endTime)
    }));

    // Store in localStorage (MOCK)
    const availabilityData = {
      token,
      candidateId: candidate.rh_id || candidate.id,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      job: candidate.current_title || candidate.job || "Position",
      slots,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    localStorage.setItem(`availability_${token}`, JSON.stringify(availabilityData));

    // Generate confirmation URL
    const confirmUrl = `${window.location.origin}/confirm-availability.html?token=${token}`;

    console.log('📧 Mock Email - Availability Request');
    console.log('To:', candidate.email);
    console.log('Slots:', slots);

    alert(`✅ Availability request created!\n\nConfirmation URL:\n${confirmUrl}\n\n(Copy this URL to test the candidate view)`);
    
    onClose();
  };

  const formatTimeRange = (start, end) => {
    const formatTime = (time) => {
      const [hours, minutes] = time.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayHours = h % 12 || 12;
      return `${displayHours}:${minutes} ${ampm}`;
    };
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-t-xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Calendar size={28} />
              Request Availability
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              Send interview slot options to {candidate.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Calendar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-2 hover:bg-gray-100 rounded">
                <ChevronLeft size={20} />
              </button>
              <h3 className="text-lg font-bold">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-2 hover:bg-gray-100 rounded">
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 text-center mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-xs font-bold text-gray-600 py-2">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, i) => {
                const isSelected = selectedDates.includes(day.dateStr);
                const isDisabled = day.isPast || !day.isCurrentMonth;

                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (!isDisabled) {
                        setSelectedDates(prev => 
                          prev.includes(day.dateStr) 
                            ? prev.filter(d => d !== day.dateStr)
                            : [...prev, day.dateStr]
                        );
                      }
                    }}
                    disabled={isDisabled}
                    className={`
                      aspect-square p-2 rounded-lg text-sm font-medium transition
                      ${isSelected 
                        ? 'bg-gradient-to-br from-blue-700 to-indigo-700 text-white shadow-lg' 
                        : isDisabled
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'bg-gray-50 hover:bg-blue-50 text-gray-900'
                      }
                    `}
                  >
                    {day.day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Selection */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Clock size={18} className="text-blue-600" />
              Time Range
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Start Time</label>
                <select value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full p-2 border rounded-lg">
                  <option value="07:00">7:00 AM</option>
                  <option value="08:00">8:00 AM</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">End Time</label>
                <select value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full p-2 border rounded-lg">
                  <option value="17:00">5:00 PM</option>
                  <option value="18:00">6:00 PM</option>
                  <option value="19:00">7:00 PM</option>
                  <option value="20:00">8:00 PM</option>
                  <option value="22:00">10:00 PM</option>
                </select>
              </div>
            </div>
          </div>

          {/* Selected Dates Summary */}
          {selectedDates.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-bold text-blue-900 mb-2">
                Selected Dates ({selectedDates.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedDates.map(dateStr => (
                  <span key={dateStr} className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                    {new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-bold hover:bg-gray-50 transition">
              Cancel
            </button>
            <button onClick={handleSend} className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-800 transition flex items-center justify-center gap-2">
              <Send size={18} />
              Send to Candidate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
