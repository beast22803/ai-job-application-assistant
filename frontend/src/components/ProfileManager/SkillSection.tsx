"use client";

import React, { useState } from "react";
import type { MasterSkill } from "@/types";

interface SkillSectionProps {
  skills: MasterSkill[];
  onSave: (data: Partial<MasterSkill>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const emptyForm: Partial<MasterSkill> = {
  category: "",
  name: "",
  proficiency: 3,
};

export default function SkillSection({ skills, onSave, onDelete }: SkillSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<MasterSkill>>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  // Group by category
  const grouped = skills.reduce<Record<string, MasterSkill[]>>((acc, skill) => {
    const cat = skill.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  // Unique categories for suggestions
  const categories = Object.keys(grouped);

  const handleSubmit = async () => {
    if (!form.name?.trim() || !form.category?.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      setShowForm(false);
      setForm({ ...emptyForm });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {skills.length === 0 && !showForm && (
        <div className="bg-[#0C0C0C] border border-[#222222] border-dashed rounded-xl p-12 text-center">
          <div className="text-[#8E8E93] text-sm mb-4">No skills added yet. Add your technical and professional skills.</div>
          <button onClick={() => setShowForm(true)} className="bg-[#F5F5F5] text-[#050505] hover:bg-[#FF4500] hover:text-[#F5F5F5] px-5 py-2.5 rounded-lg font-mono text-[10px] font-semibold tracking-wider uppercase transition-all">
            + Add Skill
          </button>
        </div>
      )}

      {Object.entries(grouped).map(([category, catSkills]) => (
        <div key={category} className="bg-[#0C0C0C] border border-[#222222] rounded-xl p-6">
          <h4 className="font-mono text-[10px] tracking-widest uppercase text-[#8E8E93] mb-4">{category}</h4>
          <div className="flex flex-wrap gap-2">
            {catSkills.map((skill) => (
              <div
                key={skill.id}
                className="group/skill relative flex items-center gap-2 bg-[#111111] border border-[#222222] px-3 py-1.5 rounded-full transition-all hover:border-[#333333]"
              >
                <span className="text-sm text-[#F5F5F5]">{skill.name}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((dot) => (
                    <div
                      key={dot}
                      className={`w-1.5 h-1.5 rounded-full ${
                        dot <= skill.proficiency ? "bg-[#FF4500]" : "bg-[#222222]"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => onDelete(skill.id)}
                  className="opacity-0 group-hover/skill:opacity-100 text-[#FF453A] hover:text-[#FF453A]/80 text-[10px] font-mono transition-all ml-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showForm && (
        <div className="bg-[#0C0C0C] border border-[#FF4500]/30 rounded-xl p-6 space-y-4 animate-[fadeIn_0.35s_cubic-bezier(0.16,1,0.3,1)_both]">
          <h4 className="font-mono text-[10px] tracking-widest uppercase text-[#FF4500]">New Skill</h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] tracking-widest uppercase text-[#8E8E93]">Category</label>
              <input
                value={form.category || ""}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                list="skill-categories"
                className="bg-[#111111] border border-[#222222] focus:border-[#FF4500] rounded-lg outline-none px-3 py-2 text-sm text-[#F5F5F5] transition-all"
                placeholder="e.g. Languages, Frameworks"
              />
              <datalist id="skill-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] tracking-widest uppercase text-[#8E8E93]">Skill Name</label>
              <input
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-[#111111] border border-[#222222] focus:border-[#FF4500] rounded-lg outline-none px-3 py-2 text-sm text-[#F5F5F5] transition-all"
                placeholder="e.g. React, Python"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] tracking-widest uppercase text-[#8E8E93]">Proficiency</label>
              <div className="flex items-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setForm({ ...form, proficiency: level })}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      level <= (form.proficiency || 0)
                        ? "bg-[#FF4500] border-[#FF4500]"
                        : "bg-transparent border-[#222222] hover:border-[#FF4500]"
                    }`}
                  />
                ))}
                <span className="text-[10px] font-mono text-[#8E8E93] ml-1">{form.proficiency}/5</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg font-mono text-[10px] font-semibold tracking-wider uppercase text-[#8E8E93] hover:text-[#F5F5F5] transition-all border border-[#222222] hover:border-[#333333]">Cancel</button>
            <button onClick={handleSubmit} disabled={saving} className="bg-[#F5F5F5] text-[#050505] hover:bg-[#FF4500] hover:text-[#F5F5F5] px-5 py-2 rounded-lg font-mono text-[10px] font-semibold tracking-wider uppercase transition-all disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {skills.length > 0 && !showForm && (
        <button onClick={() => setShowForm(true)} className="w-full border border-dashed border-[#222222] hover:border-[#FF4500] text-[#8E8E93] hover:text-[#FF4500] rounded-xl py-3 font-mono text-[10px] tracking-wider uppercase transition-all">
          + Add Skill
        </button>
      )}
    </div>
  );
}
