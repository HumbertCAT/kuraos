# Testing Guide - The Immune System

> **The Immune System QA Architecture** - From zero tests to self-healing infrastructure

---

## 🎯 Philosophy

Kura OS implements a **5-layer immune system** for quality assurance, inspired by biological immunity:

| Layer | Name | Technology | Coverage |
|-------|------|------------|----------|
| 1 | **Innate Immunity** | Pytest + testcontainers | Backend logic |
| 2 | **Adaptive Immunity** | Playwright | Frontend E2E |
| 3 | **Cognitive Immunity** | Vertex AI | AI semantic quality |
| 4 | **Nervous System** | GitHub Actions + Cloud Build | CI/CD automation |
| 5 | **Communication** | Mailpit | Email flows |

Each layer validates a different aspect of the system, creating defense in depth.

---

## 📂 Structure

```
kuraos/
├── backend/
│   ├── tests/
│   │   ├── conftest.py          # Fixtures (DB, Mailpit, Auth)
│   │   ├── factories.py         # Test data factories
│   │   ├── test_*.py            # Unit tests
│   │   ├── test_emails.py       # Email flow tests
│   │   └── ai/
│   │       ├── data/golden_dataset.json
│   │       └── evaluate_aletheia.py
│   └── requirements-test.txt    # Test dependencies
│
└── apps/platform/
    ├── tests/
    │   ├── global-setup.ts      # Auth bypass
    │   ├── dashboard.spec.ts    # Dashboard E2E
    │   └── auth-flow.spec.ts    # Email magic links
    └── playwright.config.ts
```

---

## 🚀 Running Tests

### Quick Start

```bash
# Run all test layers
./scripts/test.sh all

# Run specific layer
./scripts/test.sh innate     # Backend
./scripts/test.sh adaptive   # Frontend
./scripts/test.sh cognitive  # AI
./scripts/test.sh email      # Mailpit
```

### Layer 1: Innate Immunity (Backend)

**What it tests:** API endpoints, database logic, business rules

```bash
cd backend
.venv/bin/pytest tests/ --verbose
```

**Key features:**
- Testcontainers PostgreSQL (ephemeral per run)
- Function-scoped engines (avoid event loop conflicts)
- Factory-Boy for test data generation

**Example test:**
```python
@pytest.mark.asyncio
async def test_create_patient(db_session, authenticated_user):
    user, org = authenticated_user
    
    patient = PatientFactory(organization_id=org.id)
    db_session.add(patient)
    await db_session.commit()
    
    assert patient.id is not None
```

### Layer 2: Adaptive Immunity (Frontend)

**What it tests:** User flows, navigation, UI interactions

```bash
cd apps/platform
E2E_TEST_EMAIL=e2e.playwright@gmail.com \
E2E_TEST_PASSWORD=E2ETestPassword123! \
pnpm exec playwright test
```

**Key features:**
- Global auth bypass (cookies saved once)
- Hydration marker (`data-hydrated="true"`)
- Page object patterns

**Example test:**
```typescript
test('should load dashboard', async ({ page }) => {
  await page.goto('/es/dashboard');
  await page.waitForSelector('body[data-hydrated="true"]');
  
  await expect(page.locator('h1')).toBeVisible();
});
```

### Layer 3: Cognitive Immunity (AI)

**What it tests:** AletheIA clinical analysis quality

```bash
cd backend
.venv/bin/python tests/ai/evaluate_aletheia.py
```

**How it works:**
1. Runs AletheIA on golden dataset (3 synthetic cases)
2. Uses Vertex AI Gemini as "judge"
3. Validates risk scores against expected criteria
4. Exit code 0 = pass, 1 = fail

**Requirements:**
- `GOOGLE_APPLICATION_CREDENTIALS` set
- Vertex AI enabled in europe-west1

### Layer 5: Communication Immunity (Email)

**What it tests:** Password reset, invitation emails

```bash
cd backend
.venv/bin/pytest tests/test_emails.py --verbose
```

