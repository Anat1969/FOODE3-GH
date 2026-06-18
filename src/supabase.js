import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qgdubavuvvnpasgijyrk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZHViYXZ1dnZucGFzZ2lqeXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3OTY2NjAsImV4cCI6MjA5NzM3MjY2MH0.TanuVnw1W1lKW_cJQmWk0xSPj-Xsb516W0ajE6Ntuw0';

export const supabase = createClient(supabaseUrl, supabaseKey);
