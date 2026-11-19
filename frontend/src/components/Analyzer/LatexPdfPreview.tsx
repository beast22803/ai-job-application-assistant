"use client";

import { useEffect, useRef, useState } from "react";
import * as api from "@/services/api";

/** Save a Blob as a file download. */
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

interface Props {
  sessionId: string;
  docType: "resume" | "cover_letter";
  /** Current HTML of the document (what the editor / refinement chat work on). */
  html: string;
  title: string;
  className?: string;
  /** Called with the typeset PDF, or null when LaTeX rendering is unavailable. */
  onPdfChange?: (pdf: Blob | null) => void;
}

/**
 * Shows the document as a LaTeX-typeset PDF. The backend fills a LaTeX template and
 * compiles it; if that is not possible (no LaTeX on the server, server asleep, ...)
 * the regular HTML preview is shown instead so the page never breaks.
 */
export default function LatexPdfPreview({ sessionId, docType, html, title, className = "", onPdfChange }: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "fallback">("loading");
  const [reason, setReason] = useState("");
  const onPdfChangeRef = useRef(onPdfChange);
  onPdfChangeRef.current = onPdfChange;

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setState("loading");
    const timer = setTimeout(async () => {
      try {
        const blob = await api.renderPdf(sessionId, docType, html);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
        setState("ready");
        onPdfChangeRef.current?.(blob);
      } catch (err: any) {
        if (cancelled) return;
        setReason(err?.message || "");
        setState("fallback");
        onPdfChangeRef.current?.(null);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (objectUrl) setTimeout(() => URL.revokeObjectURL(objectUrl!), 2000);
    };
  }, [sessionId, docType, html]);

  if (state === "fallback") {
    return (
      <div>
        <div className="mb-2 rounded border border-[#FF4500]/30 bg-[#FF4500]/5 px-3 py-2 font-mono text-[10px] text-[#8E8E93]">
          LaTeX PDF preview unavailable{reason ? ` (${reason})` : ""} — showing the HTML preview instead.
        </div>
        <iframe srcDoc={html} className={className} title={title} />
      </div>
    );
  }

  return (
    <div className="relative">
      {pdfUrl ? (
        <iframe src={`${pdfUrl}#view=FitH`} className={className} title={title} />
      ) : (
        <div className={`${className} flex items-center justify-center`}>
          <span className="font-mono text-xs text-[#8E8E93]">Typesetting with LaTeX…</span>
        </div>
      )}
      {state === "loading" && pdfUrl && (
        <div className="absolute right-3 top-3 rounded bg-black/70 px-2 py-1 font-mono text-[10px] text-[#F5F5F5]">
          Re-typesetting…
        </div>
      )}
    </div>
  );
}
