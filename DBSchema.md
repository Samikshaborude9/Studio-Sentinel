# Database Schema

The `studio-sentinel` project uses **SQLite** as its database. The data is stored locally in a file named `incidents.db` within the `backend` directory. The schema is defined using `SQLModel`.

## Tables

### `Incident`
The `Incident` table tracks the automated lifecycle of an anomaly or incident across the different studio services.

| Column | Data Type | Constraints & Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR` | Primary Key | Unique 12-character hex identifier (UUID-based). |
| `service` | `VARCHAR` | Not Null | Name of the service where the incident occurred (e.g., `ingest`, `transcode`, `render`, `distribution`). |
| `state` | `VARCHAR` | Default: `"DETECTED"` | The current phase of the incident. Possible values: `DETECTED`, `INVESTIGATING`, `AWAITING_APPROVAL`, `REMEDIATING`, `RESOLVED`, `REJECTED`. |
| `created_at` | `DATETIME` | Default: `utcnow()` | Timestamp (UTC) when the incident was detected. |
| `updated_at` | `DATETIME` | Default: `utcnow()` | Timestamp (UTC) indicating the last update. |
| `findings_json` | `TEXT` | Nullable | JSON string containing data extracted during the `investigate` phase. |
| `recommendation_json` | `TEXT` | Nullable | JSON string containing the AI agent's recommendations for remediation. |
| `report_json` | `TEXT` | Nullable | JSON string detailing the results and stats after the `execute` phase. |
| `error` | `TEXT` | Nullable | Stores any application errors or exceptions that caused the incident process to fail. |
