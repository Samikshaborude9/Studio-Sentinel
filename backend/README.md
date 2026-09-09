# Backend deployment

The direct Supabase host (`db.<project-ref>.supabase.co:5432`) may resolve only to IPv6. Render instances can fail to reach it with `Network is unreachable`.

In Supabase, open **Connect**, choose **Session pooler**, and copy the URI using port `5432`. Set that full URI in Render as `SUPABASE_POOLER_URL`. The backend prefers this variable over `DATABASE_URL` and uses the `psycopg` driver automatically.

In Render, remove any direct `db.<project-ref>.supabase.co` value from `DATABASE_URL` and set `SUPABASE_POOLER_URL` to the copied pooler URI. A direct Supabase URL resolves to an IPv6 address that Render cannot reach.

Keep `DATABASE_URL` for local development when needed. Do not commit database URIs or credentials.