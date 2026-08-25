# SAP Cloud ALM CDM Features API – Postman Collection

This directory contains a Postman collection and environment template for the
SAP Cloud ALM **CDM Features API** (`calm-features/v1`).

## Files

| File | Description |
|------|-------------|
| `CDM_Features_API.postman_collection.json` | Request collection with 6 folders covering all major operations |
| `CDM_Features_API.postman_environment.json` | Environment template — fill in your tenant details |

## Setup

1. **Import both files** into Postman via *File → Import*.
2. **Select the environment** `SAP Cloud ALM CDM Features API` in the top-right dropdown.
3. **Fill in the environment variables**:

| Variable | Where to find it |
|----------|-----------------|
| `ACCESS_TOKEN_URL` | Full OAuth2 token endpoint from your BTP service key, e.g. `https://<identityzone>.authentication.eu10.hana.ondemand.com/oauth/token` |
| `CLIENT_ID` | OAuth2 client ID from BTP Cockpit service key |
| `CLIENT_SECRET` | OAuth2 client secret — keep this secure |
| `BASE_URL` | Your production base URL — **no trailing slash**, e.g. `https://mytenant.eu10.alm.cloud.sap/api/calm-features/v1`. Set the full literal URL; Postman does not expand variables nested inside a variable value. |
| `PROJECT_UUID` | UUID of the project to create Features in — visible in the URL when you open the project in SAP Cloud ALM, or via GET `/Projects` on the calm-projects API |

The pre-request script fetches an OAuth2 bearer token automatically before each request.

### Auto-populated variables

The following variables are set automatically by test scripts after successful POST requests —
you do not need to copy values manually:

| Variable | Set by | Used by |
|----------|--------|---------|
| `FEATURE_UUID` | POST Feature (minimal / with references) | All single-feature and reference requests |
| `URL_REF_UUID` | POST Feature URLReference | DELETE URLReference by uuid |
| `EXT_REF_ID` | POST Feature ExternalReference | DELETE ExternalReference (composite key) |

> **Note:** `EXT_REF_ID` is stored URL-encoded (colons → `%3A`) because it appears directly
> in a URL path segment. The test script encodes it automatically.

## Sandbox (no credentials required)

Use the **6 - Sandbox (read-only, no credentials)** folder for read-only requests without credentials:

1. Set `APIKEY` in the environment with your free key from [SAP API Business Hub](https://api.sap.com).
2. Requests in this folder use `{{SANDBOX_BASE_URL}}` and the `apikey` header — no OAuth2 setup needed.

If OAuth2 credentials (`ACCESS_TOKEN_URL`, `CLIENT_ID`, `CLIENT_SECRET`) are missing, the
pre-request script logs a warning to the Postman Console and skips token fetching. For sandbox
requests this is expected; for production requests it means the call will return 401.

## Collection Folders

| Folder | Operations |
|--------|-----------|
| 0 - Reference Data | GET FeatureStatus, GET FeaturePriorities |
| 1 - Read Features | Basic list, filter + expand, count + pagination, single Feature |
| 2 - Create and Update | POST Feature (minimal and with references), PATCH Feature |
| 3 - URL References | GET, POST, DELETE URL References |
| 4 - External References | GET, idempotency check, POST, DELETE External References |
| 5 - Related Entities (read-only) | GET Task Assignments, Transports, Transport References (read-only) |
| 6 - Sandbox (read-only, no credentials) | Read-only requests using API key header |

## Required OAuth2 Scopes

| Scope | Required for |
|-------|-------------|
| `calm-api.features.read` | All GET requests |
| `calm-api.features.write` | POST and PATCH requests |

## API Reference

- Production base URL: `https://<tenant>.<region>.alm.cloud.sap/api/calm-features/v1`
- Sandbox base URL: `https://sandbox.api.sap.com/SAPCALM/calm-features/v1`
- [SAP API Business Hub – CDM Features API](https://api.sap.com/api/CDM_FEATURES_API/overview)
