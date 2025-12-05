"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabaseClient";

type Invoice = {
  id: number | string;
  user_id: string;
  client_id: string | null;
  quote_id?: string | null;
  status: string | null;
  issue_date: string | null;
  due_date: string | null;
  subtotal: number | null;
  gst: number | null;
  total: number | null;
  amount_paid: number | null;
  items: any[] | null;
  created_at: string | null;
  notes: string | null;
  title: string | null;
};

type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

type EditableItem = {
  description: string;
  quantity: string;
  unit_price: string;
};

function formatCurrency(value: number | string | null | undefined) {
  const num = Number(value ?? 0) || 0;
  return num.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
  });
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable form state
  const [editTitle, setEditTitle] = useState("");
  const [editStatus, setEditStatus] = useState("draft");
  const [editIssueDate, setEditIssueDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editItems, setEditItems] = useState<EditableItem[]>([]);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!user) {
          router.replace("/auth/login");
          return;
        }

        const { data: invData, error: invError } = await supabase
          .from("invoices")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (invError) throw invError;
        if (!invData) {
          setError("Invoice not found.");
          setLoading(false);
          return;
        }

        const inv = invData as Invoice;
        setInvoice(inv);

        // Load client
        if (inv.client_id) {
          const { data: clientData, error: clientError } = await supabase
            .from("clients")
            .select("id, name, email, phone")
            .eq("id", inv.client_id)
            .maybeSingle();

          if (clientError) throw clientError;
          setClient(clientData as Client);
        }

        // Prepare edit state
        const rawItems = (inv.items || []) as any[];
        const editableItems: EditableItem[] = rawItems.map((item: any) => {
          const qty =
            item.quantity ??
            item.qty ??
            item.q ??
            0;
          const unitPrice =
            item.unit_price ??
            item.unitPrice ??
            item.price ??
            0;

          return {
            description: item.description ?? "",
            quantity: String(qty ?? 0),
            unit_price: String(unitPrice ?? 0),
          };
        });

        if (editableItems.length === 0) {
          editableItems.push({
            description: "",
            quantity: "1",
            unit_price: "",
          });
        }

        setEditTitle(inv.title || "");
        setEditStatus((inv.status || "draft").toLowerCase());
        setEditIssueDate(
          inv.issue_date ? inv.issue_date.slice(0, 10) : ""
        );
        setEditDueDate(inv.due_date ? inv.due_date.slice(0, 10) : "");
        setEditNotes(inv.notes || "");
        setEditItems(editableItems);
      } catch (e: any) {
        console.error("Invoice detail load error", e);
        setError("Failed to load invoice.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, router]);

  const normalizedItems = useMemo(() => {
    return editItems.map((item) => {
      const qty = Number(item.quantity || 0) || 0;
      const price = Number(item.unit_price || 0) || 0;
      const lineTotal = qty * price;

      return {
        description: item.description,
        quantity: qty,
        unit_price: price,
        total: lineTotal,
      };
    });
  }, [editItems]);

  const computedSubtotal = useMemo(
    () => normalizedItems.reduce((sum, item) => sum + (item.total || 0), 0),
    [normalizedItems]
  );

  const computedGst = useMemo(
    () => computedSubtotal * 0.1,
    [computedSubtotal]
  );

  const computedTotal = useMemo(
    () => computedSubtotal + computedGst,
    [computedSubtotal, computedGst]
  );

  const getStatusStyles = (status: string | null | undefined) => {
    const raw = (status || "draft").toLowerCase();
    let statusLabel = raw.toUpperCase();
    let statusColor = "text-neutral-300";
    let badgeBg = "bg-neutral-900 border-neutral-700";

    if (raw === "sent") {
      statusColor = "text-blue-200";
      badgeBg = "bg-blue-900/40 border-blue-500/60";
    } else if (raw === "paid") {
      statusColor = "text-emerald-200";
      badgeBg = "bg-emerald-900/40 border-emerald-500/60";
    } else if (raw === "overdue") {
      statusColor = "text-red-200";
      badgeBg = "bg-red-900/40 border-red-500/60";
    } else if (raw === "cancelled") {
      statusColor = "text-neutral-300";
      badgeBg = "bg-neutral-900/60 border-neutral-600";
    }

    return { statusLabel, statusColor, badgeBg };
  };

  const handleAddItem = () => {
    setEditItems((prev) => [
      ...prev,
      { description: "", quantity: "1", unit_price: "" },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof EditableItem,
    value: string
  ) => {
    setEditItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const startEditing = () => {
    if (!invoice) return;
    setEditing(true);
  };

  const cancelEditing = () => {
    if (!invoice) {
      setEditing(false);
      return;
    }

    // Reset fields back to invoice values
    setEditTitle(invoice.title || "");
    setEditStatus((invoice.status || "draft").toLowerCase());
    setEditIssueDate(
      invoice.issue_date ? invoice.issue_date.slice(0, 10) : ""
    );
    setEditDueDate(
      invoice.due_date ? invoice.due_date.slice(0, 10) : ""
    );
    setEditNotes(invoice.notes || "");

    const rawItems = (invoice.items || []) as any[];
    const editableItems: EditableItem[] = rawItems.map((item: any) => {
      const qty =
        item.quantity ??
        item.qty ??
        item.q ??
        0;
      const unitPrice =
        item.unit_price ??
        item.unitPrice ??
        item.price ??
        0;

      return {
        description: item.description ?? "",
        quantity: String(qty ?? 0),
        unit_price: String(unitPrice ?? 0),
      };
    });

    if (editableItems.length === 0) {
      editableItems.push({
        description: "",
        quantity: "1",
        unit_price: "",
      });
    }

    setEditItems(editableItems);
    setEditing(false);
    setError(null);
  };

  const saveChanges = async () => {
    if (!invoice) return;
    setSaving(true);
    setError(null);

    try {
      const statusLower = (editStatus || "draft").toLowerCase();

      // Do we actually have meaningful line items?
      const hasLineItems = normalizedItems.some((item) => {
        return (
          (item.description && item.description.trim().length > 0) ||
          item.quantity > 0 ||
          item.unit_price > 0
        );
      });

      // Base payload: meta fields only
      const payload: any = {
        title: editTitle || null,
        status: statusLower,
        issue_date: editIssueDate || null,
        due_date: editDueDate || null,
        notes: editNotes || null,
      };

      // Start from existing DB total
      let effectiveTotal = Number(invoice.total ?? 0);

      // Only overwrite items + totals if there are real line items
      if (hasLineItems) {
        payload.items = normalizedItems;
        payload.subtotal = computedSubtotal;
        payload.gst = computedGst;
        payload.total = computedTotal;
        effectiveTotal = computedTotal;
      }

      // If marking as PAID, set amount_paid sensibly
      if (statusLower === "paid") {
        const existingPaid = Number(invoice.amount_paid ?? 0);
        payload.amount_paid =
          existingPaid > 0 ? existingPaid : effectiveTotal;
      }

      const { data, error: updateError } = await supabase
        .from("invoices")
        .update(payload)
        .eq("id", invoice.id)
        .select("*")
        .maybeSingle();

      if (updateError) throw updateError;

      const updated = data as Invoice;

      setInvoice(updated);
      setEditing(false);
    } catch (e: any) {
      console.error("Update invoice error", e);
      setError(e?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-neutral-400 text-sm">Loading invoice…</div>
      </DashboardLayout>
    );
  }

  if (error && !invoice) {
    return (
      <DashboardLayout>
        <div className="max-w-md">
          <div className="bg-red-950/40 border border-red-500/40 text-red-200 text-xs px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
          <button
            type="button"
            onClick={() => router.push("/invoices")}
            className="mt-2 text-xs text-neutral-400 hover:text-neutral-200"
          >
            Back to invoices
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="text-neutral-400 text-sm">
          Invoice not found.
        </div>
      </DashboardLayout>
    );
  }

  const { statusLabel, statusColor, badgeBg } = getStatusStyles(
    invoice.status
  );

  const displayTitle =
    invoice.title || `Invoice #${String(invoice.id)}`;

  const displaySubtotal =
    editing ? computedSubtotal : invoice.subtotal ?? 0;
  const displayGst = editing ? computedGst : invoice.gst ?? 0;
  const displayTotal = editing ? computedTotal : invoice.total ?? 0;

  const itemsToRender = editing
    ? normalizedItems
    : ((invoice.items || []) as any[]).map((item: any) => {
        const qty =
          item.quantity ??
          item.qty ??
          item.q ??
          0;
        const unitPrice =
          item.unit_price ??
          item.unitPrice ??
          item.price ??
          0;
        const lineTotal =
          item.total ?? qty * unitPrice ?? 0;

        return {
          description: item.description ?? "",
          quantity: qty,
          unit_price: unitPrice,
          total: lineTotal,
        };
      });

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.push("/invoices")}
              className="text-[11px] text-neutral-500 hover:text-neutral-300 mb-1"
            >
              ← Back to invoices
            </button>
            {editing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-xl font-semibold text-neutral-50 bg-transparent border-b border-neutral-700 focus:outline-none focus:border-blue-500 pb-1"
                placeholder="Invoice title"
              />
            ) : (
              <h1 className="text-xl font-semibold text-neutral-50">
                {displayTitle}
              </h1>
            )}
            <p className="text-xs text-neutral-500">
              Invoice ID #{String(invoice.id)}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {!editing ? (
              <>
                <div
                  className={`px-3 py-1 rounded-full border text-[10px] uppercase tracking-wide ${badgeBg} ${statusColor}`}
                >
                  {statusLabel}
                </div>
                <button
                  type="button"
                  onClick={startEditing}
                  className="rounded-full border border-neutral-600 bg-neutral-900 px-3 py-1 text-[11px] text-neutral-100 hover:border-blue-500 hover:text-blue-200"
                >
                  Edit invoice
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="rounded-full border border-neutral-600 bg-neutral-900 px-3 py-1 text-[11px] text-neutral-200 hover:border-neutral-400 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveChanges}
                  disabled={saving}
                  className="rounded-full border border-blue-500/70 bg-blue-600/80 px-3 py-1 text-[11px] text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-500/40 text-red-200 text-xs px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Top Row: Client + Meta */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-1">
            <h2 className="text-xs font-semibold text-neutral-300 mb-1">
              Billed to
            </h2>
            {client ? (
              <>
                <p className="text-sm text-neutral-100">{client.name}</p>
                {client.email && (
                  <p className="text-xs text-neutral-400">
                    {client.email}
                  </p>
                )}
                {client.phone && (
                  <p className="text-xs text-neutral-400">
                    {client.phone}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-neutral-400">
                No client details found.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2 text-xs text-neutral-300">
            <div className="flex justify-between items-center">
              <span>Issue date</span>
              {editing ? (
                <input
                  type="date"
                  value={editIssueDate}
                  onChange={(e) => setEditIssueDate(e.target.value)}
                  className="bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-[11px] text-neutral-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <span className="text-neutral-100">
                  {formatDate(invoice.issue_date)}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span>Due date</span>
              {editing ? (
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-[11px] text-neutral-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <span className="text-neutral-100">
                  {formatDate(invoice.due_date)}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span>Status</span>
              {editing ? (
                <select
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(e.target.value)
                  }
                  className="bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-[11px] text-neutral-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              ) : (
                <span className="text-neutral-100">
                  {statusLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-neutral-300">
              Line items
            </h2>
            {editing && (
              <button
                type="button"
                onClick={handleAddItem}
                className="text-[11px] text-blue-400 hover:text-blue-300"
              >
                + Add item
              </button>
            )}
          </div>

          {itemsToRender.length === 0 ? (
            <p className="text-xs text-neutral-400">
              No line items stored on this invoice.
            </p>
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,0.6fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] text-[11px] text-neutral-400 mb-1">
                <span>Description</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Unit price</span>
                <span className="text-right">Total</span>
              </div>
              <div className="border-t border-neutral-800" />

              {editing
                ? editItems.map((item, index) => {
                    const qtyNum =
                      Number(item.quantity || 0) || 0;
                    const priceNum =
                      Number(item.unit_price || 0) || 0;
                    const lineTotal = qtyNum * priceNum;

                    return (
                      <div
                        key={index}
                        className="grid grid-cols-[minmax(0,2fr)_minmax(0,0.6fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-2 items-center py-1"
                      >
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          className="bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-[11px] text-neutral-50"
                          placeholder="Description"
                        />
                        <input
                          type="number"
                          min={0}
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "quantity",
                              e.target.value
                            )
                          }
                          className="bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-[11px] text-neutral-50 text-center"
                          placeholder="Qty"
                        />
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "unit_price",
                              e.target.value
                            )
                          }
                          className="bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-[11px] text-neutral-50 text-right"
                          placeholder="Unit price"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-neutral-100 text-right flex-1">
                            {lineTotal > 0
                              ? formatCurrency(lineTotal)
                              : "-"}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveItem(index)
                            }
                            className="text-[10px] text-red-400 hover:text-red-300 ml-2"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })
                : itemsToRender.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="grid grid-cols-[minmax(0,2fr)_minmax(0,0.6fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] text-[11px] text-neutral-100 py-1"
                    >
                      <span className="pr-2">
                        {item.description || "-"}
                      </span>
                      <span className="text-center text-neutral-300">
                        {item.quantity || "-"}
                      </span>
                      <span className="text-right text-neutral-300">
                        {item.quantity
                          ? formatCurrency(item.unit_price)
                          : "-"}
                      </span>
                      <span className="text-right">
                        {item.total
                          ? formatCurrency(item.total)
                          : "-"}
                      </span>
                    </div>
                  ))}
            </div>
          )}
        </div>

        {/* Notes + Totals */}
        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
            <h2 className="text-xs font-semibold text-neutral-300 mb-2">
              Notes
            </h2>
            {editing ? (
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={5}
                className="w-full rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-xs text-neutral-50 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Payment terms, bank details, etc."
              />
            ) : invoice.notes ? (
              <p className="text-xs text-neutral-200 whitespace-pre-line">
                {invoice.notes}
              </p>
            ) : (
              <p className="text-xs text-neutral-500">
                No notes added for this invoice.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2 text-sm text-neutral-100">
            <div className="flex justify-between text-xs text-neutral-300">
              <span>Subtotal</span>
              <span>{formatCurrency(displaySubtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-neutral-300">
              <span>GST (10%)</span>
              <span>{formatCurrency(displayGst)}</span>
            </div>
            <div className="border-t border-neutral-800 my-2" />
            <div className="flex justify-between text-sm font-semibold text-neutral-50">
              <span>Total</span>
              <span>{formatCurrency(displayTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
