---
description: Process to publish a new version of KURA OS (docs, git, deploy)
---

# Release Process

Run this workflow when the user says "Publish version X.Y.Z" or "Release to production".

## 1. Update Documentation

1.  **CHANGELOG.md**:
    - Add a new header `## [X.Y.Z] - YYYY-MM-DD` at the top.
    - Move "Unreleased" changes into this section.
    - Use categories: Added, Changed, Fixed, Infrastructure.

2.  **README.md**:
    - Update the version badge (if present) or any "Current Version" text.
    - Update "Recent Features" if a major module was released.

3.  **ROADMAP.md**:
    - Mark completed milestones as `[x]`.
    - Move current focus items to "Completed".

> **Note**: Do NOT update `docs/history.md` or `docs/versions.md`. We are deprecating them in favor of CHANGELOG.md.

## 2. Git Release

1.  Stage and commit changes:
    ```bash
    git add -A
    git commit -m "chore(release): vX.Y.Z"
    ```

2.  Create and push tag:
    ```bash
    git tag -a vX.Y.Z -m "Release vX.Y.Z"
    git push origin main --tags
    ```

## 3. Deploy

1.  **Backend (Cloud Run)**:
    - Run the safe deploy script:
    ```bash
    ./scripts/deploy.sh
    ```

2.  **Frontend (Vercel)**:
    - Automatically triggers on git push. No action needed unless manual override required.

## 4. Notify User

- Summarize the release (Version, Key Features, URLs).
- Confirm deployment status.
