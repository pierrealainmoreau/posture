-- Index on usage.user_id for rate-limit COUNT queries
-- Without this, checkRateLimit() does a full table scan on every Anthropic API call.
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON public.usage(user_id);

-- Restrict the COUNT to the current month to keep it O(recent rows) as the table grows.
-- This requires updating rateLimit.ts to add: .gte('created_at', date_trunc('month', now()))
-- For now the index alone is the main win.
