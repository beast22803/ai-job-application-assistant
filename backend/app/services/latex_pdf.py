"""
latex_pdf.py — Typeset the generated resume and cover letter with LaTeX and
return a PDF.

The app keeps resumes/cover letters as HTML (that is what the editor, diff and
refinement chat work on).  To get a real LaTeX look we parse that HTML back
into structured data, fill a LaTeX template (everything is escaped), and compile
it with ``pdflatex``.  Only packages from a minimal TeX Live install are used
(texlive-latex-base, texlive-latex-recommended, texlive-fonts-recommended,
lmodern).
"""
from __future__ import annotations

import os
import re
import shutil
import subprocess
import tempfile
import unicodedata
from datetime import datetime

from bs4 import BeautifulSoup


class LatexUnavailable(RuntimeError):
    """pdflatex is not installed on this machine."""


class LatexCompileError(RuntimeError):
    """pdflatex ran but could not typeset the document."""


class EmptyDocument(ValueError):
    """The HTML did not contain anything we could typeset."""


# ── Text helpers ──────────────────────────────────────────────────────────────

_TEX_SPECIALS = {
    "\\": r"\textbackslash{}",
    "&": r"\&",
    "%": r"\%",
    "$": r"\$",
    "#": r"\#",
    "_": r"\_",
    "{": r"\{",
    "}": r"\}",
    "~": r"\textasciitilde{}",
    "^": r"\textasciicircum{}",
}

# Characters pdflatex/inputenc cannot always handle -> safe equivalents.
_CHAR_MAP = {
    " ": " ", " ": " ", " ": " ", " ": " ", " ": " ",
    "​": "", "‌": "", "‍": "", "﻿": "",
    "‘": "'", "’": "'", "“": '"', "”": '"',
    "•": "•", "●": "•", "▪": "•", "‣": "•",
    "→": "->", "←": "<-", "↔": "<->", "⇒": "=>",
    "−": "-", "‑": "-", "‐": "-",
    "✓": "", "✔": "", "✅": "", "❌": "",
    "≤": "<=", "≥": ">=", "×": "x",
}


def _clean_text(text: str) -> str:
    """Normalise whitespace/unicode so the TeX engine will accept it."""
    text = unicodedata.normalize("NFC", text or "")
    out = []
    for ch in text:
        ch = _CHAR_MAP.get(ch, ch)
        for c in ch:
            o = ord(c)
            if c in "\n\t":
                out.append(" " if c == "\t" else c)
            elif o < 32:
                continue
            elif o <= 0x24F or 0x2010 <= o <= 0x2030 or c in "€™•":
                out.append(c)           # Latin + common punctuation / euro
            # everything else (emoji, CJK, symbols) is dropped
    return "".join(out)


def _ascii_fold(text: str) -> str:
    return unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")


def tex_escape(text: str) -> str:
    text = _clean_text(text)
    return "".join(_TEX_SPECIALS.get(c, c) for c in text)


def _href_target(url: str) -> str:
    return re.sub(r"[{}\\^%#\s]", "", url)


_URL_RE = re.compile(r"^(https?://\S+|www\.\S+|(?:[\w-]+\.)+(?:com|org|net|io|dev|de|ai|me|in|co)(?:/\S*)?)$", re.I)
_EMAIL_RE = re.compile(r"^[\w.+-]+@[\w-]+(?:\.[\w-]+)+$")


def _linkify(item: str) -> str:
    item = item.strip()
    if _EMAIL_RE.match(item):
        return rf"\href{{mailto:{_href_target(item)}}}{{{tex_escape(item)}}}"
    if _URL_RE.match(item):
        target = item if item.lower().startswith("http") else "https://" + item
        return rf"\href{{{_href_target(target)}}}{{{tex_escape(item)}}}"
    return tex_escape(item)


# ── HTML → structured data ────────────────────────────────────────────────────

def _txt(node) -> str:
    return re.sub(r"\s+", " ", node.get_text(" ", strip=True)).strip() if node else ""


