import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getTicket, updateTicket, addNote } from "../services/api";
import PriorityBadge from "../components/PriorityBadge";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatDate, getSlaStatus } from "../services/dateUtils";

const STATUSES = ["Open", "In Progress", "Closed"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

export default function TicketDetailPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(() => new Date());

  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [noteError, setNoteError] = useState(null);

  const justCreated = location.state?.created;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchTicket() {
      setLoading(true);
      setError(null);
      try {
        const data = await getTicket(ticketId);
        setTicket(data);
        setSelectedStatus(data.status);
        setSelectedPriority(data.priority);
      } catch (err) {
        if (err.message.includes("not found") || err.message.includes("404")) {
          setError(`Ticket ${ticketId} not found.`);
        } else {
          setError("Unable to load ticket. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchTicket();
  }, [ticketId]);

  async function handleSaveChanges() {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const updated = await updateTicket(ticketId, {
        status: selectedStatus,
        priority: selectedPriority,
      });
      setTicket((prev) => ({ ...prev, ...updated }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddNote(e) {
    e.preventDefault();
    if (!noteText.trim()) return;

    setAddingNote(true);
    setNoteError(null);

    try {
      const newNote = await addNote(ticketId, noteText.trim());
      setTicket((prev) => ({ ...prev, notes: [...(prev.notes || []), newNote] }));
      setNoteText("");
    } catch (err) {
      setNoteError(err.message || "Failed to add note.");
    } finally {
      setAddingNote(false);
    }
  }

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><LoadingSpinner message="Loading ticket..." /></div>;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
          {error}
        </div>
        <button onClick={() => navigate("/")} className="text-sm text-blue-600 hover:underline">
          ← Back to tickets
        </button>
      </div>
    );
  }

  const sla = getSlaStatus(ticket, now);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate("/")}
        className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-6"
      >
        ← Back to tickets
      </button>

      {justCreated && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm mb-6">
          ✓ Ticket <strong>{ticket.ticket_id}</strong> created successfully!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="px-6 py-5 border-b border-slate-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-400 font-mono mb-1">{ticket.ticket_id}</p>
                  <h1 className="text-xl font-semibold text-slate-800">{ticket.subject}</h1>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <PriorityBadge priority={ticket.priority} />
                  <StatusBadge status={ticket.status} />
                </div>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Customer</p>
                  <p className="text-sm font-medium text-slate-800">{ticket.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Email</p>
                  <p className="text-sm text-slate-600">{ticket.customer_email}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Created</p>
                  <p className="text-sm text-slate-600">{formatDate(ticket.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Last Updated</p>
                  <p className="text-sm text-slate-600">{formatDate(ticket.updated_at)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">SLA</p>
                  <p className={`text-sm font-semibold ${sla.overdue ? "text-red-600" : sla.tone === "resolved" ? "text-slate-400" : "text-amber-600"}`}>
                    {sla.label}
                  </p>
                  {ticket.sla_due_at && ticket.status !== "Closed" && (
                    <p className="text-xs text-slate-400 mt-1">Due {formatDate(ticket.sla_due_at)}</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="px-6 py-5 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-800">
                Internal Notes
                <span className="ml-2 text-xs font-normal text-slate-400">
                  ({ticket.notes?.length || 0})
                </span>
              </h2>
            </div>

            <div className="px-6 py-5 space-y-4">
              {ticket.notes && ticket.notes.length > 0 ? (
                <div className="space-y-3">
                  {ticket.notes.map((note) => (
                    <div key={note.id} className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                      <p className="text-sm text-slate-700 leading-relaxed">{note.note_text}</p>
                      <p className="text-xs text-slate-400 mt-2">{formatDate(note.created_at)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No notes yet.</p>
              )}

              <form onSubmit={handleAddNote} className="pt-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Add internal note
                </label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  placeholder="Type your note here..."
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                {noteError && (
                  <p className="text-xs text-red-600 mt-1">{noteError}</p>
                )}
                <button
                  type="submit"
                  disabled={addingNote || !noteText.trim()}
                  className="mt-2 bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingNote ? "Adding..." : "Add Note"}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-800">Update Ticket</h2>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Priority
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {saveSuccess && (
                <p className="text-xs text-green-600 font-medium">✓ Changes saved successfully.</p>
              )}
              {saveError && (
                <p className="text-xs text-red-600">{saveError}</p>
              )}

              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="w-full bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-5 py-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Quick Info</h3>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Priority</span>
              <PriorityBadge priority={ticket.priority} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Status</span>
              <StatusBadge status={ticket.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Notes</span>
              <span className="text-xs font-semibold text-slate-700">{ticket.notes?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">SLA</span>
              <span className={`text-xs font-semibold ${sla.overdue ? "text-red-600" : sla.tone === "resolved" ? "text-slate-400" : "text-amber-600"}`}>
                {sla.label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
