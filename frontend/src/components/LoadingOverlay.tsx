"use client";

interface LoadingOverlayProps {
  visible: boolean;
  text: string;
}

export default function LoadingOverlay({ visible, text }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-[#050505]/90 backdrop-blur-md z-50 flex items-center justify-center flex-col text-center px-6">
      <div className="w-12 h-12 border-3 border-[#222222] border-t-[#FF4500] rounded-full animate-spin mb-6" />
      <div className="font-mono text-xs text-[#F5F5F5] tracking-widest uppercase">
        {text}
      </div>
    </div>
  );
}
