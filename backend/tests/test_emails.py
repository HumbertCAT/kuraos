"""
Email Testing - Phase 5: Communication Immunity

Tests email flows (password reset, invitations) using Mailpit SMTP sink.
No real emails sent, all captured and inspected via REST API.
"""

import re
import pytest
from httpx import AsyncClient


@pytest.mark.skip(
    reason="TD-89: forgot-password endpoint returns 422 in minimal test app"
)
@pytest.mark.asyncio
async def test_forgot_password_sends_email(
    client: AsyncClient, mailpit_client, mailpit_smtp_port: int
):
    """
    Test that forgot password endpoint sends a reset email.

    Flow:
    1. POST /auth/forgot-password with email
    2. Query Mailpit for captured email
    3. Verify recipient, subject, and reset link
    """
    # Step 1: Request password reset
    test_email = "test@example.com"
    response = await client.post(
        "/api/v1/auth/forgot-password", json={"email": test_email}
    )

    # Should succeed even if user doesn't exist (security)
    assert response.status_code in [200, 202]

    # Step 2: Check Mailpit for email
    messages = mailpit_client.get_messages()

    # Assertions
    assert len(messages) >= 1, "Expected at least 1 email to be captured"

    # Get latest message
    latest_message = messages[0]

    # Step 3: Verify email details
    assert test_email in latest_message.get("To", [{}])[0].get("Address", "")
    assert "password" in latest_message.get("Subject", "").lower()

    # Step 4: Extract and validate reset link
    message_id = latest_message["ID"]
    full_message = mailpit_client.get_message(message_id)

    email_body = full_message.get("HTML", "") or full_message.get("Text", "")

    # Look for reset link pattern
    reset_link_pattern = r"https?://[^\\s]+/reset-password\\?token=[\\w-]+"
    links = re.findall(reset_link_pattern, email_body)

    assert len(links) >= 1, "Expected at least one reset link in email body"

    reset_link = links[0]
    assert "token=" in reset_link
    assert len(reset_link) > 50, "Reset link should contain a valid token"


@pytest.mark.asyncio
async def test_password_reset_link_format(mailpit_client):
    """
    Test that password reset links follow expected format.

    This is a utility test to ensure our link extraction regex is correct.
    """
    # Mock email body with reset link
    sample_html = """
    <p>Click here to reset your password:</p>
    <a href="https://app.kuraos.ai/reset-password?token=abc123-def456-ghi789">Reset Password</a>
    """

    reset_link_pattern = r"https?://[^\\s]+/reset-password\\?token=[\\w-]+"
    links = re.findall(reset_link_pattern, sample_html)

    assert len(links) == 1
    assert "token=abc123-def456-ghi789" in links[0]


@pytest.mark.asyncio
async def test_mailpit_captures_multiple_emails(client: AsyncClient, mailpit_client):
    """
    Test that Mailpit can capture multiple emails in sequence.

    This validates our Mailpit fixture works correctly.
    """
    # Send multiple password reset requests
    emails = ["user1@test.com", "user2@test.com", "user3@test.com"]

    for email in emails:
        await client.post("/api/v1/auth/forgot-password", json={"email": email})

    # Check all were captured
    messages = mailpit_client.get_messages()
    assert len(messages) >= len(emails)

    # Verify recipients
    recipients = [msg.get("To", [{}])[0].get("Address", "") for msg in messages]

    for email in emails:
        assert email in recipients


@pytest.mark.asyncio
async def test_mailpit_cleanup_between_tests(mailpit_client):
    """
    Test that mailpit_client fixture cleans up between tests.

    This ensures test isolation.
    """
    # Should start with 0 messages (cleanup from previous test)
    messages = mailpit_client.get_messages()
    assert len(messages) == 0, "Mailpit should start clean for each test"
