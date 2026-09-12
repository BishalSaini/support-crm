import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTicket } from "../services/api";

const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CreateTicketPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    subject: "",
    description: "",
    priority: "Medium",
  });

  const [errors, setErrors] = useState({});

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  }

  function validate() {
    const newErrors = {};
    if (!form.customer_name.trim()) newErrors.customer_name = "Customer name is required.";
    if (!form.customer_email.trim()) {
      newErrors.customer_email = "Email is required.";
    } else if (!EMAIL_REGEX.test(form.customer_email)) {
      newErrors.customer_email = "Please enter a valid email address.";
    }
    if (!form.subject.trim()) newErrors.subject = "Subject is required.";
    if (!form.description.trim()) newErrors.description = "Description is required.";
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const newTicket = await createTicket(form);
      navigate(`/tickets/${newTicket.ticket_id}`, { state: { created: true } });
    } catch (err) {
      setServerError(err.message || "Failed to create ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate("/")}
        className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-6"
      >
        ← Back to tickets
      </button>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="px-6 py-5 border-b border-slate-200">
          <h1 className="text-xl font-semibold text-slate-800">Create New Ticket</h1>
          <p className="text-sm text-slate-500 mt-1">
            Fill in the details below. Status will automatically be set to <strong>Open</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5" noValidate>
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {serverError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="customer_name">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              id="customer_name"
              name="customer_name"
              type="text"
              value={form.customer_name}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.customer_name ? "border-red-400 bg-red-50" : "border-slate-300"
              }`}
            />
            {errors.customer_name && (
              <p className="text-xs text-red-600 mt-1">{errors.customer_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="customer_email">
              Customer Email <span className="text-red-500">*</span>
            </label>
            <input
              id="customer_email"
              name="customer_email"
              type="email"
              value={form.customer_email}
              onChange={handleChange}
              placeholder="e.g. john@example.com"
              className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.customer_email ? "border-red-400 bg-red-50" : "border-slate-300"
              }`}
            />
            {errors.customer_email && (
              <p className="text-xs text-red-600 mt-1">{errors.customer_email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="subject">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              value={form.subject}
              onChange={handleChange}
              placeholder="e.g. Unable to login"
              className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.subject ? "border-red-400 bg-red-50" : "border-slate-300"
              }`}
            />
            {errors.subject && (
              <p className="text-xs text-red-600 mt-1">{errors.subject}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="description">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the issue in detail..."
              className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.description ? "border-red-400 bg-red-50" : "border-slate-300"
              }`}
            />
            {errors.description && (
              <p className="text-xs text-red-600 mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="priority">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Choose based on how urgently the customer needs help.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white font-medium text-sm py-3 rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating ticket..." : "Create Ticket"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
