"use client";

import ProfileManager from "@/components/ProfileManager";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="animate-[fadeIn_0.5s_ease-out_both] w-full max-w-[1300px] mx-auto px-4 sm:px-10 py-6 sm:py-10">
        <ProfileManager />
      </div>
    </ProtectedRoute>
  );
}
