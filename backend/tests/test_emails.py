"""
Email Testing - Phase 5: Communication Immunity

Unit tests for email-related utilities.
Does not require database or API calls.
"""

import re
import pytest


@pytest.mark.asyncio
async def test_password_reset_link_format():
    """
    Test that password reset links follow expected format.

    This is a utility test to ensure our link extraction regex is correct.
    """
    # Sample email body with reset link
    sample_html = """
    <p>Click here to reset your password:</p>
    <a href="https://app.kuraos.ai/es/reset-password?token=abc123-def456-ghi789">Reset Password</a>
    """

    reset_link_pattern = r"https?://[^\s]+/reset-password\?token=[\w-]+"
    links = re.findall(reset_link_pattern, sample_html)

    assert len(links) == 1
    assert "token=abc123-def456-ghi789" in links[0]


@pytest.mark.asyncio
async def test_password_reset_token_validation():
    """
    Test password reset token format is cryptographically secure.

    Tokens should be URL-safe base64 of sufficient length.
    """
    import secrets

    # Generate token as the endpoint does
    reset_token = secrets.token_urlsafe(32)

    # Verify it's URL-safe (no +, /, =)
    assert "+" not in reset_token
    assert "/" not in reset_token

    # Verify sufficient length (43 chars for 32 bytes base64)
    assert len(reset_token) >= 40


@pytest.mark.asyncio
async def test_email_html_extraction_with_quotes():
    """
    Test that link extraction handles various HTML quote styles.
    """
    # Different quote styles in HTML
    samples = [
        '<a href="https://app.kuraos.ai/reset-password?token=abc123">Link</a>',
        "<a href='https://app.kuraos.ai/reset-password?token=def456'>Link</a>",
    ]

    reset_link_pattern = r"https?://[^\s\"']+/reset-password\?token=[\w-]+"

    for html in samples:
        links = re.findall(reset_link_pattern, html)
        assert len(links) == 1, f"Failed to extract link from: {html}"
