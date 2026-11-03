// Hours map: which stands are open at a chosen hour, and whether their permit is valid.
// Nothing here invents data: a stand with no recorded hours or no expiry date is shown as "unknown".

// Parses "10:00-23:00", "10-23", "18:00–02:00" (past midnight). Several ranges may be separated by commas.
export function parseHours(text) {
  if (!text) return null;
  const ranges = [];
  const re = /(\d{1,2})(?::(\d{2}))?\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?/g;
  let m;
  while ((m = re.exec(String(text)))) {
    const from = Number(m[1]) + Number(m[2] || 0) / 60;
    const to = Number(m[3]) + Number(m[4] || 0) / 60;
    if (from <= 24 && to <= 24) ranges.push([from, to]);
  }
  return ranges.length ? ranges : null;
}

// true / false, or null when the stand has no hours on record.
export function isOpenAt(ranges, hour) {
  if (!ranges) return null;
  return ranges.some(([from, to]) => (from <= to ? hour >= from && hour < to : hour >= from || hour < to));
}

// Accepts an ISO date or an Israeli date (31.12.2026, 31/12/26) anywhere in the text.
export function parseDate(text) {
  if (!text) return null;
  const s = String(text);
  const iso = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const il = s.match(/(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
  if (il) {
    const y = Number(il[3]) < 100 ? 2000 + Number(il[3]) : Number(il[3]);
    return new Date(y, Number(il[2]) - 1, Number(il[1]));
  }
  return null;
}

export const PERMIT = {
  valid: { label: 'רישיון בתוקף', color: '#2f9e5b' },
  soon: { label: 'פג בתוך 30 יום', color: '#d99a1e' },
  expired: { label: 'רישיון פג או חסר', color: '#d64541' },
  unknown: { label: 'אין תאריך תוקף', color: '#8a9096' },
};

// Expiry comes from a dedicated field when it exists, otherwise from a date written in the business license field.
export function permitState(p, today = new Date()) {
  if (/^\s*(אין|לא)\b/.test(p.businessLicense || '')) return { tone: 'expired', date: null };
  const date = parseDate(p.permitExpiresAt) || parseDate(p.businessLicense);
  if (!date) return { tone: 'unknown', date: null };
  const days = Math.floor((date - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
  if (days < 0) return { tone: 'expired', date, days };
  if (days <= 30) return { tone: 'soon', date, days };
  return { tone: 'valid', date, days };
}

export const hourLabel = (h) => `${String(Math.floor(h)).padStart(2, '0')}:${h % 1 ? '30' : '00'}`;
