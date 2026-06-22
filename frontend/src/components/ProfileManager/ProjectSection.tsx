"use client";

import React, { useState } from "react";
import type { MasterProject } from "@/types";
import ProfileCard from "./ProfileCard";

interface ProjectSectionProps {
  projects: MasterProject[];
  onSave: (data: Partial<MasterProject>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const emptyForm: Partial<MasterProject> = {
  name: "",
  description: "",
  technologies: [],
  url: "",
  highlights: [],
};

export default function ProjectSection({ projects, onSave, onDelete }: ProjectSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<MasterProject>>({ ...emptyForm });
  const [newHighlight, setNewHighlight] = useState("");
  const [newTech, setNewTech] = useState("");
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setForm({ ...emptyForm, technologies: [], highlights: [] });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (proj: MasterProject) => {
    setForm({ ...proj });
    setEditingId(proj.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name?.trim()) return;
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
      {projects.length === 0 && !showForm && (
        <div className="bg-[#0C0C0C] border border-[#222222] border-dashed rounded-xl p-12 text-center">
          <div className="text-[#8E8E93] text-sm mb-4">No projects added yet. Showcase your best work here.</div>
          <button onClick={openAdd} className="bg-[#F5F5F5] text-[#050505] hover:bg-[#FF4500] hover:text-[#F5F5F5] px-5 py-2.5 rounded-lg font-mono text-[10px] font-semibold tracking-wider uppercase transition-all">
            + Add Project
          </button>
        </div>
      )}

      {projects.map((proj) => (
        <ProfileCard key={proj.id} onEdit={() => openEdit(proj)} onDelete={() => onDelete(proj.id)}>
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between pr-14 sm:pr-16">
              <div>
                <h4 className="text-[#F5F5F5] font-semibold text-base">{proj.name}</h4>
                {proj.url && (
                  <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-[#FF4500] text-xs font-mono hover:underline break-all">{proj.url}</a>
                )}
              </div>
            </div>
            {proj.description && <p className="text-[#8E8E93] text-sm mt-1">{proj.description}</p>}
            {proj.highlights.length > 0 && (
              <ul className="list-disc list-inside text-sm text-[#8E8E93] mt-1 space-y-0.5">
                {proj.highlights.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            )}
            {proj.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {proj.technologies.map((t, i) => (
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
            {editingId ? "Edit Project" : "New Project"}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] tracking-widest uppercase text-[#8E8E93]">Project Name</label>
              <input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#111111] border border-[#222222] focus:border-[#FF4500] rounded-lg outline-none px-3 py-2 text-sm text-[#F5F5F5] transition-all" placeholder="e.g. Portfolio Website" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] tracking-widest uppercase text-[#8E8E93]">URL</label>
              <input value={form.url || ""} onChange={(e) => setForm({ ...form, url: e.target.value })} className="bg-[#111111] border border-[#222222] focus:border-[#FF4500] rounded-lg outline-none px-3 py-2 text-sm text-[#F5F5F5] transition-all" placeholder="https://github.com/..." />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] tracking-widest uppercase text-[#8E8E93]">Description</label>
            <textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="bg-[#111111] border border-[#222222] focus:border-[#FF4500] rounded-lg outline-none px-3 py-2 text-sm text-[#F5F5F5] transition-all" placeholder="What does this project do?" />
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
              <input value={newHighlight} onChange={(e) => setNewHighlight(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addHighlight()} className="flex-1 bg-[#111111] border border-[#222222] focus:border-[#FF4500] rounded-lg outline-none px-3 py-2 text-sm text-[#F5F5F5] transition-all" placeholder="Add a highlight..." />
              <button onClick={addHighlight} className="px-3 py-2 bg-[#111111] border border-[#222222] hover:border-[#FF4500] text-[#8E8E93] hover:text-[#FF4500] rounded-lg text-xs font-mono transition-all">+</button>
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

      {projects.length > 0 && !showForm && (
        <button onClick={openAdd} className="w-full border border-dashed border-[#222222] hover:border-[#FF4500] text-[#8E8E93] hover:text-[#FF4500] rounded-xl py-3 font-mono text-[10px] tracking-wider uppercase transition-all">
          + Add Project
        </button>
      )}
    </div>
  );
}
