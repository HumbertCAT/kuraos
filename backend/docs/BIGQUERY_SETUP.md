# BigQuery Billing Export Setup

**Required for v1.1.10 Cost Reconciliation**

## Step 1: Create BigQuery Dataset

### Option A: Via GCP Console (Recommended)

1. Go to [BigQuery Console](https://console.cloud.google.com/bigquery?project=kura-os)
2. Click the three dots next to project `kura-os`
3. Click "Create dataset"
4. Fill in:
   - Dataset ID: `kura_billing_export`
   - Data location: `EU` (multi-region)
   - Description: "Kura OS Billing Export for Cost Reconciliation"
5. Click "CREATE DATASET"

### Option B: Via CLI

```bash
bq --project_id=kura-os --location=EU mk -d \
  --description "Kura OS Billing Export for Cost Reconciliation" \
  kura_billing_export
```

## Step 2: Enable Billing Export

1. Go to [GCP Billing Console](https://console.cloud.google.com/billing)
2. Select your billing account
3. Navigate to "Billing export" in the left menu
4. Click on "BigQuery export" tab
5. Click "EDIT SETTINGS" for "Standard usage cost"
6. Select:
   - Project: `kura-os`
   - Dataset: `kura_billing_export` (the one you just created)
7. Click "SAVE"

**Note:** GCP will automatically create a table with a name like `gcp_billing_export_v1_XXXXXX` in this dataset.

## Step 3: Get Table ID

After 24-48 hours (once BigQuery starts populating):

1. Go back to [BigQuery Console](https://console.cloud.google.com/bigquery?project=kura-os)
2. Expand `kura-os` → `kura_billing_export`
3. You should see a table like `gcp_billing_export_v1_XXXXXX`
4. Copy the full table ID

## Step 4: Configure Backend

Add to backend `.env` file:

```env
# BigQuery Billing Export (v1.1.10 - Cost Reconciliation)
# Format: project.dataset.table
BILLING_TABLE_ID=kura-os.kura_billing_export.gcp_billing_export_v1_XXXXXX
```

Replace `XXXXXX` with the actual suffix from your table name.

## Step 5: Verify Setup

After deploying the backend with this configuration:

```bash
curl https://api.kuraos.ai/api/v1/finance/reconciliation/global?days=7 \
  -H "Cookie: access_token=YOUR_ADMIN_TOKEN"
```

Expected response:
```json
{
  "period": {"start": "...", "end": "...", "days": 7},
  "costs": {
    "internal_total_usd": 150.00,
    "gcp_total_usd": 152.30,
    "drift_usd": 2.30,
    "drift_pct": 1.53
  },
  "status": "healthy",
  "interpretation": "Cost tracking is accurate. Internal ledger matches Google billing."
}
```

## Troubleshooting

**"No table found"**: Wait 24-48h after enabling Billing Export

**"Permission denied"**: Ensure Cloud Run service account has `bigquery.dataViewer` role

**"BILLING_TABLE_ID not configured"**: Check `.env` file is loaded correctly
