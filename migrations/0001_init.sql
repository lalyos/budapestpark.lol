CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  event_date TEXT NOT NULL,
  event_time TEXT,
  price TEXT,
  image TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO events (title, event_date, event_time, price, image) VALUES
  ('Opening Night: PARK BEATS', '2026-07-04', '19:00', 'HUF 8 900', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1000'),
  ('Electronic Summer', '2026-07-12', '20:00', 'HUF 11 500', 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1000'),
  ('Late Night Live', '2026-08-02', '19:30', 'HUF 9 900', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1000');
