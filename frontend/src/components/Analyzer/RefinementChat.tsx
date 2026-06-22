"use client";

import React, { useState, useRef, useEffect } from "react";
import { refineAsset } from "@/services/api";

interface RefinementMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  asset_type: "resume" | "cover_letter" | "email";
  timestamp: Date;
}

interface RefinementChatProps {
  sessionId: string;
  activeAsset: "resume" | "cover_letter" | "email";
  setActiveAsset: (a: "resume" | "cover_letter" | "email") => void;
  currentResumeHtml: string;
  currentCoverLetterHtml: string;
  currentEmailSubject: string;
  currentEmailBody: string;
  onResumeRefined: (html: string) => void;
  onCoverLetterRefined: (html: string) => void;
  onEmailRefined: (data: { subject: string; body: string }) => void;
}

const ASSET_LABELS = {
  resume: "Resume",
  cover_letter: "Cover Letter",
  email: "Email",
} as const;

export default function RefinementChat({
  sessionId,
  activeAsset,
  setActiveAsset,
  currentResumeHtml,
  currentCoverLetterHtml,
  currentEmailSubject,
  currentEmailBody,
  onResumeRefined,
  onCoverLetterRefined,
  onEmailRefined,
}: RefinementChatProps) {
  const [messages, setMessages] = useState<RefinementMessage[]>([]);
  const [input, setInput] = useState("");
  const [refining, setRefining] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeAsset]);

  const getCurrentContent = (): string => {
    switch (activeAsset) {
      case "resume":
        return currentResumeHtml;
      case "cover_letter":
        return currentCoverLetterHtml;
      case "email":
        return `Subject: ${currentEmailSubject}\n\n${currentEmailBody}`;
    }
  };

  const activeMessages = messages.filter((m) => m.asset_type === activeAsset);
  const refinementCount = activeMessages.filter((m) => m.role === "assistant" && !m.content.startsWith("⚠")).length;

  const handleSend = async () => {
    const instruction = input.trim();
    if (!instruction || refining) return;

    const userMsg: RefinementMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: instruction,
      asset_type: activeAsset,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setRefining(true);

    try {
      // Gather only the previous user/assistant messages for the active asset type
      const history = messages
        .filter((m) => m.asset_type === activeAsset)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const result = await refineAsset({
        session_id: sessionId,
        asset_type: activeAsset,
        instruction,
        current_content: getCurrentContent(),
        history: history,
      });

      // Apply the refined content back
      if (activeAsset === "resume") {
        onResumeRefined(result.refined_content);
      } else if (activeAsset === "cover_letter") {
        onCoverLetterRefined(result.refined_content);
      } else {
        // Parse email refinement: expect "Subject: ...\n\n..." format
        const emailText = result.refined_content;
        const subjectMatch = emailText.match(/^Subject:\s*(.+?)(?:\n|$)/);
        const subject = subjectMatch ? subjectMatch[1].trim() : currentEmailSubject;
        const bodyStart = emailText.indexOf("\n\n");
        const body = bodyStart >= 0 ? emailText.slice(bodyStart + 2).trim() : emailText;
        onEmailRefined({ subject, body });
      }

      const assistantMsg: RefinementMessage = {
        id: `msg_${Date.now()}_resp`,
        role: "assistant",
        content: `✓ ${ASSET_LABELS[activeAsset]} updated successfully. The preview above now reflects your changes.`,
        asset_type: activeAsset,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: RefinementMessage = {
        id: `msg_${Date.now()}_err`,
        role: "assistant",
        content: `⚠ Refinement failed: ${err.message}`,
        asset_type: activeAsset,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setRefining(false);
    }
  };

  return (
    <div className="bg-[#0C0C0C] border border-[#222222] rounded-xl overflow-hidden animate-[fadeIn_0.3s_ease-out_both]">
      {/* Header with asset tabs */}
      <div className="border-b border-[#222222] px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#FF4500] animate-pulse" />
            <span className="text-sm font-semibold">Refinement Studio</span>
          </div>
          {refinementCount > 0 && (
            <span className="font-mono text-[9px] text-[#8E8E93] tracking-widest uppercase bg-[#111111] border border-[#222222] px-2 py-1 rounded-full">
              {refinementCount} edit{refinementCount !== 1 ? "s" : ""} applied
            </span>
          )}
        </div>

        {/* Asset selector tabs */}
        <div className="flex bg-[#111111] p-1 rounded-md border border-[#222222] gap-1">
          {(["resume", "cover_letter", "email"] as const).map((asset) => (
            <button
              key={asset}
              onClick={() => setActiveAsset(asset)}
              className={`flex-1 font-mono text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-sm transition-all ${
                activeAsset === asset
                  ? "bg-[#050505] text-[#FF4500] shadow-md"
                  : "text-[#8E8E93] hover:text-[#F5F5F5]"
              }`}
            >
              {ASSET_LABELS[asset]}
            </button>
          ))}
        </div>
      </div>

      {/* Message thread */}
      <div className="max-h-[320px] overflow-y-auto px-6 py-4 flex flex-col gap-3 scrollbar-thin">
        {activeMessages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-[#8E8E93] text-xs mb-2">
              Describe changes you&apos;d like to make to your {ASSET_LABELS[activeAsset].toLowerCase()}.
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {activeAsset === "resume" && (
                <>
                  <button onClick={() => setInput("Make the summary more concise")} className="text-[10px] font-mono text-[#8E8E93] border border-[#222222] hover:border-[#FF4500] hover:text-[#FF4500] px-2.5 py-1 rounded-full transition-all">&quot;Make summary more concise&quot;</button>
                  <button onClick={() => setInput("Add more quantified achievements to experience bullets")} className="text-[10px] font-mono text-[#8E8E93] border border-[#222222] hover:border-[#FF4500] hover:text-[#FF4500] px-2.5 py-1 rounded-full transition-all">&quot;Add quantified achievements&quot;</button>
                  <button onClick={() => setInput("Reorder skills to prioritize the most relevant ones")} className="text-[10px] font-mono text-[#8E8E93] border border-[#222222] hover:border-[#FF4500] hover:text-[#FF4500] px-2.5 py-1 rounded-full transition-all">&quot;Reorder skills by relevance&quot;</button>
                </>
              )}
              {activeAsset === "cover_letter" && (
                <>
                  <button onClick={() => setInput("Make the tone more enthusiastic")} className="text-[10px] font-mono text-[#8E8E93] border border-[#222222] hover:border-[#FF4500] hover:text-[#FF4500] px-2.5 py-1 rounded-full transition-all">&quot;More enthusiastic tone&quot;</button>
                  <button onClick={() => setInput("Shorten to 3 paragraphs max")} className="text-[10px] font-mono text-[#8E8E93] border border-[#222222] hover:border-[#FF4500] hover:text-[#FF4500] px-2.5 py-1 rounded-full transition-all">&quot;Shorten to 3 paragraphs&quot;</button>
                </>
              )}
              {activeAsset === "email" && (
                <>
                  <button onClick={() => setInput("Make it shorter and more direct")} className="text-[10px] font-mono text-[#8E8E93] border border-[#222222] hover:border-[#FF4500] hover:text-[#FF4500] px-2.5 py-1 rounded-full transition-all">&quot;Shorter and more direct&quot;</button>
                  <button onClick={() => setInput("Add a call-to-action for scheduling a call")} className="text-[10px] font-mono text-[#8E8E93] border border-[#222222] hover:border-[#FF4500] hover:text-[#FF4500] px-2.5 py-1 rounded-full transition-all">&quot;Add scheduling CTA&quot;</button>
                </>
              )}
            </div>
          </div>
        )}

        {activeMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-lg text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#FF4500]/10 border border-[#FF4500]/30 text-[#F5F5F5]"
                  : "bg-[#111111] border border-[#222222] text-[#8E8E93]"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {refining && (
          <div className="flex justify-start">
            <div className="bg-[#111111] border border-[#222222] px-4 py-2.5 rounded-lg text-xs text-[#8E8E93] flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-[#222222] border-t-[#FF4500] rounded-full animate-spin" />
              Applying refinement to {ASSET_LABELS[activeAsset].toLowerCase()}...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-[#222222] px-6 py-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={`Describe changes to your ${ASSET_LABELS[activeAsset].toLowerCase()}...`}
            disabled={refining}
            className="flex-1 px-4 py-2.5 bg-[#111111] border border-[#222222] focus:border-[#FF4500] text-sm rounded-lg outline-none transition-all disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={refining || !input.trim()}
            className="bg-[#F5F5F5] text-[#050505] hover:bg-[#FF4500] hover:text-[#F5F5F5] disabled:opacity-30 disabled:hover:bg-[#F5F5F5] disabled:hover:text-[#050505] px-5 py-2.5 rounded-lg font-mono text-[10px] font-bold tracking-wider uppercase transition-all whitespace-nowrap"
          >
            Refine →
          </button>
        </div>
      </div>
    </div>
  );
}
