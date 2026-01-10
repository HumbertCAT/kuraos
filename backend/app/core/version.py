"""Version utility - reads current version from CHANGELOG.md.

TD-80: Single source of truth for version across the application.
The CHANGELOG is the authoritative source; this module extracts it at startup.
"""

import re
from pathlib import Path
from functools import lru_cache


@lru_cache(maxsize=1)
def get_version() -> str:
    """Extract current version from CHANGELOG.md.

    Parses the first version header (## [X.Y.Z]) from the changelog.
    Falls back to "0.0.0" if parsing fails.

    Returns:
        Version string (e.g., "1.6.9")
    """
    # Look for CHANGELOG.md relative to this file's location
    # backend/app/core/version.py -> backend/ -> project root
    current_dir = Path(__file__).parent
    changelog_paths = [
        current_dir.parent.parent.parent.parent
        / "CHANGELOG.md",  # /KuraOS/CHANGELOG.md
        current_dir.parent.parent.parent / "CHANGELOG.md",  # fallback
        Path("/app/CHANGELOG.md"),  # Docker container path
    ]

    for changelog_path in changelog_paths:
        if changelog_path.exists():
            try:
                content = changelog_path.read_text(encoding="utf-8")
                # Match first version header: ## [1.6.9] - 2026-01-10
                match = re.search(r"^## \[(\d+\.\d+\.\d+)\]", content, re.MULTILINE)
                if match:
                    return match.group(1)
            except Exception:
                continue

    return "0.0.0"  # Fallback if CHANGELOG not found


# Pre-compute at import time for fast access
APP_VERSION = get_version()
