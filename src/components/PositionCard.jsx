import { useState, useRef, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import ImageUpload from './ImageUpload.jsx';
import { uploadFile } from '../supabase.js';
import { ASHDOD_CENTER } from '../hooks/usePositions.js';
import {
  APPROVAL_OPTIONS, BUILDING_OPTIONS, ENV_OPTIONS, HARMONICA_OPTIONS,
  approvalTone, qualityTone, harmonicaTone, withCurrent,
} from '../utils/colors.js';

export const CARD_TABS = [
  ['details', 'פרטים'],
  ['infra', 'תשתיות ואיכות'],
  ['harmonica', 'הרמוניקה'],
  ['docs', 'מסמכים'],
  ['history', 'היסטוריה'],
];

const EVENT_LABELS = {
  correction: 'הערה לתיקון',
  approval: 'אישור',
  email: 'מייל ליזם',
  submission: 'הגשה',
  status: 'שינוי סטטוס',
  note: 'רישום',
};

export function formatDate(value, withTime = true) {
  if (!value) return '';
  const d = new Date(value);
  const date = d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return withTime ? `${date} ${d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}` : date;
}

const toDateInput = (value) => {
  const d = value ? new Date(value) : new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

// Keeps the time of day when only the date changes, so the order within a day stays stable.
const fromDateInput = (dateStr, previous) => {
  const base = previous ? new Date(previous) : new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  base.setFullYear(y, m - 1, d);
  return base.toISOString();
};

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function isPinned(mapPin) {
  if (!mapPin) return false;
  return Math.abs(mapPin.x - ASHDOD_CENTER.x) > 0.0001 || Math.abs(mapPin.y - ASHDOD_CENTER.y) > 0.0001;
}

const isUrl = (s) => /^https?:\/\/\S+$/i.test(String(s || '').trim());

function Pill({ tone, children }) {
  return <span className={`pill ${tone}`}>{children || '—'}</span>;
}

function Field({ label, children, wide }) {
  return (
    <div className={`card-field ${wide ? 'wide' : ''}`} role="group" aria-label={label}>
      <span className="card-label">{label}</span>
      {children}
    </div>
  );
}

// Text that is always editable for editors: looks like a value, becomes an input on focus.
function EditText({ canEdit, value, onChange, multiline, placeholder = 'לא הוזן', dir, type = 'text', className = '' }) {
  if (!canEdit) {
    if (!value) return <span className="card-value empty">לא הוזן</span>;
    if (type === 'email') return <a className="card-value" dir="ltr" href={`mailto:${value}`}>{value}</a>;
    if (type === 'tel') return <a className="card-value" dir="ltr" href={`tel:${value}`}>{value}</a>;
    return <span className={`card-value ${multiline ? 'multiline' : ''} ${className}`} dir={dir}>{value}</span>;
  }
  return multiline
    ? <textarea className={`inline-field ${className}`} value={value || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} rows={3} />
    : <input className={`inline-field ${className}`} type={type} dir={dir} value={value || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} />;
}

// Text saved on blur (for history and documents, which save each call immediately).
function DraftText({ canEdit, value, onSave, multiline, placeholder }) {
  const [draft, setDraft] = useState(value || '');
  useEffect(() => { setDraft(value || ''); }, [value]);
  if (!canEdit) return <span className="card-value multiline">{value}</span>;
  const commit = () => { if (draft.trim() && draft !== value) onSave(draft.trim()); };
  return multiline
    ? <textarea className="inline-field" rows={2} value={draft} placeholder={placeholder} onChange={e => setDraft(e.target.value)} onBlur={commit} />
    : <input className="inline-field" value={draft} placeholder={placeholder} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()} />;
}

function EditSelect({ canEdit, value, options, onChange, tone }) {
  if (!canEdit) return <Pill tone={tone(value)}>{value}</Pill>;
  return (
    <select className={`pill-select tone-${tone(value)}`} value={value || ''} onChange={e => onChange(e.target.value)}>
      {withCurrent(options, value).map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function EditToggle({ canEdit, value, onChange }) {
  const good = value === 'טוב';
  if (!canEdit) return <Pill tone={good ? 'green' : 'red'}>{good ? 'תקין' : 'לא תקין'}</Pill>;
  return (
    <div className="segmented" role="group">
      <button type="button" className={good ? 'on green' : ''} onClick={() => onChange('טוב')}>תקין</button>
      <button type="button" className={!good ? 'on red' : ''} onClick={() => onChange('לא טוב')}>לא תקין</button>
    </div>
  );
}

function EditDate({ canEdit, value, onSave }) {
  if (!canEdit) return <span className="timeline-date">{formatDate(value, false)}</span>;
  return <input type="date" className="date-field" value={toDateInput(value)} onChange={e => e.target.value && onSave(fromDateInput(e.target.value, value))} />;
}

// Drop files, paste files or a link, pick files, or type a link.
function DocDropzone({ label, busy, onFiles, onLink }) {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');

  const addLink = () => {
    const url = link.trim().match(/^https?:\/\//) ? link.trim() : `https://${link.trim()}`;
    if (!link.trim()) return;
    onLink(url, title.trim());
    setLink(''); setTitle('');
  };

  const onPaste = (e) => {
    const files = [...(e.clipboardData?.files || [])];
    if (files.length) { e.preventDefault(); onFiles(files); return; }
    const text = e.clipboardData?.getData('text')?.trim();
    if (isUrl(text) && e.target.tagName !== 'INPUT') { e.preventDefault(); onLink(text, ''); }
  };

  return (
    <div className="doc-drop">
      <div
        className={`dropzone ${over ? 'over' : ''} ${busy ? 'busy' : ''}`}
        tabIndex={0}
        role="button"
        aria-label={label}
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={e => {
          e.preventDefault(); setOver(false);
          const files = [...(e.dataTransfer?.files || [])];
          if (files.length) return onFiles(files);
          const text = e.dataTransfer?.getData('text/uri-list') || e.dataTransfer?.getData('text');
          if (isUrl(text)) onLink(text.trim(), '');
        }}
        onPaste={onPaste}
      >
        <strong>{busy ? 'מעלה…' : label}</strong>
        <span>גרירה לכאן, הדבקה (Ctrl+V) או לחיצה לבחירת קבצים</span>
      </div>
      <div className="link-row" onPaste={e => e.stopPropagation()}>
        <input className="inline-field boxed" dir="ltr" placeholder="https://" value={link} onChange={e => setLink(e.target.value)} onKeyDown={e => e.key === 'Enter' && addLink()} />
        <input className="inline-field boxed" placeholder="שם הקישור (לא חובה)" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addLink()} />
        <button type="button" className="btn" disabled={!link.trim()} onClick={addLink}>הוספת קישור</button>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.dwg,.dxf,.zip,image/*"
        onChange={e => { const files = [...(e.target.files || [])]; e.target.value = ''; if (files.length) onFiles(files); }}
      />
    </div>
  );
}

function DocList({ docs, canEdit, onRemove, onRename, numbered }) {
  if (!docs.length) return <p className="card-empty">אין מסמכים עדיין.</p>;
  return (
    <ul className="doc-list">
      {docs.map((d, i) => (
        <li key={d.id} className="doc-row">
          <span className="doc-version">{numbered ? `גרסה ${docs.length - i}` : d.mime === 'text/uri-list' ? 'קישור' : 'קובץ'}</span>
          <div className="doc-title-wrap">
            {canEdit
              ? <DraftText canEdit value={d.title} onSave={t => onRename(d, t)} />
              : <span className="doc-title-text">{d.title || 'מסמך'}</span>}
            <span className="doc-meta">{formatDate(d.created_at)}{d.uploaded_by ? ` · ${d.uploaded_by}` : ''}{d.size ? ` · ${formatSize(d.size)}` : ''}</span>
          </div>
          <div className="doc-actions">
            <a className="btn small" href={d.file_url} target="_blank" rel="noreferrer">פתיחה</a>
            {canEdit && <button type="button" className="text-button danger" onClick={() => onRemove(d)}>הסרה</button>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function PositionCard({
  position, editor, docs, events, tab, setTab, onClose,
  update, changeApproval, remove, saveDoc, removeDoc, saveEvent, removeEvent,
  onPin, onShowOnMap, notify, cardLink,
}) {
  const [uploading, setUploading] = useState(null);
  const [newCorrection, setNewCorrection] = useState('');
  const [newNote, setNewNote] = useState('');
  const [noteDate, setNoteDate] = useState(() => toDateInput());
  const canEdit = Boolean(editor);
  const p = position;
  const set = (key) => (value) => update(p.id, { [key]: value });

  const harmonicaDocs = useMemo(() => docs.filter(d => d.kind === 'harmonica').reverse(), [docs]);
  const generalDocs = useMemo(() => docs.filter(d => d.kind !== 'harmonica').reverse(), [docs]);
  const corrections = useMemo(() => events.filter(e => e.kind === 'correction').reverse(), [events]);
  const openCorrections = corrections.filter(c => !c.resolved);
  const history = useMemo(() => [...events].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))), [events]);

  const logEvent = (kind, body, meta = {}) =>
    saveEvent(crypto.randomUUID(), { position_id: p.id, kind, body, author: editor || '', meta }).catch(() => {});

  const setHarmonica = (status) => {
    if (status === p.harmonicaStatus) return;
    const approved = status === 'מאושרת';
    update(p.id, {
      harmonicaStatus: status,
      harmonicaApprovedAt: approved ? new Date().toISOString() : '',
      harmonicaApprovedBy: approved ? editor : '',
    });
    logEvent(approved ? 'approval' : 'status', approved ? 'ההרמוניקה אושרה' : `סטטוס הרמוניקה: ${status}`);
    notify(approved ? 'ההרמוניקה אושרה' : `סטטוס הרמוניקה: ${status}`);
  };

  const afterHarmonicaAdded = () => {
    if (p.harmonicaStatus === 'לא הוגשה' || p.harmonicaStatus === 'נדרש תיקון') update(p.id, { harmonicaStatus: 'הוגשה' });
  };

  const uploadDocs = async (files, kind) => {
    setUploading(kind);
    try {
      for (const file of files) {
        const { publicUrl, path } = await uploadFile('foode-docs', file, { folder: p.id });
        await saveDoc(crypto.randomUUID(), {
          position_id: p.id, kind, title: file.name || 'קובץ מודבק', file_url: publicUrl, file_path: path,
          mime: file.type || '', size: file.size || 0, uploaded_by: editor || '',
        });
        logEvent(kind === 'harmonica' ? 'submission' : 'note', `${kind === 'harmonica' ? 'הוגשה הרמוניקה' : 'צורף מסמך'}: ${file.name || 'קובץ מודבק'}`);
      }
      if (kind === 'harmonica') afterHarmonicaAdded();
      notify(files.length > 1 ? `${files.length} קבצים צורפו` : 'הקובץ צורף');
    } catch (err) {
      notify(`ההעלאה נכשלה: ${err.message}`, 'error');
    } finally {
      setUploading(null);
    }
  };

  const addLinkDoc = (url, title, kind) => {
    let name = title;
    if (!name) { try { name = new URL(url).hostname.replace(/^www\./, ''); } catch { name = url; } }
    saveDoc(crypto.randomUUID(), {
      position_id: p.id, kind, title: name, file_url: url, mime: 'text/uri-list', size: 0, uploaded_by: editor || '',
    }).then(() => notify('הקישור נוסף')).catch(() => {});
    logEvent(kind === 'harmonica' ? 'submission' : 'note', `${kind === 'harmonica' ? 'הוגש קישור להרמוניקה' : 'נוסף קישור'}: ${name}`);
    if (kind === 'harmonica') afterHarmonicaAdded();
  };

  const renameDoc = (d, title) => saveDoc(d.id, { title }).catch(() => {});

  const addCorrection = () => {
    const body = newCorrection.trim();
    if (!body) return;
    saveEvent(crypto.randomUUID(), { position_id: p.id, kind: 'correction', body, author: editor || '' })
      .then(() => notify('ההערה נשמרה')).catch(() => {});
    setNewCorrection('');
    if (p.harmonicaStatus !== 'נדרש תיקון' && p.harmonicaStatus !== 'מאושרת') update(p.id, { harmonicaStatus: 'נדרש תיקון' });
  };

  const addNote = () => {
    const body = newNote.trim();
    if (!body) return;
    saveEvent(crypto.randomUUID(), {
      position_id: p.id, kind: 'note', body, author: editor || '', created_at: fromDateInput(noteDate),
    }).then(() => notify('נשמר ביומן')).catch(() => {});
    setNewNote('');
  };

  const emailDeveloper = () => {
    if (!p.developerEmail) {
      notify('חסרה כתובת דוא"ל של היזם. אפשר להוסיף אותה בלשונית פרטים.', 'error');
      setTab('details');
      return;
    }
    const title = `עמדה ${p.number} – ${p.positionName}`;
    const subject = openCorrections.length ? `הערות לתיקון הרמוניקה – ${title}` : `הרמוניקה – ${title}`;
    const lines = [
      `שלום ${p.developerName || ''},`.trim(),
      '',
      openCorrections.length
        ? `להלן ההערות לתיקון ההרמוניקה של ${title}:`
        : `עדכון לגבי ההרמוניקה של ${title}. סטטוס נוכחי: ${p.harmonicaStatus}.`,
      ...openCorrections.slice().reverse().map((c, i) => `${i + 1}. ${c.body}`),
      '',
      `כרטיס העמדה: ${cardLink('harmonica')}`,
      '',
      editor || '',
    ];
    window.location.href = `mailto:${encodeURIComponent(p.developerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    logEvent('email', `נשלח מייל ליזם (${p.developerEmail})${openCorrections.length ? ` עם ${openCorrections.length} הערות לתיקון` : ''}`, { to: p.developerEmail, corrections: openCorrections.map(c => c.id) });
  };

  const copyCardLink = async () => {
    try { await navigator.clipboard.writeText(cardLink(tab)); notify('הקישור לכרטיס הועתק'); }
    catch { notify('לא ניתן להעתיק אוטומטית', 'error'); }
  };

  const tabCount = { docs: generalDocs.length, history: history.length, harmonica: openCorrections.length };

  return (
    <motion.aside
      className="position-card"
      role="dialog"
      aria-label={`כרטיס עמדה ${p.number}`}
      initial={{ x: 48, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 48, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 34 }}
    >
      <header className="card-head">
        <div className="card-head-text">
          <span className="mono-label">עמדה {p.number}{p.complexName ? ` · ${p.complexName}` : ''}</span>
          {canEdit
            ? <input className="inline-field card-title-input" aria-label="שם עמדה" value={p.positionName || ''} onChange={e => update(p.id, { positionName: e.target.value })} />
            : <h2>{p.positionName || 'ללא שם'}</h2>}
          <div className="card-pills">
            <Pill tone={approvalTone(p.approval)}>{p.approval}</Pill>
            <Pill tone={harmonicaTone(p.harmonicaStatus)}>הרמוניקה: {p.harmonicaStatus || 'לא הוגשה'}</Pill>
            {!canEdit && <span className="pill gray">תצוגה בלבד</span>}
          </div>
        </div>
        <div className="card-head-actions">
          <button type="button" className="btn small" onClick={copyCardLink}>העתקת קישור לכרטיס</button>
          <button type="button" className="btn small ghost" onClick={onClose}>סגירה</button>
        </div>
      </header>

      <nav className="card-tabs" role="tablist">
        {CARD_TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
            {label}
            {tabCount[id] ? <span className="tab-count">{tabCount[id]}</span> : null}
            {tab === id && <span className="tab-line" />}
          </button>
        ))}
      </nav>

      <div className="card-body">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {tab === 'details' && (
            <div className="card-section">
              <div className="card-photo">
                {canEdit ? (
                  <ImageUpload value={p.foodTruckImageUrl} onChange={set('foodTruckImageUrl')} alt={p.foodTruckImageAlt || p.positionName} />
                ) : p.foodTruckImageUrl ? (
                  <a href={p.foodTruckImageUrl} target="_blank" rel="noreferrer"><img src={p.foodTruckImageUrl} alt={p.foodTruckImageAlt || p.positionName} /></a>
                ) : (
                  <div className="photo-empty">אין תמונה</div>
                )}
              </div>

              <h3 className="card-subtitle">זיהוי</h3>
              <div className="card-grid">
                <Field label="מספר"><EditText canEdit={canEdit} value={p.number} onChange={set('number')} /></Field>
                <Field label="שם מתחם"><EditText canEdit={canEdit} value={p.complexName} onChange={set('complexName')} /></Field>
                <Field label="סטטוס מיקום">
                  <EditSelect canEdit={canEdit} value={p.approval} options={APPROVAL_OPTIONS} tone={approvalTone} onChange={v => changeApproval(p.id, v)} />
                </Field>
                <Field label="תיאור תמונה"><EditText canEdit={canEdit} value={p.foodTruckImageAlt} onChange={set('foodTruckImageAlt')} placeholder="לדוגמה: חזית העסק" /></Field>
              </div>

              <h3 className="card-subtitle">עסק ויזם</h3>
              <div className="card-grid">
                <Field label="שם עסק"><EditText canEdit={canEdit} value={p.businessName} onChange={set('businessName')} /></Field>
                <Field label="שם בעלים"><EditText canEdit={canEdit} value={p.ownerName} onChange={set('ownerName')} /></Field>
                <Field label="שם היזם"><EditText canEdit={canEdit} value={p.developerName} onChange={set('developerName')} /></Field>
                <Field label='דוא"ל היזם'><EditText canEdit={canEdit} value={p.developerEmail} onChange={set('developerEmail')} dir="ltr" type="email" placeholder="name@example.com" /></Field>
                <Field label="טלפון היזם"><EditText canEdit={canEdit} value={p.developerPhone} onChange={set('developerPhone')} dir="ltr" type="tel" placeholder="050-0000000" /></Field>
              </div>

              <h3 className="card-subtitle">הערות</h3>
              <Field label="הערות כלליות" wide><EditText canEdit={canEdit} value={p.notes} onChange={set('notes')} multiline placeholder="הערות כלליות לעמדה" /></Field>

              <h3 className="card-subtitle">מיקום</h3>
              <div className="card-location">
                {isPinned(p.mapPin)
                  ? <span className="mono-value" dir="ltr">{p.mapPin.y.toFixed(5)}, {p.mapPin.x.toFixed(5)}</span>
                  : <span className="card-value empty">המיקום עוד לא סומן על המפה</span>}
                <div className="card-actions">
                  {isPinned(p.mapPin) && <button type="button" className="btn" onClick={() => onShowOnMap(p.id)}>הצגה על המפה</button>}
                  {canEdit && <button type="button" className="btn" onClick={() => onPin(p.id)}>{isPinned(p.mapPin) ? 'עדכון מיקום' : 'סימון על המפה'}</button>}
                </div>
              </div>

              {canEdit && (
                <div className="card-danger-zone">
                  <button type="button" className="text-button danger" onClick={() => { if (window.confirm(`להסיר את עמדה ${p.number}?`)) { remove(p.id); onClose(); } }}>
                    הסרת העמדה
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'infra' && (
            <div className="card-section">
              <h3 className="card-subtitle">תשתיות</h3>
              <div className="card-grid three">
                <Field label="מים"><EditToggle canEdit={canEdit} value={p.water} onChange={set('water')} /></Field>
                <Field label="חשמל"><EditToggle canEdit={canEdit} value={p.electricity} onChange={set('electricity')} /></Field>
                <Field label="ביוב"><EditToggle canEdit={canEdit} value={p.sewage} onChange={set('sewage')} /></Field>
              </div>
              <h3 className="card-subtitle">איכות</h3>
              <div className="card-grid">
                <Field label="עיצוב המבנה"><EditSelect canEdit={canEdit} value={p.buildingQuality} options={BUILDING_OPTIONS} tone={qualityTone} onChange={set('buildingQuality')} /></Field>
                <Field label="איכות הסביבה"><EditSelect canEdit={canEdit} value={p.environmentQuality} options={ENV_OPTIONS} tone={qualityTone} onChange={set('environmentQuality')} /></Field>
              </div>
            </div>
          )}

          {tab === 'harmonica' && (
            <div className="card-section">
              <div className={`harmonica-status tone-${harmonicaTone(p.harmonicaStatus)}`}>
                <div className="harmonica-status-text">
                  <span className="mono-label">סטטוס הרמוניקה</span>
                  <strong>{p.harmonicaStatus || 'לא הוגשה'}</strong>
                  {p.harmonicaStatus === 'מאושרת' && p.harmonicaApprovedAt && (
                    <span className="harmonica-approved">אושרה {formatDate(p.harmonicaApprovedAt)}{p.harmonicaApprovedBy ? ` על ידי ${p.harmonicaApprovedBy}` : ''}</span>
                  )}
                </div>
                {canEdit && (
                  <div className="approve-toggle" role="group" aria-label="האם ההרמוניקה מאושרת">
                    <span className="card-label">מאושרת?</span>
                    <div className="segmented large">
                      <button type="button" className={p.harmonicaStatus === 'מאושרת' ? 'on green' : ''} onClick={() => setHarmonica('מאושרת')}>כן, מאושרת</button>
                      <button type="button" className={p.harmonicaStatus !== 'מאושרת' ? 'on' : ''} onClick={() => p.harmonicaStatus === 'מאושרת' && setHarmonica('הוגשה')}>לא</button>
                    </div>
                  </div>
                )}
              </div>

              {canEdit && (
                <div className="card-grid">
                  <Field label="שלב">
                    <EditSelect canEdit value={p.harmonicaStatus} options={HARMONICA_OPTIONS} tone={harmonicaTone} onChange={setHarmonica} />
                  </Field>
                  <div className="card-field action-field">
                    <span className="card-label">יזם: {p.developerName || 'לא הוזן'}{p.developerEmail ? ` · ${p.developerEmail}` : ''}</span>
                    <button type="button" className="btn" onClick={emailDeveloper}>שליחת מייל ליזם</button>
                  </div>
                </div>
              )}

              <h3 className="card-subtitle">קבצי הרמוניקה</h3>
              {canEdit && <DocDropzone label="העלאת הרמוניקה" busy={uploading === 'harmonica'} onFiles={f => uploadDocs(f, 'harmonica')} onLink={(u, t) => addLinkDoc(u, t, 'harmonica')} />}
              <DocList docs={harmonicaDocs} canEdit={canEdit} numbered onRemove={d => removeDoc(d.id)} onRename={renameDoc} />

              <div className="card-subhead">
                <h3 className="card-subtitle">הערות לתיקון</h3>
                <span className="mono-label">{openCorrections.length} פתוחות · {corrections.length - openCorrections.length} טופלו</span>
              </div>
              {canEdit && (
                <div className="note-composer">
                  <textarea className="inline-field boxed" rows={3} value={newCorrection} placeholder="הערה חדשה לתיקון ההרמוניקה" onChange={e => setNewCorrection(e.target.value)} />
                  <button type="button" className="btn primary" disabled={!newCorrection.trim()} onClick={addCorrection}>הוספת הערה</button>
                </div>
              )}
              {corrections.length === 0 ? <p className="card-empty">אין הערות לתיקון.</p> : (
                <ul className="correction-list">
                  {corrections.map(c => (
                    <li key={c.id} className={c.resolved ? 'resolved' : ''}>
                      <DraftText canEdit={canEdit} multiline value={c.body} onSave={body => saveEvent(c.id, { body }).catch(() => {})} />
                      <div className="correction-meta">
                        <EditDate canEdit={canEdit} value={c.created_at} onSave={v => saveEvent(c.id, { created_at: v }).catch(() => {})} />
                        {c.author && <span>{c.author}</span>}
                        {canEdit ? (
                          <button type="button" className={`pill button ${c.resolved ? 'green' : 'orange'}`} onClick={() => saveEvent(c.id, { resolved: !c.resolved }).catch(() => {})}>
                            {c.resolved ? 'טופלה' : 'פתוחה'}
                          </button>
                        ) : <Pill tone={c.resolved ? 'green' : 'orange'}>{c.resolved ? 'טופלה' : 'פתוחה'}</Pill>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === 'docs' && (
            <div className="card-section">
              <h3 className="card-subtitle">מסמכים כלליים</h3>
              {canEdit && <DocDropzone label="העלאת מסמכים" busy={uploading === 'general'} onFiles={f => uploadDocs(f, 'general')} onLink={(u, t) => addLinkDoc(u, t, 'general')} />}
              <DocList docs={generalDocs} canEdit={canEdit} onRemove={d => removeDoc(d.id)} onRename={renameDoc} />
              <p className="card-hint">קבצי ההרמוניקה מרוכזים בלשונית הרמוניקה.</p>
            </div>
          )}

          {tab === 'history' && (
            <div className="card-section">
              {canEdit && (
                <div className="note-composer dated">
                  <label className="card-field compact">
                    <span className="card-label">תאריך</span>
                    <input type="date" className="date-field" value={noteDate} onChange={e => setNoteDate(e.target.value || toDateInput())} />
                  </label>
                  <textarea className="inline-field boxed" rows={2} value={newNote} placeholder="רישום חדש ביומן העמדה" onChange={e => setNewNote(e.target.value)} />
                  <button type="button" className="btn primary" disabled={!newNote.trim()} onClick={addNote}>הוספה ליומן</button>
                </div>
              )}
              {history.length === 0 ? <p className="card-empty">אין עדיין רישומים.</p> : (
                <ol className="timeline">
                  {history.map(e => (
                    <li key={e.id} className={`kind-${e.kind}`}>
                      <span className="timeline-dot" />
                      <div className="timeline-body">
                        <div className="timeline-head">
                          <span className="mono-label">{EVENT_LABELS[e.kind] || e.kind}</span>
                          <EditDate canEdit={canEdit} value={e.created_at} onSave={v => saveEvent(e.id, { created_at: v }).catch(() => {})} />
                          {e.author && <span className="timeline-date">{e.author}</span>}
                        </div>
                        <DraftText canEdit={canEdit && (e.kind === 'note' || e.kind === 'correction')} multiline value={e.body} onSave={body => saveEvent(e.id, { body }).catch(() => {})} />
                      </div>
                      {canEdit && e.kind === 'note' && (
                        <button type="button" className="text-button danger" onClick={() => removeEvent(e.id)}>הסרה</button>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </motion.aside>
  );
}
