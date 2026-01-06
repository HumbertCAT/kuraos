#!/usr/bin/env python3
"""
Antigravity Loop - AI-Powered Test Generator

Uses Vertex AI Gemini to analyze code diffs and generate pytest unit tests.
Part of Phase 4: The Nervous System.

Usage:
    # Compare against origin/main (default)
    python scripts/generate_tests.py

    # Compare between release tags (for publish-release workflow)
    python scripts/generate_tests.py --release-mode

Output:
    Generates test file in tests/generated/test_auto_<timestamp>.py
"""

import os
import sys
import argparse
import subprocess
from datetime import datetime
from pathlib import Path

import vertexai
from vertexai.preview.generative_models import GenerativeModel


# Configuration
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "kura-os")
LOCATION = "europe-west1"  # GDPR compliant
MODEL_NAME = "gemini-2.0-flash-exp"  # Fast, cost-effective

# Patterns to skip (no tests needed)
SKIP_PATTERNS = [
    "config.py",
    "alembic/",
    "migrations/",
    "__init__.py",
    "__pycache__",
]

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


def get_previous_tag() -> str:
    """Get the most recent tag before HEAD."""
    try:
        result = subprocess.run(
            ["git", "describe", "--abbrev=0", "--tags", "HEAD^"],
            capture_output=True,
            text=True,
            check=True,
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError:
        # No previous tag, compare against first commit
        return ""


def get_current_tag() -> str:
    """Get tag at HEAD if exists."""
    try:
        result = subprocess.run(
            ["git", "describe", "--exact-match", "--tags", "HEAD"],
            capture_output=True,
            text=True,
            check=True,
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError:
        return "HEAD"


def get_git_diff(release_mode: bool = False) -> str:
    """Get the diff for analysis.

    Args:
        release_mode: If True, compare between tags. If False, compare against origin/main.
    """
    try:
        if release_mode:
            prev_tag = get_previous_tag()
            current = get_current_tag()
            if prev_tag:
                print(f"   Comparing: {prev_tag} → {current}")
                cmd = ["git", "diff", prev_tag, "HEAD", "--", "backend/app/"]
            else:
                print("   No previous tag found, comparing full history")
                cmd = ["git", "diff", "--", "backend/app/"]
        else:
            cmd = ["git", "diff", "origin/main", "--", "backend/app/"]

        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"⚠️  Error getting git diff: {e}")
        return ""


def needs_tests(diff: str) -> tuple[bool, list[str]]:
    """
    Smart filter: Decide if diff warrants test generation.

    Returns:
        (needs_tests: bool, files: list of meaningful changed files)
    """
    if not diff:
        return False, []

    # Extract changed files from diff
    lines = diff.split("\n")
    diff_headers = [l for l in lines if l.startswith("diff --git")]

    meaningful_files = []
    for header in diff_headers:
        # Extract file path (format: diff --git a/path b/path)
        parts = header.split(" ")
        if len(parts) >= 4:
            filepath = parts[2].lstrip("a/")

            # Only .py files in backend/app/
            if not filepath.endswith(".py"):
                continue
            if "backend/app/" not in filepath:
                continue

            # Skip patterns
            if any(pattern in filepath for pattern in SKIP_PATTERNS):
                continue

            # Skip deleted files (check if file still exists)
            full_path = Path(filepath)
            if not full_path.exists():
                continue

            meaningful_files.append(filepath)

    return len(meaningful_files) > 0, meaningful_files


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
        print(f"⚠️  Error generating test with AI: {e}")
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

    # Ensure directory exists
    filepath.parent.mkdir(parents=True, exist_ok=True)

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
    parser = argparse.ArgumentParser(description="Antigravity Loop - AI Test Generator")
    parser.add_argument(
        "--release-mode",
        action="store_true",
        help="Compare between release tags instead of origin/main",
    )
    args = parser.parse_args()

    print("🧠 Antigravity Loop - AI Test Generator\n")
    print(f"📍 Project: {PROJECT_ID}")
    print(f"📍 Location: {LOCATION}")
    print(f"🤖 Model: {MODEL_NAME}")
    print(
        f"🔄 Mode: {'Release (tag comparison)' if args.release_mode else 'Development (vs main)'}\n"
    )

    # Step 1: Get git diff
    print("📊 Analyzing code changes...")
    diff = get_git_diff(release_mode=args.release_mode)

    if not diff:
        print("💤 [ANTIGRAVITY] No changes detected.")
        sys.exit(0)  # Always exit 0 for pipeline safety

    # Step 2: Smart filter
    print("🔍 Applying smart filter...")
    should_generate, files = needs_tests(diff)

    if not should_generate:
        print("💤 [ANTIGRAVITY] No logic changes detected. Skipping test generation.")
        print("   (Only config/migrations/init files changed)")
        sys.exit(0)  # Always exit 0

    print(f"   Found {len(files)} meaningful file(s):")
    for f in files[:5]:  # Show max 5
        print(f"   - {f}")
    if len(files) > 5:
        print(f"   ... and {len(files) - 5} more")
    print()

    # Step 3: Generate tests with AI
    print("🔬 Generating tests with Vertex AI...")
    test_code = generate_test_with_ai(diff)

    if not test_code:
        print("⚠️  [ANTIGRAVITY] AI generation returned empty. Check Vertex AI logs.")
        sys.exit(0)  # Still exit 0 - not a pipeline failure

    print(f"   Generated {len(test_code.splitlines())} lines of test code\n")

    # Step 4: Save to file
    print("💾 Saving generated test...")
    filepath = save_generated_test(test_code)
    print(f"   Saved to: {filepath}\n")

    # Summary
    print("=" * 60)
    print("✨ [ANTIGRAVITY] Tests generated in tests/generated/")
    print("=" * 60)
    print(f"File: {filepath.name}")
    print(f"Lines: {len(filepath.read_text().splitlines())}")
    print("\n📝 Next steps:")
    print("1. Review the generated test")
    print("2. Run: pytest", str(filepath))
    print("3. Refactor if needed")
    print("4. Commit to repository")

    sys.exit(0)  # Always exit 0 for pipeline safety


if __name__ == "__main__":
    main()
