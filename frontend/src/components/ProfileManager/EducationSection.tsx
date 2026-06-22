"use client";

import React, { useState } from "react";
import type { MasterEducation } from "@/types";
import ProfileCard from "./ProfileCard";

interface EducationSectionProps {
  education: MasterEducation[];
  onSave: (data: Partial<MasterEducation>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const emptyForm: Partial<MasterEducation> = {
  institution: "",
  degree: "",
  field: "",
  start_date: "",
  end_date: "",
  gpa: "",
  highlights: [],
};

export default function EducationSection({ education, onSave, onDelete }: EducationSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<MasterEducation>>({ ...emptyForm });
  const [newHighlight, setNewHighlight] = useState("");
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setForm({ ...emptyForm, highlights: [] });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (edu: MasterEducation) => {
    setForm({ ...edu });
    setEditingId(edu.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.institution?.trim() || !form.degree?.trim()) return;
    setSaving(true);
    try {
      await onSave(editingId ? { ...form, id: editingId } : form);
      setShowForm(false);
      setForm({ ...emptyForm });
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const addHighlight = () => {
    if (!newHighlight.trim()) return;
    setForm((f) => ({ ...f, highlights: [...(f.highlights || []), newHighlight.trim()] }));
    setNewHighlight("");
  };

  const removeHighlight = (idx: number) => {
    setForm((f) => ({ ...f, highlights: (f.highlights || []).filter((_, i) => i !== idx) }));
  };

  return (
    <div className="space-y-4">
      {education.length === 0 && !showForm && (
        <div className="bg-[#0C0C0C] border border-[#222222] border-dashed rounded-xl p-12 text-center">
          <div className="text-[#8E8E93] text-sm mb-4">No education added yet. Add your academic background.</div>
          <button onClick={openAdd} className="bg-[#F5F5F5] text-[#050505] hover:bg-[#FF4500] hover:text-[#F5F5F5] px-5 py-2.5 rounded-lg font-mono text-[10px] font-semibold tracking-wider uppercase transition-all">
            + Add Education
          </button>
        </div>
      )}

      {education.map((edu) => (
        <ProfileCard key={edu.id} onEdit={() => openEdit(edu)} onDelete={() => onDelete(edu.id)}>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between pr-14 sm:pr-16 gap-1 sm:gap-4">
              <div>
                <h4 className="text-[#F5F5F5] font-semibold text-base">{edu.degree} in {edu.field}</h4>
                <p className="text-[#8E8E93] text-sm">{edu.institution}</p>
              </div>
              <div className="sm:text-right">
                <div className="font-mono text-[10px] text-[#8E8E93] tracking-widest uppercase sm:whitespace-nowrap mt-1 sm:mt-0">
                  {edu.start_date} — {edu.end_date}
                </div>
                {edu.gpa && (
                  <div className="font-mono text-[10px] text-[#FF4500] mt-1">GPA: {edu.gpa}</div>
                )}
              </div>
            </div>
            {edu.highlights.length > 0 && (
              <ul className="list-disc list-inside text-sm text-[#8E8E93] mt-1 space-y-0.5">
                {edu.highlights.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            )}
          </div>
        </ProfileCard>
      ))}

      {showForm && (
        <div className="bg-[#0C0C0C] border border-[#FF4500]/30 rounded-xl p-6 space-y-4 animate-[fadeIn_0.35s_cubic-bezier(0.16,1,0.3,1)_both]">
          <h4 className="font-mono text-[10px] tracking-widest uppercase text-[#FF4500]">
            {editingId ? "Edit Education" : "New Education"}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] tracking-widest uppercase text-[#8E8E93]">Institution</label>
              <input value={form.institution || ""} onChange={(e) => setForm({ ...form, institution: e.target.value })} className="bg-[#111111] border border-[#222222] focus:border-[#FF4500] rounded-lg outline-none px-3 py-2 text-sm text-[#F5F5F5] transition-all" placeholder="e.g. MIT" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] tracking-widest uppercase text-[#8E8E93]">Degree</label>
              <input value={form.degree || ""} onChange={(e) => setForm({ ...form, degree: e.target.value })} className="bg-[#111111] border border-[#222222] focus:border-[#FF4500] rounded-lg outline-none px-3 py-2 text-sm text-[#F5F5F5] transition-all" placeholder="e.g. Bachelor of Science" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] tracking-widest uppercase text-[#8E8E93]">Field of Study</label>
              <input value={form.field || ""} onChange={(e) => setForm({ ...form, field: e.target.value })} className="bg-[#111111] border border-[#222222] focus:border-[#FF4500] rounded-lg outline-none px-3 py-2 text-sm text-[#F5F5F5] transition-all" placeholder="e.g. Computer Science" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] tracking-widest uppercase text-[#8E8E93]">Start Date</label>
              <input value={form.start_date || ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="bg-[#111111] border border-[#222222] focus:border-[#FF4500] rounded-lg outline-none px-3 py-2 text-sm text-[#F5F5F5] transition-all" placeholder="Aug 2020" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] tracking-widest uppercase text-[#8E8E93]">End Date</label>
              <input value={form.end_date || ""} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="bg-[#111111] border border-[#222222] focus:border-[#FF4500] rounded-lg outline-none px-3 py-2 text-sm text-[#F5F5F5] transition-all" placeholder="May 2024" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] tracking-widest uppercase text-[#8E8E93]">GPA (optional)</label>
            <input value={form.gpa || ""} onChange={(e) => setForm({ ...form, gpa: e.target.value })} className="bg-[#111111] border border-[#222222] focus:border-[#FF4500] rounded-lg outline-none px-3 py-2 text-sm text-[#F5F5F5] transition-all w-32" placeholder="e.g. 3.9" />
          </div>

          {/* Highlights */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] tracking-widest uppercase text-[#8E8E93]">Highlights</label>
            {(form.highlights || []).map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex-1 text-sm text-[#8E8E93] bg-[#111111] border border-[#222222] rounded-lg px-3 py-2">• {h}</span>
                <button onClick={() => removeHighlight(i)} className="text-[#FF453A] hover:text-[#FF453A]/80 text-xs font-mono transition-all">✕</button>
              </div>
            ))}
            <div className="flex gap-2">
              <input value={newHighlight} onChange={(e) => setNewHighlight(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addHighlight()} className="flex-1 bg-[#111111] border border-[#222222] focus:border-[#FF4500] rounded-lg outline-none px-3 py-2 text-sm text-[#F5F5F5] transition-all" placeholder="Add an achievement or highlight..." />
              <button onClick={addHighlight} className="px-3 py-2 bg-[#111111] border border-[#222222] hover:border-[#FF4500] text-[#8E8E93] hover:text-[#FF4500] rounded-lg text-xs font-mono transition-all">+</button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 rounded-lg font-mono text-[10px] font-semibold tracking-wider uppercase text-[#8E8E93] hover:text-[#F5F5F5] transition-all border border-[#222222] hover:border-[#333333]">Cancel</button>
            <button onClick={handleSubmit} disabled={saving} className="bg-[#F5F5F5] text-[#050505] hover:bg-[#FF4500] hover:text-[#F5F5F5] px-5 py-2 rounded-lg font-mono text-[10px] font-semibold tracking-wider uppercase transition-all disabled:opacity-50">
              {saving ? "Saving..." : editingId ? "Update" : "Save"}
            </button>
          </div>
        </div>
      )}

      {education.length > 0 && !showForm && (
        <button onClick={openAdd} className="w-full border border-dashed border-[#222222] hover:border-[#FF4500] text-[#8E8E93] hover:text-[#FF4500] rounded-xl py-3 font-mono text-[10px] tracking-wider uppercase transition-all">
          + Add Education
        </button>
      )}
    </div>
  );
}