**How it works:**
- Mailpit testcontainer captures SMTP
- Tests extract links from email body  
- Validates recipient, subject, content
- No real emails sent!

---

## ✍️ Writing Tests

### Backend: Using Factories

Create realistic test data with Factory-Boy:

```python
from tests.factories import OrganizationFactory, UserFactory, PatientFactory

# Create connected entities
org = OrganizationFactory()
user = UserFactory(organization=org)
patient = PatientFactory(organization=org)
```

**Available factories:**
- `OrganizationFactory`
- `UserFactory`
- `PatientFactory`

### Frontend: Page Objects

Structure E2E tests around user actions:

```typescript
test('complete password reset', async ({ page }) => {
  // Navigate
  await page.goto('/forgot-password');
  
  // Interact
  await page.fill('input[type="email"]', 'test@example.com');
  await page.click('button[type="submit"]');
  
  // Assert
  await expect(page.locator('text=/check your email/i')).toBeVisible();
});
```

### Email Testing: Magic Links

Extract and follow links from captured emails:

```python
def test_password_reset_email(client, mailpit_client):
    # Trigger email
    await client.post("/api/v1/auth/forgot-password", json={"email": "test@example.com"})
    
    # Get from Mailpit
    messages = mailpit_client.get_messages()
    email = mailpit_client.get_message(messages[0]["ID"])
    
    # Extract link
    link = extract_reset_link(email["HTML"])
    assert "token=" in link
```

---

## 🔄 CI/CD Integration

### GitHub Actions (PR Checks)

**Trigger:** Pull requests  
**Runs:**  Phase 1 (Innate) only  
**Speed:** < 10 minutes

```yaml
# .github/workflows/ci-innate.yml
- run: pytest tests/ --verbose
```

### Cloud Build (Main Pipeline)

**Trigger:** Push to main  
**Runs:** All layers + deployment  
**Steps:**
1. Build production image
2. Run backend tests
3. Run Playwright E2E
4. Validate AI script
5. Deploy to Cloud Run

```yaml
# cloudbuild.yaml
- name: python:3.12-slim
  args: ['pytest', 'tests/']
```

---

## 🧠 Antigravity Loop (AI Test Generation)

Generate tests from code diffs using Vertex AI:

```bash
cd backend
python scripts/generate_tests.py
```

**How it works:**
1. Reads `git diff origin/main`
2. Sends to Gemini 2.0 Flash
3. Generates pytest test file
4. Saves to `tests/generated/`

**Manual trigger:**
Via GitHub Actions workflow_dispatch

---

## 🐛 Troubleshooting

### "Testcontainer timeout"

**Cause:** Docker not running  
**Fix:** Start Docker Desktop

### "Playwright browsers not found"

**Cause:** Browsers not installed  
**Fix:** `cd apps/platform && pnpm exec playwright install`

### "Mailpit connection refused"

**Cause:** Port conflict  
**Fix:** Testcontainers uses random ports automatically

### "Vertex AI authentication error"

**Cause:** No credentials  
**Fix:** `export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json`

---

## 📊 Test Coverage Goals

| Layer | Current | Target |
|-------|---------|--------|
| Backend | 10+ tests | 50+ |
| Frontend | 7 E2E | 20+ |
| Email | 4 tests | 10+ |
| AI Eval | 3 cases | 10+ |

---

## 🎓 Best Practices

1. **Test Isolation:** Each test should be independent
2. **Factory Pattern:** Use factories instead of hardcoded data
3. **Descriptive Names:** `test_forgot_password_sends_email` not `test_1`
4. **Async Awareness:** Use `@pytest.mark.asyncio` for async tests
5. **Clean Fixtures:** Mailpit and DB clean between tests automatically
6. **Polling Not Waiting:** Use `expect.poll()` for async UI updates

---

## 📚 Further Reading

- [Pytest Documentation](https://docs.pytest.org/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Factory Boy Guide](https://factoryboy.readthedocs.io/)
- [Vertex AI Evaluation](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/evaluation)
