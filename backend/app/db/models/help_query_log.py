"""
HelpQueryLog Model - Analytics for Help ChatBot queries

This model stores user queries for product intelligence purposes.
Only the query is stored, NOT the response (privacy + storage optimization).
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.database import Base


class HelpQueryLog(Base):
    """Logs help chatbot queries for analytics purposes."""

    __tablename__ = "help_query_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    query_text = Column(String(500), nullable=False)
    detected_topic = Column(
        String(50), nullable=True
    )  # auto-detected: "billing", "patients", etc.
    current_route = Column(String(200), nullable=True)  # where the user was when asking
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<HelpQueryLog {self.id} - {self.query_text[:30]}...>"
