#!/usr/bin/env python3
"""
Antigravity Loop - AI-Powered Test Generator

Uses Vertex AI Gemini to analyze code diffs and generate pytest unit tests.
Part of Phase 4: The Nervous System.

Usage:
    python scripts/generate_tests.py

Output:
    Generates test file in tests/generated/test_auto_<timestamp>.py
"""

import os
import sys
import subprocess
from datetime import datetime
from pathlib import Path

import vertexai
from vertexai.preview.generative_models import GenerativeModel


# Configuration
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "kura-os")
LOCATION = "europe-west1"  # GDPR compliant
MODEL_NAME = "gemini-2.0-flash-exp"  # Fast, cost-effective

# Prompt engineering for test generation
SYSTEM_INSTRUCTION = """You are a QA Engineer specializing in Python pytest.

Your task is to analyze code diffs and generate comprehensive unit tests.

Guidelines:
1. Use pytest framework with async support
2. Follow existing test patterns in conftest.py
3. Use factories from tests/factories.py for test data
4. Include docstrings explaining what is being tested
5. Test both happy paths and error cases
6. Use proper assertions and mocks where needed

Output format: Complete Python test file ready to run."""


def get_git_diff() -> str:
    """Get the diff between current branch and main."""
    try:
        result = subprocess.run(
            ["git", "diff", "origin/main", "--", "backend/app/"],
            capture_output=True,
            text=True,
            check=True,
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ Error getting git diff: {e}")
        return ""


def generate_test_with_ai(diff_content: str) -> str:
    """
    Use Vertex AI Gemini to generate test code from diff.

    Args:
        diff_content: Git diff output

    Returns:
        Generated test code
    """
    # Initialize Vertex AI
    vertexai.init(project=PROJECT_ID, location=LOCATION)

    # Create model with system instruction
    model = GenerativeModel(MODEL_NAME, system_instruction=SYSTEM_INSTRUCTION)

    # Create prompt
    prompt = f"""Analyze this code diff and generate comprehensive pytest unit tests.

**Code Diff:**
```diff
{diff_content}
```

**Context:**
- This is a FastAPI backend with SQLAlchemy async
- Existing fixtures available: db_session, test_app, test_client
- Factories available: OrganizationFactory, UserFactory, PatientFactory
- Use pytest-asyncio for async tests

**Generate:**
A complete test file with:
- Descriptive test names
- Docstrings
- Proper async/await usage
- Both success and failure scenarios
- Proper assertions

Output only the Python test code, no explanations."""

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"❌ Error generating test with AI: {e}")
        return ""


def save_generated_test(test_code: str) -> Path:
    """
    Save generated test code to file.

    Args:
        test_code: Generated test code

    Returns:
        Path to saved file
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"test_auto_{timestamp}.py"
    filepath = Path(__file__).parent.parent / "tests" / "generated" / filename

    # Clean up code (remove markdown code fences if present)
    cleaned_code = test_code
    if "```python" in cleaned_code:
        cleaned_code = cleaned_code.split("```python")[1].split("```")[0].strip()
    elif "```" in cleaned_code:
        cleaned_code = cleaned_code.split("```")[1].split("```")[0].strip()

    # Add header comment
    header = f'''"""
Auto-generated test file by Antigravity Loop
Generated: {datetime.now().isoformat()}
Model: {MODEL_NAME}

DO NOT EDIT MANUALLY - Review and refactor if needed
"""

'''

    final_code = header + cleaned_code

    # Save to file
    filepath.write_text(final_code, encoding="utf-8")

    return filepath


def main():
    """Main test generation workflow."""
    print("🧠 Antigravity Loop - AI Test Generator\n")
    print(f"📍 Project: {PROJECT_ID}")
    print(f"📍 Location: {LOCATION}")
    print(f"🤖 Model: {MODEL_NAME}\n")

    # Step 1: Get git diff
    print("📊 Analyzing code changes...")
    diff = get_git_diff()

    if not diff:
        print("⚠️  No changes detected between current branch and origin/main")
        print("   Make some code changes and try again.")
        sys.exit(0)

    print(f"   Found {len(diff.splitlines())} lines of diff\n")

    # Step 2: Generate tests with AI
    print("🔬 Generating tests with Vertex AI...")
    test_code = generate_test_with_ai(diff)

    if not test_code:
        print("❌ Failed to generate test code")
        sys.exit(1)

    print(f"   Generated {len(test_code.splitlines())} lines of test code\n")

    # Step 3: Save to file
    print("💾 Saving generated test...")
    filepath = save_generated_test(test_code)
    print(f"   Saved to: {filepath}\n")

    # Summary
    print("=" * 60)
    print("✅ TEST GENERATION COMPLETE")
    print("=" * 60)
    print(f"File: {filepath.name}")
    print(f"Lines: {len(filepath.read_text().splitlines())}")
    print("\n📝 Next steps:")
    print("1. Review the generated test")
    print("2. Run: pytest", str(filepath))
    print("3. Refactor if needed")
    print("4. Commit to repository")


if __name__ == "__main__":
    main()