def parse_resume_html(html: str) -> dict:
    """Read the resume HTML produced by ``render_resume_json_to_html``."""
    soup = BeautifulSoup(html or "", "html.parser")
    page = soup.select_one(".page") or soup

    name = _txt(page.select_one(".header h1"))
    contacts = [_txt(d) for d in page.select(".contact-info > div") if _txt(d)]

    sections: dict[str, object] = {}
    for sec in page.select(".section"):
        title = _txt(sec.select_one(".section-title")).lower()
        sections[title] = sec

    def section(*keys):
        for k, v in sections.items():
            if any(key in k for key in keys):
                return v
        return None

    summary = ""
    sec = section("summary", "profile")
    if sec:
        summary = _txt(sec.select_one(".summary-text"))

    def skills_of(sec):
        return [_txt(t) for t in sec.select(".skill-tag") if _txt(t)] if sec else []

    soft_sec = section("soft skill")
    skills_sec = None
    for k, v in sections.items():
        if "skill" in k and "soft" not in k:
            skills_sec = v
            break

    experience = []
    sec = section("experience")
    if sec:
        for item in sec.select(".exp-item"):
            experience.append({
                "title": _txt(item.select_one(".exp-title")),
                "company": _txt(item.select_one(".exp-company")),
                "dates": _txt(item.select_one(".exp-dates")),
                "bullets": [_txt(li) for li in item.select("li") if _txt(li)],
            })

    projects = []
    sec = section("project")
    if sec:
        for item in sec.select(".project-item"):
            projects.append({
                "name": _txt(item.select_one(".project-name")),
                "tech": _txt(item.select_one(".project-tech")),
                "desc": _txt(item.select_one(".project-desc")),
            })

    education = []
    sec = section("education")
    if sec:
        for item in sec.select(".edu-item"):
            education.append({
                "degree": _txt(item.select_one(".edu-degree")),
                "institution": _txt(item.select_one(".edu-institution")),
                "year": _txt(item.select_one(".edu-year")),
            })

    return {
        "name": name,
        "contacts": contacts,
        "summary": summary,
        "skills": skills_of(skills_sec),
        "soft_skills": skills_of(soft_sec),
        "experience": [e for e in experience if e["title"] or e["bullets"]],
        "projects": [p for p in projects if p["name"]],
        "education": [e for e in education if e["degree"]],
    }


def parse_cover_letter_html(html: str) -> dict:
    soup = BeautifulSoup(html or "", "html.parser")
    paragraphs = [_txt(p) for p in soup.select(".body-paragraph") if _txt(p)]
    return {
        "date": _txt(soup.select_one(".letter-date")),
        "salutation": _txt(soup.select_one(".letter-salutation")),
        "paragraphs": paragraphs,
        "closing": _txt(soup.select_one(".letter-closing")) or "Sincerely,",
        "signature": _txt(soup.select_one(".letter-signature")),
    }


# ── LaTeX templates ───────────────────────────────────────────────────────────

_RESUME_PREAMBLE = r"""\documentclass[%(size)spt,a4paper]{article}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{lmodern}
\usepackage[a4paper,left=0.7in,right=0.7in,top=0.6in,bottom=0.6in]{geometry}
\usepackage{microtype}
\usepackage[dvipsnames]{xcolor}
\usepackage[hidelinks]{hyperref}
\definecolor{accent}{HTML}{1F3A68}
\definecolor{muted}{HTML}{4B5563}
\pagestyle{empty}
\setlength{\parindent}{0pt}
\setlength{\parskip}{0pt}
\setlength{\emergencystretch}{3em}
\renewcommand{\labelitemi}{\textbullet}
\setlength{\leftmargini}{1.1em}
\newcommand{\resumesection}[1]{%%
  \vspace{%(sec_before).1fpt}{\large\bfseries\scshape\color{accent}#1}\par\vspace{2pt}%%
  {\color{accent}\hrule height 0.5pt}\vspace{%(sec_after).1fpt}}
\newcommand{\tight}{\setlength{\itemsep}{%(item).1fpt}\setlength{\topsep}{1pt}\setlength{\parsep}{0pt}\setlength{\partopsep}{0pt}}
"""


def _bullets(items: list[str]) -> str:
    items = [i for i in items if i]
    if not items:
        return ""
    body = "\n".join(rf"  \item {tex_escape(i)}" for i in items)
    return "\\vspace{-4pt}\\begin{itemize}\\tight\n" + body + "\n\\end{itemize}\n"


