"use client";

import { useEffect } from "react";
import { trackUsage } from "@/lib/usage/storage";
import { createClient } from "@/lib/supabase/client";

export function TrackUsage({ toolId }: { toolId: string }) {
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      trackUsage(toolId, user?.id);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
