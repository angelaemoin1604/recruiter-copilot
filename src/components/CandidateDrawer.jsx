// CandidateDrawer.jsx - Side drawer showing candidate details with Availability tab
import { useState, useEffect } from "react";
import { X, Mail, Phone, MapPin, Briefcase, Calendar, Clock, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import * as DB from "../supabase.jsx";

export default function CandidateDrawer({ candidate, onClose, snapshot, onNavigate }) {
  const [tab, setTab] = useState("profile"); // "profile" | "availability"
  const [availabilityRequests, setAvailabilityRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filter states for Availability tab
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "confirmed" | "pending" | "expired"
  const [dateFilter, setDateFilter] = useState("all"); // "all" | "today" | "week" | "month"

  useEffect(() => {
    if (tab === "availability") {
      loadAvailability();
    }
  }, [tab, candidate]);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const { data, error } = await DB.supabase
        .from('availability_requests')
        .select('*')
        .eq('candidate_id', candidate.rh_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading availability:', error);
      } else {
        // Auto-expire requests after 48 hours
        const now = new Date();
        const processedData = (data || []).map(request => {
          if (request.status === 'pending') {
            const createdAt = new Date(request.created_at);
            const hoursSinceCreated = (now - createdAt) / (1000 * 60 * 60);
            
            if (hoursSinceCreated >= 48) {
              return { ...request, status: 'expired' };
            }
          }
          return request;
        });
        
        setAvailabilityRequests(processedData);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    if (isNaN(date.getTime())) return dateStr;
    
    const day = date.getDate();
    let suffix = "th";
    if (day % 10 === 1 && day !== 11) suffix = "st";
    else if (day % 10 === 2 && day !== 12) suffix = "nd";
    else if (day % 10 === 3 && day !== 13) suffix = "rd";
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day}${suffix} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return "";
    const date = new Date(isoStr);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-300';
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'expired': return 'bg-gray-200 text-gray-700 border-gray-400';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get candidate's job applications
  const applications = snapshot.applications.filter(a => a.rh_id === candidate.rh_id);
  const jobs = applications.map(a => {
    const job = snapshot.jobs.find(j => j.job_id === a.job_id);
    return { ...a, job };
  }).filter(a => a.job);

  // Filter availability requests
  const filteredRequests = availabilityRequests.filter(request => {
    // Status filter
    if (statusFilter !== "all" && request.status !== statusFilter) {
      return false;
    }
    
    // Date filter
    if (dateFilter !== "all") {
      const requestDate = new Date(request.created_at);
      const now = new Date();
      const daysDiff = Math.floor((now - requestDate) / (1000 * 60 * 60 * 24));
      
      if (dateFilter === "today" && daysDiff > 0) return false;
      if (dateFilter === "week" && daysDiff > 7) return false;
      if (dateFilter === "month" && daysDiff > 30) return false;
    }
    
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Navigation Arrow - Previous */}
            {onNavigate && (
              <button 
                onClick={() => onNavigate('prev')} 
                className="p-2 hover:bg-white/20 rounded-lg transition"
                title="Previous Candidate"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold">
              {candidate.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{candidate.name}</h2>
              <p className="text-purple-100 text-sm font-mono">{candidate.rh_id}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Navigation Arrow - Next */}
            {onNavigate && (
              <button 
                onClick={() => onNavigate('next')} 
                className="p-2 hover:bg-white/20 rounded-lg transition"
                title="Next Candidate"
              >
                <ChevronRight size={24} />
              </button>
            )}
            
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white px-6">
          <button
            onClick={() => setTab("profile")}
            className={`px-4 py-3 font-semibold text-sm border-b-2 transition ${
              tab === "profile"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Profile & Applications
          </button>
          <button
            onClick={() => setTab("availability")}
            className={`px-4 py-3 font-semibold text-sm border-b-2 transition ${
              tab === "availability"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Availability
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {tab === "profile" && (
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Mail size={18} className="text-purple-600" />
                    <span className="text-sm">{candidate.email}</span>
                  </div>
                  {candidate.phone && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Phone size={18} className="text-purple-600" />
                      <span className="text-sm">{candidate.phone}</span>
                    </div>
                  )}
                  {candidate.location && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <MapPin size={18} className="text-purple-600" />
                      <span className="text-sm">{candidate.location}</span>
                    </div>
                  )}
                  {candidate.current_title && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Briefcase size={18} className="text-purple-600" />
                      <span className="text-sm">{candidate.current_title}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Applications */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Applications ({jobs.length})</h3>
                {jobs.length === 0 ? (
                  <p className="text-gray-500 text-sm">No applications found</p>
                ) : (
                  <div className="space-y-3">
                    {jobs.map((app, i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-bold text-gray-900">{app.job.title}</h4>
                            <div className="text-xs text-gray-600 space-y-1 mt-1">
                              <div>
                                <span className="font-semibold">Job code:</span> <span className="font-mono">{app.job.requisition_code}</span>
                              </div>
                              {app.job.job_seq && (
                                <div>
                                  <span className="font-semibold">Job sequence:</span> <span className="font-mono">{app.job.job_seq}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-bold px-2 py-1 rounded bg-blue-100 text-blue-800">
                            {app.match_score}% Match
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-1 bg-indigo-50 text-indigo-800 rounded border border-indigo-300 font-semibold">
                            Round: {app.current_round}
                          </span>
                          <span className="px-2 py-1 bg-green-50 text-green-700 rounded border border-green-300 font-semibold">
                            Open
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "availability" && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> This shows all availability requests sent to this candidate. Requests expire after 48 hours.
                </p>
              </div>

              {/* Filters */}
              {!loading && availabilityRequests.length > 0 && (
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex flex-wrap gap-4">
                    {/* Status Filter */}
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-semibold text-gray-700 mb-2">Status</label>
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="all">All Status</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Pending</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>

                    {/* Date Filter */}
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-semibold text-gray-700 mb-2">Requested On</label>
                      <select 
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Results count */}
                  <div className="mt-3 text-xs text-gray-600">
                    Showing {filteredRequests.length} of {availabilityRequests.length} request{availabilityRequests.length !== 1 ? 's' : ''}
                  </div>
                </div>
              )}

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">Loading availability...</p>
                </div>
              ) : availabilityRequests.length === 0 ? (
                <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-200">
                  <Calendar size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-semibold mb-2">No Availability Requests</p>
                  <p className="text-gray-500 text-sm">No availability requests have been sent to this candidate yet.</p>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-200">
                  <Calendar size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-semibold mb-2">No Matching Requests</p>
                  <p className="text-gray-500 text-sm">Try adjusting your filters to see more results.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequests.map((request) => (
                    <div key={request.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                      {/* Request Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-gray-900 mb-1">
                            Availability Request for <span className="text-purple-600">{request.job_title}</span>
                          </h3>
                          <p className="text-xs text-gray-600">
                            Requested on {formatDateTime(request.created_at)}
                          </p>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusColor(request.status)}`}>
                          {request.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Slots Offered */}
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                          <Clock size={16} />
                          Time Slots Offered:
                        </h4>
                        <div className="space-y-2">
                          {request.slots && request.slots.map((slot, i) => (
                            <div key={i} className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-200">
                              • {formatDate(slot.date)} at {slot.display}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Confirmed Slots */}
                      {request.status === 'confirmed' && request.selected_slot && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="text-sm font-bold text-green-900 mb-2 flex items-center gap-2">
                            <CheckCircle size={16} />
                            Confirmed Slot{Array.isArray(request.selected_slot) && request.selected_slot.length > 1 ? 's' : ''}:
                          </h4>
                          <div className="space-y-2">
                            {Array.isArray(request.selected_slot) ? (
                              request.selected_slot.map((slot, i) => (
                                <div key={i} className="text-sm font-semibold text-green-900">
                                  ✓ {formatDate(slot.date)} at {slot.display}
                                </div>
                              ))
                            ) : (
                              <div className="text-sm font-semibold text-green-900">
                                ✓ {formatDate(request.selected_slot.date)} at {request.selected_slot.display}
                              </div>
                            )}
                          </div>
                          {request.confirmed_at && (
                            <p className="text-xs text-green-700 mt-2">
                              Confirmed on {formatDateTime(request.confirmed_at)}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Expiration Info */}
                      {request.status === 'pending' && request.expires_at && (
                        <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                          ⏰ Expires on {formatDateTime(request.expires_at)}
                        </div>
                      )}
                      
                      {/* Expired Message */}
                      {request.status === 'expired' && (
                        <div className="mt-3 text-xs text-gray-600 bg-gray-100 border border-gray-300 rounded p-2">
                          ⏱️ This request expired after 48 hours without response
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
