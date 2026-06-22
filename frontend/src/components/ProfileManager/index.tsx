"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { MasterProfile, MasterExperience, MasterProject, MasterSkill, MasterEducation } from "@/types";
import * as api from "@/services/api";
import ExperienceSection from "./ExperienceSection";
import ProjectSection from "./ProjectSection";
import SkillSection from "./SkillSection";
import EducationSection from "./EducationSection";

type SectionTab = "experience" | "projects" | "skills" | "education";

const TABS: { key: SectionTab; label: string }[] = [
  { key: "experience", label: "Experience" },
  { key: "projects", label: "Projects" },
  { key: "skills", label: "Skills" },
  { key: "education", label: "Education" },
];

export default function ProfileManager() {
  const [activeSection, setActiveSection] = useState<SectionTab>("experience");
  const [profile, setProfile] = useState<MasterProfile>({
    experiences: [],
    projects: [],
    skills: [],
    education: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await api.getProfile("varshit");
      setProfile(data);
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const totalItems =
    profile.experiences.length +
    profile.projects.length +
    profile.skills.length +
    profile.education.length;

  const sections = [
    { key: "experience" as const, count: profile.experiences.length, color: "#FF4500" },
    { key: "projects" as const, count: profile.projects.length, color: "#FF9F0A" },
    { key: "skills" as const, count: profile.skills.length, color: "#30D158" },
    { key: "education" as const, count: profile.education.length, color: "#5E5CE6" },
  ];

  // ── CRUD handlers ──

  const handleSaveExperience = async (data: Partial<MasterExperience>) => {
    await api.saveProfileItem("varshit", "experience", data);
    await fetchProfile();
  };

  const handleDeleteExperience = async (id: string) => {
    await api.deleteProfileItem("varshit", "experience", id);
    await fetchProfile();
  };

  const handleSaveProject = async (data: Partial<MasterProject>) => {
    await api.saveProfileItem("varshit", "project", data);
    await fetchProfile();
  };

  const handleDeleteProject = async (id: string) => {
    await api.deleteProfileItem("varshit", "project", id);
    await fetchProfile();
  };

  const handleSaveSkill = async (data: Partial<MasterSkill>) => {
    await api.saveProfileItem("varshit", "skill", data);
    await fetchProfile();
  };

  const handleDeleteSkill = async (id: string) => {
    await api.deleteProfileItem("varshit", "skill", id);
    await fetchProfile();
  };

  const handleSaveEducation = async (data: Partial<MasterEducation>) => {
    await api.saveProfileItem("varshit", "education", data);
    await fetchProfile();
  };

  const handleDeleteEducation = async (id: string) => {
    await api.deleteProfileItem("varshit", "education", id);
    await fetchProfile();
  };

  return (
    <div className="animate-[fadeIn_0.35s_cubic-bezier(0.16,1,0.3,1)_both]">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Master Profile</h2>
        <p className="text-[#8E8E93] text-sm">
          Build your career data once. Every analysis will pull from your master profile to generate perfectly tailored resumes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Completeness Bar */}
          <div className="bg-[#0C0C0C] border border-[#222222] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] tracking-widest uppercase text-[#8E8E93]">Profile Completeness</span>
              <span className="font-mono text-[10px] tracking-widest uppercase text-[#F5F5F5]">{totalItems} items</span>
            </div>
            <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-[#111111]">
              {sections.map((sec) => (
                <div
                  key={sec.key}
                  className="transition-all duration-500"
                  style={{
                    flex: sec.count,
                    backgroundColor: sec.count > 0 ? sec.color : "transparent",
                  }}
                />
              ))}
              {totalItems === 0 && (
                <div className="flex-1 bg-[#222222] rounded-full" />
              )}
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-4 mt-3">
              {sections.map((sec) => (
                <div key={sec.key} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sec.color }} />
                  <span className="font-mono text-[10px] text-[#8E8E93] capitalize">{sec.key} ({sec.count})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tab Bar */}
          <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible scrollbar-hide bg-[#111111] p-1 rounded-md border border-[#222222] gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key)}
                className={`flex-1 lg:flex-none text-left min-w-[100px] font-mono text-[10px] font-semibold tracking-wider uppercase px-4 py-3 lg:py-4 rounded-sm transition-all ${
                  activeSection === tab.key
                    ? "bg-[#050505] text-[#FF4500] shadow-md"
                    : "text-[#8E8E93] hover:text-[#F5F5F5]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-5 h-5 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-sm text-[#8E8E93]">Loading profile...</span>
            </div>
          )}

          {/* Sections */}
          {!loading && (
            <div className="animate-[fadeIn_0.35s_cubic-bezier(0.16,1,0.3,1)_both]">
              {activeSection === "experience" && (
                <ExperienceSection
                  experiences={profile.experiences}
                  onSave={handleSaveExperience}
                  onDelete={handleDeleteExperience}
                />
              )}
              {activeSection === "projects" && (
                <ProjectSection
                  projects={profile.projects}
                  onSave={handleSaveProject}
                  onDelete={handleDeleteProject}
                />
              )}
              {activeSection === "skills" && (
                <SkillSection
                  skills={profile.skills}
                  onSave={handleSaveSkill}
                  onDelete={handleDeleteSkill}
                />
              )}
              {activeSection === "education" && (
                <EducationSection
                  education={profile.education}
                  onSave={handleSaveEducation}
                  onDelete={handleDeleteEducation}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
