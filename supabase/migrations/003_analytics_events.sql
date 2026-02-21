CREATE TABLE analytics_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  text NOT NULL,  -- 'page_view' | 'estimate_calculated' | 'estimate_saved' | 'user_signed_up' | 'error' | 'estimate_deleted'
  event_data  jsonb,          -- flexible payload (subject ids, season, error message, page path, etc.)
  session_id  text,
  user_id     uuid,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_analytics_events_type    ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at);

-- No RLS — service role only, no public access
