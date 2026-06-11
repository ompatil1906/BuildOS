import hashlib
import math

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import DocumentChunk


def chunk_text(text: str, max_chars: int = 900) -> list[str]:
    paragraphs = [part.strip() for part in text.split("\n") if part.strip()]
    chunks: list[str] = []
    current = ""
    for paragraph in paragraphs:
        if len(current) + len(paragraph) + 1 > max_chars and current:
            chunks.append(current)
            current = paragraph
        else:
            current = f"{current}\n{paragraph}".strip()
    if current:
        chunks.append(current)
    return chunks or [text[:max_chars]]


def fake_embedding(text: str, dimensions: int = 1536) -> list[float]:
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    values = []
    for index in range(dimensions):
        byte = digest[index % len(digest)]
        values.append((byte / 255.0) * 2 - 1)
    norm = math.sqrt(sum(value * value for value in values)) or 1.0
    return [round(value / norm, 6) for value in values]


def index_project_text(db: Session, *, project_id: str, source_type: str, source_id: str, text: str) -> int:
    count = 0
    for chunk in chunk_text(text):
        db.add(
            DocumentChunk(
                project_id=project_id,
                source_type=source_type,
                source_id=source_id,
                chunk_text=chunk,
                embedding=fake_embedding(chunk),
            )
        )
        count += 1
    db.flush()
    return count


def retrieve_context(db: Session, *, project_id: str, query: str, limit: int = 5) -> list[dict]:
    terms = {term.lower() for term in query.split() if len(term) > 3}
    chunks = db.scalars(select(DocumentChunk).where(DocumentChunk.project_id == project_id)).all()
    ranked = []
    for chunk in chunks:
        haystack = chunk.chunk_text.lower()
        score = sum(1 for term in terms if term in haystack)
        ranked.append((score, chunk))
    ranked.sort(key=lambda pair: pair[0], reverse=True)
    return [
        {
            "source_type": chunk.source_type,
            "source_id": chunk.source_id,
            "chunk_text": chunk.chunk_text,
            "score": score,
        }
        for score, chunk in ranked[:limit]
    ]