def build_resume_tex(doc: dict, font_size: int = 10, spacing: float = 1.0) -> str:
    out = [_RESUME_PREAMBLE % {"size": font_size, "sp": spacing, "sec_before": 10 * spacing, "sec_after": 5 * spacing, "item": 1.5 * spacing}, r"\begin{document}", ""]

    name = tex_escape(doc.get("name") or "Candidate")
    out.append(rf"\begin{{center}}{{\fontsize{{24}}{{28}}\selectfont\bfseries\scshape\color{{accent}} {name}}}\end{{center}}")
    out.append(r"\vspace{-8pt}")
    contacts = [c for c in doc.get("contacts", []) if c]
    if contacts:
        sep = r" \,\textbar\, "
        out.append(r"\begin{center}{\small\color{muted} " + sep.join(_linkify(c) for c in contacts) + r"}\end{center}")
    out.append("")

    if doc.get("summary"):
        out.append(r"\resumesection{Professional Summary}")
        out.append(tex_escape(doc["summary"]) + "\n")

    if doc.get("skills"):
        out.append(r"\resumesection{Technical Skills}")
        out.append(tex_escape(", ".join(doc["skills"])) + "\n")

    if doc.get("soft_skills"):
        out.append(r"\resumesection{Soft Skills}")
        out.append(tex_escape(", ".join(doc["soft_skills"])) + "\n")

    if doc.get("experience"):
        out.append(r"\resumesection{Work Experience}")
        for i, e in enumerate(doc["experience"]):
            if i:
                out.append(rf"\vspace{{{5 * spacing:.1f}pt}}")
            out.append(rf"\noindent\textbf{{{tex_escape(e['title'])}}}\hfill{{\small\color{{muted}} {tex_escape(e['dates'])}}}\par")
            if e.get("company"):
                out.append(rf"{{\color{{accent}}\itshape {tex_escape(e['company'])}}}\par")
            out.append(_bullets(e.get("bullets", [])))

    if doc.get("projects"):
        out.append(r"\resumesection{Projects}")
        for i, p in enumerate(doc["projects"]):
            if i:
                out.append(rf"\vspace{{{4 * spacing:.1f}pt}}")
            tech = rf"\hfill{{\small\color{{muted}}\itshape {tex_escape(p['tech'])}}}" if p.get("tech") else ""
            out.append(rf"\noindent\textbf{{{tex_escape(p['name'])}}}{tech}\par")
            if p.get("desc"):
                out.append(tex_escape(p["desc"]) + r"\par")

    if doc.get("education"):
        out.append(r"\resumesection{Education}")
        for i, e in enumerate(doc["education"]):
            if i:
                out.append(rf"\vspace{{{3 * spacing:.1f}pt}}")
            year = rf"\hfill{{\small\color{{muted}} {tex_escape(e['year'])}}}" if e.get("year") else ""
            out.append(rf"\noindent\textbf{{{tex_escape(e['degree'])}}}{year}\par")
            if e.get("institution"):
                out.append(rf"{{\color{{accent}}\itshape {tex_escape(e['institution'])}}}\par")

    out += ["", r"\end{document}", ""]
    return "\n".join(out)


_LETTER_PREAMBLE = r"""\documentclass[11pt,a4paper]{article}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{lmodern}
\usepackage[a4paper,left=1in,right=1in,top=0.9in,bottom=0.9in]{geometry}
\usepackage{microtype}
\usepackage[dvipsnames]{xcolor}
\usepackage[hidelinks]{hyperref}
\definecolor{accent}{HTML}{1F3A68}
\definecolor{muted}{HTML}{4B5563}
\pagestyle{empty}
\setlength{\parindent}{0pt}
\setlength{\parskip}{0.85em}
\setlength{\emergencystretch}{3em}
"""


