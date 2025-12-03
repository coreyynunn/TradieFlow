"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type JobNote = {
  id: number;
  content: string;
  type: "note" | "progress";
  created_at: string;
};

export default function JobNotesSection({ jobId }: { jobId: number }) {
  const [notes, setNotes] = useState<JobNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState<"note" | "progress">("note");
  const [saving, setSaving] = useState(false);

  // editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("job_notes")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setNotes(data as JobNote[]);
      }
      setLoading(false);
    };

    fetchNotes();
  }, [jobId]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("job_notes")
      .insert({
        job_id: jobId,
        user_id: user.id,
        content: newNote.trim(),
        type: noteType,
      })
      .select("*")
      .single();

    if (!error && data) {
      setNotes((prev) => [data as JobNote, ...prev]);
      setNewNote("");
    }

    setSaving(false);
  };

  const startEditing = (note: JobNote) => {
    setEditingId(note.id);
    setEditingContent(note.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingContent("");
  };

  const saveEditing = async () => {
    if (editingId === null) return;
    const trimmed = editingContent.trim();
    if (!trimmed) return;

    setSaving(true);

    const { error } = await supabase
      .from("job_notes")
      .update({ content: trimmed })
      .eq("id", editingId);

    if (!error) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingId ? { ...n, content: trimmed } : n
        )
      );
      setEditingId(null);
      setEditingContent("");
    }

    setSaving(false);
  };

  return (
    <section className="mt-2">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm font-semibold text-neutral-100">
          Notes & Updates
        </h2>
      </div>

      {/* Add new note */}
      <div className="mb-3">
        <textarea
          className="w-full border border-neutral-800 bg-neutral-900 rounded-md p-2 text-xs text-neutral-100"
          rows={3}
          placeholder="Add a note or progress update..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
        />
        <div className="flex items-center justify-between mt-1">
          <div className="flex gap-2 text-[11px]">
            <button
              type="button"
              className={`px-2 py-1 rounded ${
                noteType === "note"
                  ? "bg-neutral-100 text-neutral-900"
                  : "bg-neutral-800 text-neutral-200"
              }`}
              onClick={() => setNoteType("note")}
            >
              Note
            </button>
            <button
              type="button"
              className={`px-2 py-1 rounded ${
                noteType === "progress"
                  ? "bg-neutral-100 text-neutral-900"
                  : "bg-neutral-800 text-neutral-200"
              }`}
              onClick={() => setNoteType("progress")}
            >
              Progress
            </button>
          </div>
          <button
            type="button"
            onClick={handleAddNote}
            disabled={saving || !newNote.trim()}
            className="px-3 py-1 text-[11px] bg-neutral-100 text-neutral-900 rounded disabled:bg-neutral-700 disabled:text-neutral-400"
          >
            {saving ? "Saving..." : "Add"}
          </button>
        </div>
      </div>

      {/* Existing notes */}
      {loading ? (
        <div className="text-xs text-neutral-500">Loading notes...</div>
      ) : notes.length === 0 ? (
        <div className="text-xs text-neutral-500">
          No notes yet. Use the box above to add your first note.
        </div>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => {
            const isEditing = editingId === note.id;

            return (
              <li
                key={note.id}
                className="border border-neutral-800 rounded-md p-2 text-xs bg-neutral-900 cursor-pointer hover:border-neutral-500 transition"
                onClick={() => {
                  if (!isEditing) startEditing(note);
                }}
              >
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      note.type === "progress"
                        ? "bg-blue-900/50 text-blue-100"
                        : "bg-neutral-800 text-neutral-200"
                    }`}
                  >
                    {note.type === "progress" ? "Progress" : "Note"}
                  </span>
                  <span className="text-[9px] text-neutral-500">
                    {new Date(note.created_at).toLocaleString("en-AU", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>

                {isEditing ? (
                  <div
                    className="mt-1 space-y-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <textarea
                      className="w-full border border-neutral-700 bg-neutral-950 rounded p-1 text-xs text-neutral-100"
                      rows={3}
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        className="px-2 py-0.5 text-[10px] rounded border border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                        onClick={cancelEditing}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="px-2 py-0.5 text-[10px] rounded bg-neutral-100 text-neutral-900 disabled:bg-neutral-700 disabled:text-neutral-400"
                        onClick={saveEditing}
                        disabled={saving || !editingContent.trim()}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-neutral-100">
                    {note.content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
