

Manually Create the Table: Go to your Supabase project, navigate to SQL Editor, and run the following SQL to create the readings table:

```sql

CREATE TABLE IF NOT EXISTS readings (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  reading REAL NOT NULL
);

```