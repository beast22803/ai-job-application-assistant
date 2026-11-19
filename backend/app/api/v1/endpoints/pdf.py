"""
pdf.py — Typeset the resume / cover letter with LaTeX and return a PDF.
"""
import hashlib
from collections import OrderedDict
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import Response
from pydantic import BaseModel

from app.core.auth import get_current_user_optional
from app.models.user import User
from app.repositories import application_repo
from app.services import latex_pdf

router = APIRouter()

_CACHE: "OrderedDict[str, bytes]" = OrderedDict()
_CACHE_MAX = 32


class PdfRequest(BaseModel):
    session_id: str
    doc_type: Literal["resume", "cover_letter"]
    html: str


@router.get("/pdf/status")
def pdf_status():
    """Tells the frontend whether this server can produce LaTeX PDFs."""
    return {"latex": latex_pdf.latex_available()}


@router.post("/pdf")
async def render_pdf(req: PdfRequest, current_user: Optional[User] = Depends(get_current_user_optional)):
    if not latex_pdf.latex_available():
        raise HTTPException(status_code=503, detail="LaTeX (pdflatex) is not installed on this server.")

    user_id = current_user.id if current_user else None
    session = application_repo.get_session(req.session_id, user_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    sender = {}
    if req.doc_type == "cover_letter":
        ra = session.get("resume_analysis") or {}
        sender = {k: ra.get(k) or "" for k in ("name", "email", "phone", "location", "linkedin")}

    key = hashlib.sha256(
        (req.doc_type + "\0" + req.html + "\0" + repr(sorted(sender.items()))).encode("utf-8")
    ).hexdigest()
    pdf = _CACHE.get(key)
    if pdf is None:
        try:
            if req.doc_type == "resume":
                pdf = await run_in_threadpool(latex_pdf.render_resume_pdf, req.html)
            else:
                pdf = await run_in_threadpool(latex_pdf.render_cover_letter_pdf, req.html, sender)
        except latex_pdf.EmptyDocument as e:
            raise HTTPException(status_code=422, detail=str(e))
        except latex_pdf.LatexUnavailable as e:
            raise HTTPException(status_code=503, detail=str(e))
        except latex_pdf.LatexCompileError as e:
            raise HTTPException(status_code=500, detail=f"LaTeX could not typeset this document: {e}")
        _CACHE[key] = pdf
        while len(_CACHE) > _CACHE_MAX:
            _CACHE.popitem(last=False)

    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{req.doc_type}.pdf"'},
    )
