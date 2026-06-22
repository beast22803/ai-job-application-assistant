"use client";

import React from "react";

interface ProfileCardProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onEdit?: () => void;
  className?: string;
}

export default function ProfileCard({ children, onDelete, onEdit, className = "" }: ProfileCardProps) {
  return (
    <div className={`group relative bg-[#0C0C0C] border border-[#222222] rounded-xl p-6 transition-all hover:border-[#333333] ${className}`}>
      {(onEdit || onDelete) && (
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 rounded-md bg-[#111111] border border-[#222222] hover:border-[#FF4500] text-[#8E8E93] hover:text-[#FF4500] transition-all"
              title="Edit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-md bg-[#111111] border border-[#222222] hover:border-[#FF453A] text-[#8E8E93] hover:text-[#FF453A] transition-all"
              title="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
