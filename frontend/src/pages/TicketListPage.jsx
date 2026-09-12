import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getTickets } from "../services/api";
import PriorityBadge from "../components/PriorityBadge";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatDate, getSlaStatus } from "../services/dateUtils";

const STATUS_OPTIONS = ["All", "Open", "In Progress", "Closed"];
const SLA_OPTIONS = ["All", "Overdue"];

export default function TicketListPage() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [slaFilter, setSlaFilter] = useState("All");
  const [now, setNow] = useState(() => new Date());

  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter !== "All") params.status = statusFilter;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const data = await getTickets(params);
      setTickets(data);
    } catch (err) {
      setError("Unable to load tickets. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const visibleTickets = slaFilter === "Overdue"
    ? tickets.filter((ticket) => getSlaStatus(ticket, now).overdue)
    : tickets;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Support Tickets</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? "" : `${visibleTickets.length} ticket${visibleTickets.length !== 1 ? "s" : ""} found`}
          </p>
        </div>
        <button
          onClick={() => navigate("/tickets/new")}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 flex items-center gap-2"
        >
          <span>+</span> New Ticket
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by ticket ID, customer, email, or subject..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All Statuses" : s}
            </option>
          ))}
        </select>
        <select
          value={slaFilter}
          onChange={(e) => setSlaFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          {SLA_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "All" ? "All SLA States" : option}
            </option>
          ))}
        </select>
      </div>

      {loading && <LoadingSpinner message="Loading tickets..." />}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && visibleTickets.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="font-medium">No tickets found</p>
          <p className="text-sm mt-1">Try adjusting your search or filter.</p>
        </div>
      )}

      {!loading && !error && visibleTickets.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600">Ticket ID</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600">Customer</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600 hidden md:table-cell">Subject</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600">Priority</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600">SLA</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600 hidden lg:table-cell">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleTickets.map((ticket) => {
                  const sla = getSlaStatus(ticket, now);
                  return (
                  <tr
                    key={ticket.ticket_id}
                    onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}
                    className="hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="px-5 py-4 font-mono font-medium text-blue-600">
                      {ticket.ticket_id}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">{ticket.customer_name}</p>
                      <p className="text-slate-400 text-xs">{ticket.customer_email}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600 max-w-xs truncate hidden md:table-cell">
                      {ticket.subject}
                    </td>
                    <td className="px-5 py-4">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className={`px-5 py-4 text-xs font-medium ${sla.overdue ? "text-red-600" : sla.tone === "resolved" ? "text-slate-400" : "text-amber-600"}`}>
                      {sla.label}
                    </td>
                    <td className="px-5 py-4 text-slate-500 hidden lg:table-cell">
                      {formatDate(ticket.created_at)}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
