"use client";

import React, { useState } from "react";
import type { MasterExperience } from "@/types";
import ProfileCard from "./ProfileCard";

interface ExperienceSectionProps {
  experiences: MasterExperience[];
  onSave: (data: Partial<MasterExperience>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const emptyForm: Partial<MasterExperience> = {
  title: "",
  company: "",
  start_date: "",
  end_date: "",
  is_current: false,
  description: "",
  bullets: [],
  technologies: [],
};

export default function ExperienceSection({ experiences, onSave, onDelete }: ExperienceSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<MasterExperience>>({ ...emptyForm });
  const [newBullet, setNewBullet] = useState("");
  const [newTech, setNewTech] = useState("");
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setForm({ ...emptyForm, bullets: [], technologies: [] });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (exp: MasterExperience) => {
    setForm({ ...exp });
    setEditingId(exp.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.title?.trim() || !form.company?.trim()) return;
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

  const addBullet = () => {
    if (!newBullet.trim()) return;
    setForm((f) => ({ ...f, bullets: [...(f.bullets || []), newBullet.trim()] }));
    setNewBullet("");
  };

  const removeBullet = (idx: number) => {
    setForm((f) => ({ ...f, bullets: (f.bullets || []).filter((_, i) => i !== idx) }));
  };

  const addTech = (e?: React.KeyboardEvent) => {
    if (e && e.key !== "Enter") return;
    if (!newTech.trim()) return;
    if (!(form.technologies || []).includes(newTech.trim())) {
      setForm((f) => ({ ...f, technologies: [...(f.technologies || []), newTech.trim()] }));
    }
    setNewTech("");
  };

  const removeTech = (idx: number) => {
    setForm((f) => ({ ...f, technologies: (f.technologies || []).filter((_, i) => i !== idx) }));
  };

  return (
    <div className="space-y-4">
      {experiences.length === 0 && !showForm && (
        <div className="bg-[#0C0C0C] border border-[#222222] border-dashed rounded-xl p-12 text-center">
          <div className="text-[#8E8E93] text-sm mb-4">No experiences added yet. Start building your career timeline.</div>
          <button onClick={openAdd} className="bg-[#F5F5F5] text-[#050505] hover:bg-[#FF4500] hover:text-[#F5F5F5] px-5 py-2.5 rounded-lg font-mono text-[10px] font-semibold tracking-wider uppercase transition-all">
            + Add Experience
          </button>
        </div>
      )}

      {experiences.map((exp) => (
        <ProfileCard key={exp.id} onEdit={() => openEdit(exp)} onDelete={() => onDelete(exp.id)}>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between pr-14 sm:pr-16 gap-1 sm:gap-4">
              <div>
                <h4 className="text-[#F5F5F5] font-semibold text-base">{exp.title}</h4>
                <p className="text-[#8E8E93] text-sm">{exp.company}</p>
              </div>
              <div className="font-mono text-[10px] text-[#8E8E93] tracking-widest uppercase sm:whitespace-nowrap mt-1 sm:mt-0">
                {exp.start_date} — {exp.is_current ? "Present" : exp.end_date}
              </div>
            </div>
            {exp.description && <p className="text-[#8E8E93] text-sm mt-1">{exp.description}</p>}
            {exp.bullets.length > 0 && (
              <ul className="list-disc list-inside text-sm text-[#8E8E93] mt-1 space-y-0.5">
                {exp.bullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            )}
            {exp.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {exp.technologies.map((t, i) => (
                  <span key={i} className="bg-[#111111] border border-[#222222] px-2 py-0.5 rounded-full text-[10px] font-mono text-[#8E8E93]">{t}</span>
                ))}
              </div>
            )}
          </div>
        </ProfileCard>
      ))}

      {showForm && (
        <div className="bg-[#0C0C0C] border border-[#FF4500]/30 rounded-xl p-6 space-y-4 animate-[fadeIn_0.35s_cubic-bezier(0.16,1,0.3,1)_both]">
          <h4 className="font-mono text-[10px] tracking-widest uppercase text-[#FF4500]">
            {editingId ? "Edit Experience" : "New Experience"}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] tracking-widest uppercase text-[#8E8E93]">Job Title</label>
              <input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-[#111111] border border-[#222222] focus:border-[#FF4500] rounded-lg outline-none px-3 py-2 text-sm text-[#F5F5F5] transition-all" placeholder="e.g. Software Engineer" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] tracking-widest uppercase text-[#8E8E93]">Company</label>
              <input value={form.company || ""} onChange={(e) => setForm({ ...form, company: e.target.value })} className="bg-[#111111] border border-[#222222] focus:border-[#FF4500] rounded-lg outline-none px-3 py-2 text-sm text-[#F5F5F5] transition-all" placeholder="e.g. Google" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] tracking-widest uppercase text-[#8E8E93]">Start Date</label>
              <input value={form.start_date || ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="bg-[#111111] border border-[#222222] focus:border-[#FF4500] rounded-lg outline-none px-3 py-2 text-sm text-[#F5F5F5] transition-all" placeholder="Jan 2023" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] tracking-widest uppercase text-[#8E8E93]">End Date</label>
              <input value={form.end_date || ""} onChange={(e) => setForm({ ...form, end_date: e.target.value })} disabled={form.is_current} className="bg-[#111111] border border-[#222222] focus:border-[#FF4500] rounded-lg outline-none px-3 py-2 text-sm text-[#F5F5F5] transition-all disabled:opacity-40" placeholder="Dec 2024" />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#8E8E93] cursor-pointer py-2">
              <input type="checkbox" checked={form.is_current || false} onChange={(e) => setForm({ ...form, is_current: e.target.checked, end_date: e.target.checked ? "" : form.end_date })} className="accent-[#FF4500]" />
              Current position
            </label>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] tracking-widest uppercase text-[#8E8E93]">Description</label>
            <textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="bg-[#111111] border border-[#222222] focus:border-[#FF4500] rounded-lg outline-none px-3 py-2 text-sm text-[#F5F5F5] transition-all" placeholder="Brief role overview..." />
          </div>

          {/* Bullet points */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] tracking-widest uppercase text-[#8E8E93]">Bullet Points</label>
            {(form.bullets || []).map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex-1 text-sm text-[#8E8E93] bg-[#111111] border border-[#222222] rounded-lg px-3 py-2">• {b}</span>
                <button onClick={() => removeBullet(i)} className="text-[#FF453A] hover:text-[#FF453A]/80 text-xs font-mono transition-all">✕</button>
              </div>
            ))}
            <div className="flex gap-2">
              <input value={newBullet} onChange={(e) => setNewBullet(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addBullet()} className="flex-1 bg-[#111111] border border-[#222222] focus:border-[#FF4500] rounded-lg outline-none px-3 py-2 text-sm text-[#F5F5F5] transition-all" placeholder="Add a bullet point..." />
              <button onClick={addBullet} className="px-3 py-2 bg-[#111111] border border-[#222222] hover:border-[#FF4500] text-[#8E8E93] hover:text-[#FF4500] rounded-lg text-xs font-mono transition-all">+</button>
            </div>
          </div>

          {/* Technologies */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] tracking-widest uppercase text-[#8E8E93]">Technologies</label>
            <div className="flex flex-wrap gap-1.5">
              {(form.technologies || []).map((t, i) => (
                <span key={i} className="bg-[#111111] border border-[#222222] px-2 py-0.5 rounded-full text-[10px] font-mono text-[#8E8E93] flex items-center gap-1">
                  {t}
                  <button onClick={() => removeTech(i)} className="text-[#FF453A] hover:text-[#FF453A]/80 ml-0.5">✕</button>
                </span>
              ))}
            </div>
            <input value={newTech} onChange={(e) => setNewTech(e.target.value)} onKeyDown={(e) => addTech(e)} className="bg-[#111111] border border-[#222222] focus:border-[#FF4500] rounded-lg outline-none px-3 py-2 text-sm text-[#F5F5F5] transition-all" placeholder="Type tech name and press Enter..." />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 rounded-lg font-mono text-[10px] font-semibold tracking-wider uppercase text-[#8E8E93] hover:text-[#F5F5F5] transition-all border border-[#222222] hover:border-[#333333]">Cancel</button>
            <button onClick={handleSubmit} disabled={saving} className="bg-[#F5F5F5] text-[#050505] hover:bg-[#FF4500] hover:text-[#F5F5F5] px-5 py-2 rounded-lg font-mono text-[10px] font-semibold tracking-wider uppercase transition-all disabled:opacity-50">
              {saving ? "Saving..." : editingId ? "Update" : "Save"}
            </button>
          </div>
        </div>
      )}

      {experiences.length > 0 && !showForm && (
        <button onClick={openAdd} className="w-full border border-dashed border-[#222222] hover:border-[#FF4500] text-[#8E8E93] hover:text-[#FF4500] rounded-xl py-3 font-mono text-[10px] tracking-wider uppercase transition-all">
          + Add Experience
        </button>
      )}
    </div>
  );
}
