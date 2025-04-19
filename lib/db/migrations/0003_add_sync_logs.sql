CREATE TABLE IF NOT EXISTS sync_logs (
  id SERIAL PRIMARY KEY,
  sync_time TIMESTAMP DEFAULT NOW(),
  total_tenders INTEGER,
  new_tenders_count INTEGER
); 