# Forms System - How To Guide

Internal documentation for the TherapistOS forms system.

---

## Overview

The forms system allows therapists to:
1. **Collect patient information** via customizable intake forms
2. **Assign forms to patients** with secure access links
3. **Share public forms** for lead generation ("Instagram Links")
4. **Track submissions** with automatic risk assessment

---

## Key Concepts

### Form Templates

Templates define the structure of a form. They can be:

| Type | Description | Example |
|------|-------------|---------|
| **System Template** | Global templates (no organization_id) | "Intake General" |
| **Organization Template** | Cloned from system, owned by org | "Intake General (Copy)" |

**To use a form:** Clone a system template to your organization first.

---

## Form Classifications

### Risk Level

Controls validation requirements and clinical flags.

| Level | Description | Behavior |
|-------|-------------|----------|
| `LOW` | Standard intake | No special handling |
| `MEDIUM` | Moderate screening | Flagged for review |
| `HIGH` | Clinical risk screening | Requires therapist review |
| `CRITICAL` | Medical/safety critical | **Cannot be published as public form** |

> **⚠️ Important:** CRITICAL risk forms cannot be made public. They require a patient assignment to ensure proper clinical oversight.

### Therapy Type

Categorizes the form by modality.

| Type | Icon | Use Case |
|------|------|----------|
| `GENERAL` | 📋 | Standard therapy intake |
| `ASTROLOGY` | ⭐ | Astrology/Human Design sessions |
| `SOMATIC` | 🧘 | Bodywork, breathwork, somatic therapy |
| `PSYCHEDELIC` | 🍄 | Psychedelic-assisted therapy |
| `INTEGRATION` | 🔄 | Integration sessions |

### Form Type

When in the clinical flow the form is used.

| Type | Description |
|------|-------------|
| `INTAKE` | Initial patient registration |
| `PRE_SESSION` | Before each session |
| `POST_SESSION` | After each session |
| `FEEDBACK` | General feedback/survey |

### Service Mode

How the service is delivered.

| Mode | Description |
|------|-------------|
| `ONE_ON_ONE` | Individual sessions |
| `GROUP` | Group sessions, retreats |

### Scheduling Type

How clients book the service.

| Type | Description |
|------|-------------|
| `CALENDAR` | Based on therapist availability |
| `FIXED_DATE` | Specific event date (e.g., retreat) |

---

## Form Flows

### 1. Patient Assignment Flow

For existing patients:

```
Therapist → Send Form → Patient receives link → Patient submits → Entry in timeline
```

**Steps:**
1. Go to patient profile
2. Click "Send Form"
3. Select form template
4. Patient receives magic link with prefilled data
5. Patient completes form
6. Submission appears in patient timeline as `FORM_SUBMISSION`

### 2. Public Lead Gen Flow

For new leads (no existing patient):

```
Public Form URL → New patient submits → Patient auto-created → Entry in timeline
```

**Steps:**
1. Go to `/forms` → My Forms
2. Click ⚙️ Settings on a form
3. Toggle "Publish" to activate public URL
4. Share the URL (copy link, QR code, WhatsApp)
5. When someone submits:
   - New patient is created with form data
   - Submission recorded as `FORM_SUBMISSION`
   - Appears in Form Submissions view

**Sharing options:**
- 🔗 **Copy Link** - Direct URL
- 📱 **QR Code** - Scannable code for print/display
- 💬 **WhatsApp** - One-click send (requires patient phone)

---

## Form Schema Structure

Forms are defined in the `schema` JSONB field:

```json
{
  "fields": [
    {
      "id": "full_name",
      "type": "text",
      "label": "Full Name",
      "required": true
    },
    {
      "id": "birth_date",
      "type": "date",
      "label": "Date of Birth"
    },
    {
      "id": "consent",
      "type": "boolean",
      "label": "I agree to the terms",
      "required": true
    },
    {
      "id": "therapy_before",
      "type": "radio",
      "label": "Have you done therapy before?",
      "options": ["Yes", "No", "In the past"]
    }
  ]
}
```

### Field Types

| Type | Description |
|------|-------------|
| `text` | Single line text |
| `textarea` | Multi-line text |
| `number` | Numeric input |
| `date` | Date picker |
| `boolean` | Yes/No checkbox |
| `radio` | Single selection from options |
| `select` | Dropdown selection |
| `emotion_multi` | Multi-select emotions (array) |

---

## Risk Assessment

Submissions are automatically assessed for clinical risk:

```python
risk_result = {
    "risk_level": "LOW" | "MEDIUM" | "HIGH",
    "flags": ["suicidal_ideation", "self_harm", ...],
    "requires_review": true | false
}
```

**Flagged submissions** appear with visual indicators in the timeline and form submissions list.

---

## Database Models

### FormTemplate

```
form_templates
├── id (UUID)
├── organization_id (NULL = system, UUID = org)
├── title
├── description
├── schema (JSONB - form fields)
├── risk_level (enum)
├── therapy_type (enum)
├── form_type (enum)
├── service_mode (enum)
├── scheduling_type (enum)
├── public_token (NULL = not public, string = published)
├── is_active (bool)
└── timestamps
```

### FormAssignment

```
form_assignments
├── id (UUID)
├── patient_id (FK)
├── template_id (FK)
├── status (SENT | OPENED | COMPLETED | EXPIRED)
├── token (unique access token)
├── valid_until (expiration)
├── opened_at
├── completed_at
└── created_at
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/forms/templates` | GET | List organization templates |
| `/forms/templates/system` | GET | List system templates |
| `/forms/templates/{id}` | GET | Get template details |
| `/forms/templates/{id}` | PUT | Update template |
| `/forms/templates/{id}/publish` | POST | Toggle public status |
| `/forms/templates/clone/{id}` | POST | Clone system template |
| `/forms/assign` | POST | Assign form to patient |
| `/forms/assignments/template/{id}` | GET | List assignments for template |

---

## Security Notes

1. **Public forms**: Only organization templates can be published (not system templates)
2. **CRITICAL forms**: Cannot be made public - require patient assignment
3. **Tokens**: Form access tokens are URL-safe, unique, and have expiration
4. **Multi-tenancy**: All queries filter by `organization_id`
