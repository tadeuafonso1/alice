// Supabase client configuration
// Use environment variables with fallback to current values
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://nvtlirmfavhahwtsdchk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52dGxpcm1mYXZoYWh3dHNkY2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MDgwNDQsImV4cCI6MjA3OTQ4NDA0NH0.KCq4Mre83Iwqppt70XXXOkVTvnwDJE9Ss341jyRAOCI";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);