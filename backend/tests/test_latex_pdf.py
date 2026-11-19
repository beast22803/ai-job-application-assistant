"""Tests for the LaTeX PDF pipeline, resume normalisation and the opencode provider."""
import os
import shutil
import stat
import sys
import textwrap

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services import latex_pdf as L  # noqa: E402
from app.services import generator as g  # noqa: E402

RESUME = {
    "header": "Ada Lovelace | ada@example.com | +49 151 0000000 | Darmstadt | github.com/ada",
    "summary": "Engineer with 100% focus on C# & R&D_tools {x} ~y~ \\z $5 #1.",
    "skills": ["Python", "C++", "R&D"],
    "soft_skills": ["Teamwork"],
    "experience": ["Engineer · Acme · 2020–2024\n- Built APIs & services\n- Cut costs by 50%"],
    "projects": ["Engine — Python, Rust\nAnalytical engine emulator."],
    "education": ["M.Sc. Maths · University of London · 2018–2020"],
}

needs_tex = pytest.mark.skipif(not L.latex_available(), reason="pdflatex not installed")


def test_tex_escape_covers_specials():
    assert L.tex_escape("a & b % c $ d # e _ f { g } h ~ i ^ j \\ k") == (
        r"a \& b \% c \$ d \# e \_ f \{ g \} h \textasciitilde{} i \textasciicircum{} j \textbackslash{} k"
    )


def test_tex_escape_drops_unsupported_characters():
    assert L.tex_escape("ok 🚀 ✅ done") == "ok   done"


def test_html_roundtrip_preserves_content():
    doc = L.parse_resume_html(g.render_resume_json_to_html(RESUME))
    assert doc["name"] == "Ada Lovelace"
    assert "ada@example.com" in doc["contacts"]
    assert doc["skills"] == ["Python", "C++", "R&D"]
    assert doc["soft_skills"] == ["Teamwork"]
    assert doc["experience"][0]["bullets"] == ["Built APIs & services", "Cut costs by 50%"]
    assert doc["projects"][0]["name"] == "Engine"
    assert doc["education"][0]["institution"] == "University of London"


def test_resume_tex_has_no_unescaped_specials():
    tex = L.build_resume_tex(L.parse_resume_html(g.render_resume_json_to_html(RESUME)))
    body = tex.split(r"\begin{document}")[1]
    assert r"100\% focus" in body and r"C\# \& R\&D\_tools" in body


@needs_tex
def test_resume_compiles_to_pdf():
    pdf = L.render_resume_pdf(g.render_resume_json_to_html(RESUME))
    assert pdf.startswith(b"%PDF")


@needs_tex
def test_cover_letter_compiles_to_pdf():
    html = (
        '<div class="letter-date">January 1, 2026</div><div class="letter-salutation">Dear Team,</div>'
        '<p class="body-paragraph">Hello & welcome_to #1 100% café ł.</p>'
        '<div class="letter-closing">Sincerely,</div><div class="letter-signature">Ada Lovelace</div>'
    )
    pdf = L.render_cover_letter_pdf(html, {"email": "ada@example.com"})
    assert pdf.startswith(b"%PDF")


def test_empty_documents_are_rejected():
    with pytest.raises(L.EmptyDocument):
        L.render_cover_letter_pdf("<div></div>")


# ── Resume normalisation ──────────────────────────────────────────────────────

ANALYSIS = {
    "name": "Ada Lovelace", "email": "ada@example.com", "skills": ["Python"],
    "experience_structured": [{"title": "Engineer", "company": "Acme", "start": "2020", "end": "2024", "description": "Built APIs"}],
    "projects_structured": [{"name": "Engine", "technologies": ["Python"], "description": "Emulator"}],
    "education_structured": [{"degree": "M.Sc.", "institution": "UoL", "year": "2020"}],
}


def test_normalize_repairs_bad_llm_output():
    bad = {"header": "John Doe | john.doe@email.com", "skills": [{"name": "Python"}, "python"],
           "experience": [{"title": "x"}], "projects": ["PROJECT_NAME — TECH_STACK\nDESCRIPTION_TEXT"], "education": None}
    out = g.normalize_resume_data(bad, ANALYSIS)
    assert out["header"].startswith("Ada Lovelace")
    assert out["skills"] == ["Python"]
    assert out["projects"] == ["Engine — Python\nEmulator"]
    assert out["education"] == ["M.Sc. · UoL · 2020"]


def test_normalize_rebuilds_from_source_when_llm_returned_nothing():
    out = g.normalize_resume_data({}, ANALYSIS)
    assert out["experience"] == ["Engineer · Acme · 2020–2024\n- Built APIs"]


# ── opencode provider (fake CLI) ──────────────────────────────────────────────

@pytest.mark.skipif(shutil.which("bash") is None, reason="needs bash")
def test_opencode_cli_provider_parses_json_events(tmp_path):
    from langchain_core.messages import HumanMessage, SystemMessage
    from app.core.opencode_llm import ChatOpenCode

    fake = tmp_path / "opencode"
    fake.write_text(textwrap.dedent("""\
        #!/bin/bash
        echo '{"type":"step_start","part":{}}'
        echo '{"type":"text","part":{"type":"text","text":"hello "}}'
        echo '{"type":"text","part":{"type":"text","text":"world"}}'
    """))
    fake.chmod(fake.stat().st_mode | stat.S_IEXEC)
    llm = ChatOpenCode(model="openrouter/openai/gpt-oss-120b", binary=str(fake))
    out = llm.invoke([SystemMessage(content="sys"), HumanMessage(content="go")])
    assert out.content == "hello world"
