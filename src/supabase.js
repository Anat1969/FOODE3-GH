import { createClient } from '@supabase/supabase-js';

// Shared ASHDODMAP project; this app's tables are prefixed foode_
const supabaseUrl = 'https://cbhexpybdggwzyakgagd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiaGV4cHliZGdnd3p5YWtnYWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDkzMjksImV4cCI6MjA5MTMyNTMyOX0.X1b7pLyig-bGfxM7XjmwH0TqiuhqoS_o-Czg5qdsN6o';

export const supabase = createClient(supabaseUrl, supabaseKey);
