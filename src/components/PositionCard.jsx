import { useState, useRef, useMemo } from 'react';
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

export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function isPinned(mapPin) {
  if (!mapPin) return false;
  return Math.abs(mapPin.x - ASHDOD_CENTER.x) > 0.0001 || Math.abs(mapPin.y - ASHDOD_CENTER.y) > 0.0001;
}

function Pill({ tone, children }) {
  return <span className={`pill ${tone}`}>{children || '—'}</span>;
}

function Field({ label, children, wide }) {
  return (
    <div className={`card-field ${wide ? 'wide' : ''}`}>
      <span className="card-label">{label}</span>
      {children}
    </div>
  );
}

function TextValue({ editing, value, onChange, multiline, placeholder, dir, type = 'text' }) {
  if (!editing) {
    return <span className={`card-value ${value ? '' : 'empty'}`} dir={dir}>{value || 'לא הוזן'}</span>;
  }
  return multiline
    ? <textarea className="card-input" value={value || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} rows={4} />
    : <input className="card-input" type={type} dir={dir} value={value || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} />;
}

function SelectValue({ editing, value, options, onChange, tone }) {
  if (!editing) return <Pill tone={tone(value)}>{value}</Pill>;
  return (
    <select className={`card-input select tone-${tone(value)}`} value={value || ''} onChange={e => onChange(e.target.value)}>
      {withCurrent(options, value).map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Toggle({ editing, value, onChange }) {
  const good = value === 'טוב';
  if (!editing) return <Pill tone={good ? 'green' : 'red'}>{good ? 'תקין' : 'לא תקין'}</Pill>;
  return (
    <div className="segmented" role="group">
      <button type="button" className={good ? 'on green' : ''} onClick={() => onChange('טוב')}>תקין</button>
      <button type="button" className={!good ? 'on red' : ''} onClick={() => onChange('לא טוב')}>לא תקין</button>
    </div>
  );
}

function DocList({ docs, canEdit, onRemove, numbered }) {
  if (!docs.length) return <p className="card-empty">אין מסמכים עדיין.</p>;
  return (
    <ul className="doc-list">
      {docs.map((d, i) => (
        <li key={d.id} className="doc-row">
          {numbered && <span className="doc-version">גרסה {docs.length - i}</span>}
          <a className="doc-title" href={d.file_url} target="_blank" rel="noreferrer">{d.title || 'מסמך'}</a>
          <span className="doc-meta">{formatDate(d.created_at)}{d.uploaded_by ? ` · ${d.uploaded_by}` : ''}{d.size ? ` · ${formatSize(d.size)}` : ''}</span>
          {canEdit && (
            <button type="button" className="text-button danger" onClick={() => onRemove(d)}>הסרה</button>
          )}
        </li>
      ))}
    </ul>
  );
}

function UploadButton({ label, onFiles, busy }) {
  const ref = useRef(null);
  return (
    <>
      <button type="button" className="btn" disabled={busy} onClick={() => ref.current?.click()}>
        {busy ? 'מעלה…' : label}
      </button>
      <input
        ref={ref}
        type="file"
        multiple
        hidden
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.dwg,.dxf,.zip,image/*"
        onChange={e => { const files = [...(e.target.files || [])]; e.target.value = ''; if (files.length) onFiles(files); }}
      />
    </>
  );
}

export default function PositionCard({
  position, editor, docs, events, tab, setTab, onClose,
  update, changeApproval, remove, saveDoc, removeDoc, saveEvent, removeEvent,
  onPin, onShowOnMap, notify, cardLink,
}) {
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [newCorrection, setNewCorrection] = useState('');
  const [newNote, setNewNote] = useState('');
  const canEdit = Boolean(editor);
  const isEditing = canEdit && editing;
  const p = position;
  const set = (key) => (value) => update(p.id, { [key]: value });

  const harmonicaDocs = useMemo(() => docs.filter(d => d.kind === 'harmonica').reverse(), [docs]);
  const generalDocs = useMemo(() => docs.filter(d => d.kind !== 'harmonica').reverse(), [docs]);
  const corrections = useMemo(() => events.filter(e => e.kind === 'correction').reverse(), [events]);
  const openCorrections = corrections.filter(c => !c.resolved);
  const history = useMemo(() => [...events].reverse(), [events]);

  const logEvent = (kind, body, meta = {}) =>
    saveEvent(crypto.randomUUID(), { position_id: p.id, kind, body, author: editor || '', meta }).catch(() => {});

  const setHarmonica = (status) => {
    const approved = status === 'מאושרת';
    update(p.id, {
      harmonicaStatus: status,
      harmonicaApprovedAt: approved ? new Date().toISOString() : '',
      harmonicaApprovedBy: approved ? editor : '',
    });
    logEvent(approved ? 'approval' : 'status', approved ? 'ההרמוניקה אושרה' : `סטטוס הרמוניקה: ${status}`);
    notify(approved ? 'ההרמוניקה אושרה' : `סטטוס הרמוניקה עודכן: ${status}`);
  };

  const uploadDocs = async (files, kind) => {
    setUploading(kind);
    try {
      for (const file of files) {
        const { publicUrl, path } = await uploadFile('foode-docs', file, { folder: p.id });
        await saveDoc(crypto.randomUUID(), {
          position_id: p.id, kind, title: file.name, file_url: publicUrl, file_path: path,
          mime: file.type || '', size: file.size || 0, uploaded_by: editor || '',
        });
        logEvent(kind === 'harmonica' ? 'submission' : 'note', `${kind === 'harmonica' ? 'הוגשה הרמוניקה' : 'צורף מסמך'}: ${file.name}`);
      }
      if (kind === 'harmonica' && (p.harmonicaStatus === 'לא הוגשה' || p.harmonicaStatus === 'נדרש תיקון')) {
        update(p.id, { harmonicaStatus: 'הוגשה' });
      }
      notify(files.length > 1 ? `${files.length} מסמכים צורפו` : 'המסמך צורף');
    } catch (err) {
      notify(`ההעלאה נכשלה: ${err.message}`, 'error');
    } finally {
      setUploading(null);
    }
  };

  const addCorrection = () => {
    const body = newCorrection.trim();
    if (!body) return;
    saveEvent(crypto.randomUUID(), { position_id: p.id, kind: 'correction', body, author: editor || '' })
      .then(() => notify('ההערה נשמרה'))
      .catch(() => {});
    setNewCorrection('');
    if (p.harmonicaStatus !== 'נדרש תיקון' && p.harmonicaStatus !== 'מאושרת') update(p.id, { harmonicaStatus: 'נדרש תיקון' });
  };

  const addNote = () => {
    const body = newNote.trim();
    if (!body) return;
    logEvent('note', body);
    setNewNote('');
  };

  const emailDeveloper = () => {
    if (!p.developerEmail) {
      notify('חסרה כתובת דוא"ל של היזם. אפשר להוסיף אותה בלשונית פרטים.', 'error');
      setTab('details');
      setEditing(true);
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
          <h2>{p.positionName || 'ללא שם'}</h2>
          <div className="card-pills">
            <Pill tone={approvalTone(p.approval)}>{p.approval}</Pill>
            <Pill tone={harmonicaTone(p.harmonicaStatus)}>הרמוניקה: {p.harmonicaStatus || 'לא הוגשה'}</Pill>
          </div>
        </div>
        <div className="card-head-actions">
          {canEdit && (
            <button type="button" className={`btn ${isEditing ? 'primary' : ''}`} onClick={() => setEditing(v => !v)}>
              {isEditing ? 'סיום עריכה' : 'עריכה'}
            </button>
          )}
          <button type="button" className="btn ghost" onClick={onClose}>סגירה</button>
        </div>
      </header>

      <nav className="card-tabs" role="tablist">
        {CARD_TABS.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? 'active' : ''}
            onClick={() => setTab(id)}
          >
            {label}
            {tabCount[id] ? <span className="tab-count">{tabCount[id]}</span> : null}
            {tab === id && <span className="tab-line" />}
          </button>
        ))}
      </nav>

      <div className="card-body">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'details' && (
              <div className="card-section">
                <div className="card-photo">
                  {isEditing ? (
                    <ImageUpload value={p.foodTruckImageUrl} onChange={set('foodTruckImageUrl')} alt={p.foodTruckImageAlt || p.positionName} notify={notify} />
                  ) : p.foodTruckImageUrl ? (
                    <a href={p.foodTruckImageUrl} target="_blank" rel="noreferrer"><img src={p.foodTruckImageUrl} alt={p.foodTruckImageAlt || p.positionName} /></a>
                  ) : (
                    <div className="photo-empty">אין תמונה</div>
                  )}
                </div>

                <h3 className="card-subtitle">זיהוי</h3>
                <div className="card-grid">
                  <Field label="מספר"><TextValue editing={isEditing} value={p.number} onChange={set('number')} /></Field>
                  <Field label="שם עמדה"><TextValue editing={isEditing} value={p.positionName} onChange={set('positionName')} /></Field>
                  <Field label="שם מתחם"><TextValue editing={isEditing} value={p.complexName} onChange={set('complexName')} /></Field>
                  <Field label="סטטוס מיקום">
                    <SelectValue editing={isEditing} value={p.approval} options={APPROVAL_OPTIONS} tone={approvalTone} onChange={v => changeApproval(p.id, v)} />
                  </Field>
                  {isEditing && <Field label="תיאור תמונה" wide><TextValue editing value={p.foodTruckImageAlt} onChange={set('foodTruckImageAlt')} placeholder="לדוגמה: חזית העסק" /></Field>}
                </div>

                <h3 className="card-subtitle">עסק ויזם</h3>
                <div className="card-grid">
                  <Field label="שם עסק"><TextValue editing={isEditing} value={p.businessName} onChange={set('businessName')} /></Field>
                  <Field label="שם בעלים"><TextValue editing={isEditing} value={p.ownerName} onChange={set('ownerName')} /></Field>
                  <Field label="שם היזם"><TextValue editing={isEditing} value={p.developerName} onChange={set('developerName')} /></Field>
                  <Field label='דוא"ל היזם'>
                    {isEditing
                      ? <TextValue editing value={p.developerEmail} onChange={set('developerEmail')} dir="ltr" type="email" placeholder="name@example.com" />
                      : p.developerEmail ? <a className="card-value" dir="ltr" href={`mailto:${p.developerEmail}`}>{p.developerEmail}</a> : <span className="card-value empty">לא הוזן</span>}
                  </Field>
                  <Field label="טלפון היזם">
                    {isEditing
                      ? <TextValue editing value={p.developerPhone} onChange={set('developerPhone')} dir="ltr" type="tel" />
                      : p.developerPhone ? <a className="card-value" dir="ltr" href={`tel:${p.developerPhone}`}>{p.developerPhone}</a> : <span className="card-value empty">לא הוזן</span>}
                  </Field>
                </div>

                <h3 className="card-subtitle">הערות</h3>
                <TextValue editing={isEditing} value={p.notes} onChange={set('notes')} multiline placeholder="הערות כלליות לעמדה" />

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

                {isEditing && (
                  <div className="card-danger-zone">
                    <button
                      type="button"
                      className="btn danger"
                      onClick={() => { if (window.confirm(`להסיר את עמדה ${p.number}?`)) { remove(p.id); onClose(); } }}
                    >
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
                  <Field label="מים"><Toggle editing={isEditing} value={p.water} onChange={set('water')} /></Field>
                  <Field label="חשמל"><Toggle editing={isEditing} value={p.electricity} onChange={set('electricity')} /></Field>
                  <Field label="ביוב"><Toggle editing={isEditing} value={p.sewage} onChange={set('sewage')} /></Field>
                </div>
                <h3 className="card-subtitle">איכות</h3>
                <div className="card-grid">
                  <Field label="עיצוב המבנה"><SelectValue editing={isEditing} value={p.buildingQuality} options={BUILDING_OPTIONS} tone={qualityTone} onChange={set('buildingQuality')} /></Field>
                  <Field label="איכות הסביבה"><SelectValue editing={isEditing} value={p.environmentQuality} options={ENV_OPTIONS} tone={qualityTone} onChange={set('environmentQuality')} /></Field>
                </div>
                {!canEdit && <p className="card-hint">תצוגה בלבד. עריכה זמינה דרך קישור העריכה האישי.</p>}
              </div>
            )}

            {tab === 'harmonica' && (
              <div className="card-section">
                <div className={`harmonica-status tone-${harmonicaTone(p.harmonicaStatus)}`}>
                  <span className="mono-label">סטטוס הרמוניקה</span>
                  <strong>{p.harmonicaStatus || 'לא הוגשה'}</strong>
                  {p.harmonicaStatus === 'מאושרת' && p.harmonicaApprovedAt && (
                    <span className="harmonica-approved">אושרה {formatDate(p.harmonicaApprovedAt)}{p.harmonicaApprovedBy ? ` על ידי ${p.harmonicaApprovedBy}` : ''}</span>
                  )}
                </div>

                {canEdit && (
                  <div className="card-actions">
                    {p.harmonicaStatus !== 'מאושרת' ? (
                      <button type="button" className="btn approve" onClick={() => setHarmonica('מאושרת')}>אישור ההרמוניקה</button>
                    ) : (
                      <button type="button" className="btn" onClick={() => setHarmonica('הוגשה')}>ביטול האישור</button>
                    )}
                    {p.harmonicaStatus !== 'נדרש תיקון' && p.harmonicaStatus !== 'מאושרת' && (
                      <button type="button" className="btn" onClick={() => setHarmonica('נדרש תיקון')}>החזרה לתיקון</button>
                    )}
                    <button type="button" className="btn" onClick={emailDeveloper}>שליחת מייל ליזם</button>
                  </div>
                )}

                <div className="card-subhead">
                  <h3 className="card-subtitle">קבצי הרמוניקה</h3>
                  {canEdit && <UploadButton label="צירוף הרמוניקה" busy={uploading === 'harmonica'} onFiles={f => uploadDocs(f, 'harmonica')} />}
                </div>
                <DocList docs={harmonicaDocs} canEdit={canEdit} numbered onRemove={d => removeDoc(d.id)} />

                <div className="card-subhead">
                  <h3 className="card-subtitle">הערות לתיקון</h3>
                  <span className="mono-label">{openCorrections.length} פתוחות · {corrections.length - openCorrections.length} טופלו</span>
                </div>
                {canEdit && (
                  <div className="note-composer">
                    <textarea
                      className="card-input"
                      rows={3}
                      value={newCorrection}
                      placeholder="הערה חדשה לתיקון ההרמוניקה"
                      onChange={e => setNewCorrection(e.target.value)}
                    />
                    <button type="button" className="btn primary" disabled={!newCorrection.trim()} onClick={addCorrection}>הוספת הערה</button>
                  </div>
                )}
                {corrections.length === 0 ? <p className="card-empty">אין הערות לתיקון.</p> : (
                  <ul className="correction-list">
                    {corrections.map(c => (
                      <li key={c.id} className={c.resolved ? 'resolved' : ''}>
                        <p>{c.body}</p>
                        <div className="correction-meta">
                          <span>{formatDate(c.created_at)}{c.author ? ` · ${c.author}` : ''}</span>
                          <Pill tone={c.resolved ? 'green' : 'orange'}>{c.resolved ? 'טופלה' : 'פתוחה'}</Pill>
                          {canEdit && (
                            <button type="button" className="text-button" onClick={() => saveEvent(c.id, { resolved: !c.resolved })}>
                              {c.resolved ? 'פתיחה מחדש' : 'סימון כטופלה'}
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {tab === 'docs' && (
              <div className="card-section">
                <div className="card-subhead">
                  <h3 className="card-subtitle">מסמכים כלליים</h3>
                  {canEdit && <UploadButton label="צירוף מסמכים" busy={uploading === 'general'} onFiles={f => uploadDocs(f, 'general')} />}
                </div>
                <DocList docs={generalDocs} canEdit={canEdit} onRemove={d => removeDoc(d.id)} />
                <p className="card-hint">קבצי ההרמוניקה מרוכזים בלשונית הרמוניקה.</p>
              </div>
            )}

            {tab === 'history' && (
              <div className="card-section">
                {canEdit && (
                  <div className="note-composer">
                    <textarea className="card-input" rows={2} value={newNote} placeholder="רישום חדש ביומן העמדה" onChange={e => setNewNote(e.target.value)} />
                    <button type="button" className="btn primary" disabled={!newNote.trim()} onClick={addNote}>הוספה ליומן</button>
                  </div>
                )}
                {history.length === 0 ? <p className="card-empty">אין עדיין רישומים.</p> : (
                  <ol className="timeline">
                    {history.map(e => (
                      <li key={e.id} className={`kind-${e.kind}`}>
                        <span className="timeline-dot" />
                        <div>
                          <div className="timeline-head">
                            <span className="mono-label">{EVENT_LABELS[e.kind] || e.kind}</span>
                            <span className="timeline-date">{formatDate(e.created_at)}{e.author ? ` · ${e.author}` : ''}</span>
                          </div>
                          <p>{e.body}</p>
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
