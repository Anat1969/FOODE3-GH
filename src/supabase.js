import { createClient } from '@supabase/supabase-js';

// Shared ASHDODMAP project; this app's tables are prefixed foode_, buckets foode-
export const SUPABASE_URL = 'https://cbhexpybdggwzyakgagd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiaGV4cHliZGdnd3p5YWtnYWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDkzMjksImV4cCI6MjA5MTMyNTMyOX0.X1b7pLyig-bGfxM7XjmwH0TqiuhqoS_o-Czg5qdsN6o';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Editing is allowed only with a personal editor key, delivered as an edit link (?edit=KEY).
const KEY_STORAGE = 'foode3-editor-key';

function captureKeyFromUrl() {
  try {
    const url = new URL(window.location.href);
    const key = url.searchParams.get('edit');
    if (!key) return;
    localStorage.setItem(KEY_STORAGE, key);
    url.searchParams.delete('edit');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  } catch { /* storage blocked: editing stays off */ }
}
captureKeyFromUrl();

export function getEditorKey() {
  try { return localStorage.getItem(KEY_STORAGE) || ''; } catch { return ''; }
}

export function setEditorKey(key) {
  try { localStorage.setItem(KEY_STORAGE, key); } catch { /* storage blocked: editing stays off */ }
}

export function clearEditorKey() {
  try { localStorage.removeItem(KEY_STORAGE); } catch { /* ignore */ }
}

export async function checkEditor() {
  const key = getEditorKey();
  if (!key) return null;
  const { data, error } = await supabase.rpc('foode_editor', { p_key: key });
  if (error) return null;
  return data || null;
}

// table: positions | links | examples | documents | position_events; op: upsert | remove
export async function write(table, op, id, data = {}) {
  const { data: row, error } = await supabase.rpc('foode_write', {
    p_key: getEditorKey(),
    p_table: table,
    p_op: op,
    p_id: id,
    p_data: data,
  });
  if (error) throw error;
  return row;
}

// Uploads a file through a signed URL issued only to editors. Returns { publicUrl, path }.
export async function uploadFile(bucket, file, { folder = '', ext } = {}) {
  const extension = ext || (file.name && file.name.includes('.') ? file.name.split('.').pop() : 'bin');
  const { data, error } = await supabase.functions.invoke('foode-upload', {
    body: { key: getEditorKey(), bucket, folder, ext: extension },
  });
  if (error || !data?.token) throw new Error(data?.error || error?.message || 'ההעלאה נכשלה');
  const { error: upErr } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(data.path, data.token, file, { contentType: file.type || undefined });
  if (upErr) throw upErr;
  return { publicUrl: data.publicUrl, path: data.path };
}