def build_cover_letter_tex(doc: dict, sender: dict | None = None) -> str:
    sender = sender or {}
    name = doc.get("signature") or sender.get("name") or ""
    out = [_LETTER_PREAMBLE, r"\begin{document}", ""]

    if name:
        out.append(rf"{{\fontsize{{20}}{{24}}\selectfont\bfseries\scshape\color{{accent}} {tex_escape(name)}}}\par")
    contact = [c for c in (sender.get("email"), sender.get("phone"), sender.get("location"), sender.get("linkedin")) if c]
    if contact:
        out.append(r"\vspace{-0.2em}{\small\color{muted} " + r" \,\textbar\, ".join(_linkify(c) for c in contact) + r"}\par")
    if name or contact:
        out.append(r"\vspace{0.5em}{\color{accent}\hrule height 0.6pt}\vspace{1.2em}")

    date = doc.get("date") or datetime.now().strftime("%B %d, %Y")
    out.append(rf"\hfill {tex_escape(date)}\par")
    out.append(r"\vspace{0.6em}")
    if doc.get("salutation"):
        out.append(rf"\textbf{{{tex_escape(doc['salutation'])}}}\par")
    for p in doc.get("paragraphs", []):
        out.append(tex_escape(p) + "\n")
    out.append(r"\vspace{0.4em}")
    out.append(tex_escape(doc.get("closing") or "Sincerely,") + r"\par")
    if name:
        out.append(r"\vspace{0.3em}")
        out.append(rf"\textbf{{{tex_escape(name)}}}\par")
    out += ["", r"\end{document}", ""]
    return "\n".join(out)


# ── Compilation ───────────────────────────────────────────────────────────────

def latex_available() -> bool:
    return shutil.which("pdflatex") is not None


def _compile(tex: str) -> tuple[bytes, int]:
    """Run pdflatex in a throw-away directory. Returns (pdf_bytes, page_count)."""
    exe = shutil.which("pdflatex")
    if not exe:
        raise LatexUnavailable("pdflatex is not installed on this server.")
    with tempfile.TemporaryDirectory(prefix="tex_") as tmp:
        path = os.path.join(tmp, "doc.tex")
        with open(path, "w", encoding="utf-8") as f:
            f.write(tex)
        try:
            proc = subprocess.run(
                [exe, "-interaction=nonstopmode", "-halt-on-error", "-no-shell-escape", "doc.tex"],
                cwd=tmp, capture_output=True, timeout=90,
                env={**os.environ, "TEXMFOUTPUT": tmp, "openout_any": "p", "openin_any": "p"},
            )
        except subprocess.TimeoutExpired as e:
            raise LatexCompileError("LaTeX compilation timed out.") from e
        pdf_path = os.path.join(tmp, "doc.pdf")
        log = proc.stdout.decode("utf-8", "replace")
        if proc.returncode != 0 or not os.path.exists(pdf_path):
            errs = [l for l in log.splitlines() if l.startswith("!")]
            raise LatexCompileError("; ".join(errs[:3]) or "LaTeX compilation failed.")
        m = re.search(r"Output written on .*?\((\d+) page", log)
        with open(pdf_path, "rb") as f:
            return f.read(), int(m.group(1)) if m else 1


def _compile_safe(tex: str) -> tuple[bytes, int]:
    """Compile; on a character error retry once with pure-ASCII text."""
    try:
        return _compile(tex)
    except LatexCompileError:
        folded = _ascii_fold(tex)
        if folded == tex:
            raise
        return _compile(folded)


def render_resume_pdf(html: str) -> bytes:
    """
    Typeset the resume. Prefer the largest font/spacing that still fits on ONE page so a
    short resume fills the page; if it cannot fit on one page, use the most compact layout.
    """
    doc = parse_resume_html(html)
    if not (doc["name"] or doc["experience"] or doc["projects"] or doc["summary"]):
        raise EmptyDocument("The resume has no content that can be typeset.")
    candidates = [(12, 1.8), (12, 1.0), (11, 1.8), (11, 1.0), (10, 1.0)]
    best: tuple[bytes, int] | None = None
    for size, spacing in candidates:
        try:
            pdf, pages = _compile_safe(build_resume_tex(doc, size, spacing))
        except LatexCompileError:
            if best is None and (size, spacing) == candidates[-1]:
                raise
            continue
        if pages == 1:
            return pdf
        if best is None or pages < best[1]:
            best = (pdf, pages)
    if best is None:
        raise LatexCompileError("LaTeX compilation failed.")
    return best[0]


def render_cover_letter_pdf(html: str, sender: dict | None = None) -> bytes:
    doc = parse_cover_letter_html(html)
    if not doc["paragraphs"]:
        raise EmptyDocument("The cover letter has no content that can be typeset.")
    return _compile_safe(build_cover_letter_tex(doc, sender))[0]
