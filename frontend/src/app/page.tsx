"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full relative overflow-hidden flex flex-col items-center pb-24">
      {/* Background glowing orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-[#FF4500]/10 rounded-full blur-[150px] -z-10 animate-pulse pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-[#00A3FF]/10 rounded-full blur-[120px] -z-10 animate-pulse pointer-events-none" style={{ animationDelay: "2s" }} />

      {/* --- HERO SECTION --- */}
      <section className="min-h-[80vh] flex flex-col justify-center items-center max-w-[1200px] mx-auto px-6 py-20 animate-[fadeIn_0.8s_ease-out_both]">
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left Column: Text */}
          <div className="text-left flex flex-col items-start">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 text-sm font-mono text-[#8E8E93]">
              <span className="material-symbols-rounded text-[16px] text-[#00E5FF]">auto_awesome</span>
              AI-Powered Career Intelligence
            </div>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter mb-8 bg-gradient-to-br from-white via-white to-[#8E8E93] bg-clip-text text-transparent leading-[1.1]">
              Beat the Algorithm. <br/>
              <span className="text-[#FF4500]">Land the Interview.</span>
            </h1>
            <p className="text-[#8E8E93] text-lg lg:text-xl max-w-xl mb-12 font-light leading-relaxed">
              Over 75% of resumes are rejected by Applicant Tracking Systems (ATS) before a human ever sees them. JobAnalyser uses advanced AI to reverse-engineer job descriptions and tailor your resume for a perfect match.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="/analyzer" className="px-8 py-4 bg-[#FF4500] hover:bg-[#FF5511] text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-[0_0_30px_-5px_#FF4500]">
                <span className="material-symbols-rounded">rocket_launch</span>
                Start Free Analysis
              </Link>
              <Link href="#how-it-works" className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-rounded">info</span>
                Learn How
              </Link>
            </div>
          </div>

          {/* Right Column: Hero Graphic */}
          <div className="hidden lg:flex relative w-full h-[500px] items-center justify-center">
             <div className="absolute inset-0 bg-gradient-to-tr from-[#FF4500]/20 to-[#00A3FF]/20 rounded-3xl blur-3xl -z-10" />
             <div className="w-[110%] max-w-[600px] bg-[#050505]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative translate-x-4">
                {/* Mock UI Header */}
                <div className="h-12 border-b border-white/5 flex items-center px-5 gap-2 bg-white/5">
                   <div className="w-3 h-3 rounded-full bg-[#FF4500]/50" />
                   <div className="w-3 h-3 rounded-full bg-[#FF9F0A]/50" />
                   <div className="w-3 h-3 rounded-full bg-[#30D158]/50" />
                </div>
                {/* Mock UI Content */}
                <div className="p-8 space-y-6">
                   <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#FF4500] to-[#FF9F0A]" />
                      <div>
                        <div className="h-5 bg-white/10 rounded w-40 mb-2" />
                        <div className="h-3 bg-white/5 rounded w-24" />
                      </div>
                   </div>
                   <div className="space-y-3">
                     <div className="h-4 bg-white/5 rounded w-full" />
                     <div className="h-4 bg-white/5 rounded w-[90%]" />
                     <div className="h-4 bg-white/5 rounded w-[75%]" />
                   </div>
                   <div className="flex gap-3 pt-4">
                      <div className="px-4 py-2 bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/20 text-xs font-mono font-bold rounded-full">ATS MATCH 98%</div>
                      <div className="px-4 py-2 bg-[#00A3FF]/10 text-[#00A3FF] border border-[#00A3FF]/20 text-xs font-mono font-bold rounded-full">FORMAT VERIFIED</div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- THE PROBLEM --- */}
      <section className="w-full max-w-[1200px] mx-auto px-6 py-24 border-t border-white/5">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-[#FF4500] font-mono text-sm tracking-widest uppercase mb-4">The Problem</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">The Resume Black Hole</h2>
            <p className="text-[#8E8E93] mb-6 leading-relaxed text-lg">
              Applying for jobs today feels like throwing your resume into a void. Companies use aggressive filtering algorithms to scan for precise keyword density, semantic formatting, and rigid skill hierarchies.
            </p>
            <ul className="space-y-4">
              {[
                "Highly qualified candidates are instantly rejected.",
                "Slight differences in terminology ruin your chances.",
                "Customizing resumes manually takes hours per application."
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[#F5F5F5]">
                  <span className="material-symbols-rounded text-[#FF4500] shrink-0">cancel</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative p-[1px] bg-gradient-to-br from-[#FF4500]/30 to-transparent rounded-2xl">
            <div className="bg-[#050505] rounded-[15px] p-8 h-full">
              <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                <span className="text-sm font-mono text-[#8E8E93]">ATS Scanning System...</span>
                <span className="material-symbols-rounded text-[#FF4500] animate-pulse">radar</span>
              </div>
              <div className="space-y-3 font-mono text-sm opacity-70">
                <div className="text-[#8E8E93]">{"{"}</div>
                <div className="pl-4 text-[#F5F5F5]">candidate: "Jane Doe",</div>
                <div className="pl-4 text-[#F5F5F5]">match_score: <span className="text-[#FF4500]">34%</span>,</div>
                <div className="pl-4 text-[#8E8E93]">reason: "Missing critical keyword: 'RESTful APIs'",</div>
                <div className="pl-4 text-[#FF4500]">action: "AUTO_REJECT"</div>
                <div className="text-[#8E8E93]">{"}"}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES / MODULES --- */}
      <section className="w-full max-w-[1200px] mx-auto px-6 py-24 border-t border-white/5">
        <div className="text-center mb-16">
          <div className="text-[#00A3FF] font-mono text-sm tracking-widest uppercase mb-4">The Solution</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Intelligent Application Suite</h2>
          <p className="text-[#8E8E93] max-w-2xl mx-auto">Everything you need to systematically bypass filters and get your resume into the hands of a hiring manager.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Dashboard */}
          <Link href="/dashboard" className="group relative p-[1px] rounded-2xl overflow-hidden bg-gradient-to-br from-white/10 to-transparent hover:from-[#FF4500]/50 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF4500]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
            <div className="relative h-full bg-[#0A0A0A]/90 backdrop-blur-sm rounded-[15px] p-8 flex flex-col items-start border border-white/5 group-hover:border-white/10 transition-colors text-left">
              <div className="w-12 h-12 rounded-xl bg-[#111111] border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#FF4500]/10 group-hover:border-[#FF4500]/30 transition-all duration-500">
                <span className="material-symbols-rounded text-white group-hover:text-[#FF4500] transition-colors">monitoring</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#F5F5F5]">Analytics Dashboard</h3>
              <p className="text-[#8E8E93] text-sm leading-relaxed">
                Track your application success rate, view ATS score trends, and manage active analysis sessions from a bird's-eye view.
              </p>
            </div>
          </Link>

          {/* Card 2: Master Profile */}
          <Link href="/profile" className="group relative p-[1px] rounded-2xl overflow-hidden bg-gradient-to-br from-white/10 to-transparent hover:from-[#00A3FF]/50 transition-all duration-500 translate-y-0 md:translate-y-4">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00A3FF]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
            <div className="relative h-full bg-[#0A0A0A]/90 backdrop-blur-sm rounded-[15px] p-8 flex flex-col items-start border border-white/5 group-hover:border-white/10 transition-colors text-left">
              <div className="w-12 h-12 rounded-xl bg-[#111111] border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#00A3FF]/10 group-hover:border-[#00A3FF]/30 transition-all duration-500">
                <span className="material-symbols-rounded text-white group-hover:text-[#00A3FF] transition-colors">folder_shared</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#F5F5F5]">Master Profile</h3>
              <p className="text-[#8E8E93] text-sm leading-relaxed">
                Build a comprehensive database of your entire career history. Our AI will automatically extract only the most relevant parts for each job.
              </p>
            </div>
          </Link>

          {/* Card 3: New Analysis */}
          <Link href="/analyzer" className="group relative p-[1px] rounded-2xl overflow-hidden bg-gradient-to-br from-white/10 to-transparent hover:from-[#00E5FF]/50 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00E5FF]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
            <div className="relative h-full bg-[#0A0A0A]/90 backdrop-blur-sm rounded-[15px] p-8 flex flex-col items-start border border-white/5 group-hover:border-white/10 transition-colors text-left">
              <div className="w-12 h-12 rounded-xl bg-[#111111] border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#00E5FF]/10 group-hover:border-[#00E5FF]/30 transition-all duration-500">
                <span className="material-symbols-rounded text-white group-hover:text-[#00E5FF] transition-colors">bolt</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#F5F5F5]">Real-Time Analyzer</h3>
              <p className="text-[#8E8E93] text-sm leading-relaxed">
                Paste a job description to get instant ATS match scores, missing keyword analysis, and completely tailored resume revisions.
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section id="how-it-works" className="w-full max-w-[1200px] mx-auto px-6 py-24 border-t border-white/5">
        <div className="text-center mb-16">
          <div className="text-[#00E5FF] font-mono text-sm tracking-widest uppercase mb-4">How It Works</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Three Steps to an Interview</h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          {[
            { step: "01", icon: "content_paste_search", title: "Analyze the Job", desc: "Paste any job URL or description. The AI instantly identifies required skills, tone, and hidden ATS keywords." },
            { step: "02", icon: "compare_arrows", title: "Match Your Profile", desc: "We cross-reference your Master Profile to see how well you align, generating a highly accurate ATS compatibility score." },
            { step: "03", icon: "draw", title: "Generate Revisions", desc: "The AI acts as your personal career coach, rewriting bullet points to highlight the exact experience the employer wants." }
          ].map((item, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center text-center p-6 bg-[#0A0A0A]/50 border border-white/5 rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-[#111111] border border-white/10 flex items-center justify-center mb-6 shadow-xl relative">
                <span className="absolute -top-3 -left-3 text-xs font-mono text-white/30 font-bold bg-[#050505] px-1 rounded">{item.step}</span>
                <span className="material-symbols-rounded text-2xl text-white/80">{item.icon}</span>
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-[#8E8E93] text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
