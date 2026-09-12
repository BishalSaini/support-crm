// Central API service
// All calls to the backend go through here.
// Base URL is read from the VITE_API_URL environment variable,
// which defaults to localhost for development.

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Helper: perform a fetch and throw a clean error if the response is not OK
async function request(method, path, body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);

  if (!response.ok) {
    // Try to parse the backend's error detail, fall back to status text
    let errorMessage = `Request failed: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // ignore JSON parse failure
    }
    throw new Error(errorMessage);
  }

  // 204 No Content — nothing to parse
  if (response.status === 204) return null;

  return response.json();
}

// --- Ticket API calls ---

export function getTickets({ status, search } = {}) {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (search) params.append("search", search);

  const queryString = params.toString();
  const path = `/api/tickets${queryString ? `?${queryString}` : ""}`;
  return request("GET", path);
}

export function getTicket(ticketId) {
  return request("GET", `/api/tickets/${ticketId}`);
}

export function createTicket(ticketData) {
  return request("POST", "/api/tickets", ticketData);
}

export function updateTicket(ticketId, updateData) {
  return request("PUT", `/api/tickets/${ticketId}`, updateData);
}

export function addNote(ticketId, noteText) {
  return request("POST", `/api/tickets/${ticketId}/notes`, { note_text: noteText });
}
