

Manually Create the Table: Go to your Supabase project, navigate to SQL Editor, and run the following SQL to create the readings table:

```sql

CREATE TABLE readings (
  id SERIAL PRIMARY KEY,
  meter_id VARCHAR(255),
  reading FLOAT,
  timestamp TIMESTAMP
);

```




 First open two terminals.
 Then CD into frontend and backend
 First you need to start the service by running : node server2.js
 Then start the react app by running : npm run start