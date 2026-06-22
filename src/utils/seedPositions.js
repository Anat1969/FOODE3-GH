export const REAL_POSITIONS = [
  { number: '1', positionName: 'בכניסה לשובר השמאלי', complexName: 'טיילת המרינה', hasInfra: false },
  { number: '2', positionName: 'מסביב לאגם — צפון', complexName: 'טיילת המרינה', hasInfra: false },
  { number: '3', positionName: 'מסביב לאגם — צפון מזרח', complexName: 'טיילת המרינה', hasInfra: false },
  { number: '4', positionName: 'מסביב לאגם — דרום מזרח', complexName: 'טיילת המרינה', hasInfra: true },
  { number: '5', positionName: 'מסביב לאגם — דרום', complexName: 'טיילת המרינה', hasInfra: true },
  { number: '6', positionName: 'לאורך השובר הימיני — 1', complexName: 'טיילת המרינה', hasInfra: false },
  { number: '7', positionName: 'לאורך השובר הימיני — 2', complexName: 'טיילת המרינה', hasInfra: true },
  { number: '8', positionName: 'לאורך השובר הימיני — 3', complexName: 'טיילת המרינה', hasInfra: true },
  { number: '9', positionName: 'לאורך השובר הימיני — 4', complexName: 'טיילת המרינה', hasInfra: false },
  { number: '10', positionName: 'לאורך השובר הימיני — 5', complexName: 'טיילת המרינה', hasInfra: true },
  { number: '11', positionName: 'לאורך השובר הימיני — 6', complexName: 'טיילת המרינה', hasInfra: false },
  { number: '12', positionName: 'לאורך השובר הימיני — 7', complexName: 'טיילת המרינה', hasInfra: false },
  { number: '13', positionName: 'במתחם הגלשנים', complexName: 'טיילת המרינה', hasInfra: true },
  { number: '14', positionName: 'בכניסה לכיכר המצודה', complexName: 'החוף האקספנסיבי', hasInfra: true },
  { number: '15', positionName: 'חוף הקשתות', complexName: 'החוף האינטנסיבי', hasInfra: false },
  { number: '16', positionName: 'חוף האורנים', complexName: 'החוף האינטנסיבי', hasInfra: false },
  { number: '17', positionName: 'חוף מיעמי', complexName: 'החוף האינטנסיבי', hasInfra: false },
  { number: '18', positionName: 'חוף הפירטים', complexName: 'החוף האינטנסיבי', hasInfra: false },
  { number: '19', positionName: 'הכניסה לנחל', complexName: 'נחל לכיש', hasInfra: true },
  { number: '20', positionName: 'הירידה לנחל', complexName: 'נחל לכיש', hasInfra: false },
  { number: '21', positionName: 'הבריכה האקולוגית', complexName: 'נחל לכיש', hasInfra: false },
  { number: '22', positionName: 'מעלה הנחל', complexName: 'נחל לכיש', hasInfra: false },
  { number: '23', positionName: 'פארק אלישבע', complexName: 'הפארקים', hasInfra: false },
  { number: '24', positionName: 'פארק אשדוד ים', complexName: 'הפארקים', hasInfra: false },
  { number: '25', positionName: 'גבעת יונה — סירה 1', complexName: 'הפארקים', hasInfra: true },
  { number: '26', positionName: 'גבעת יונה — סירה 2', complexName: 'הפארקים', hasInfra: true },
  { number: '27', positionName: 'צומת עד הלום', complexName: 'הפארקים', hasInfra: false },
];

export function createPosition(overrides = {}) {
  const infra = overrides.hasInfra ? 'טוב' : 'לא טוב';
  return {
    id: overrides.id || crypto.randomUUID(),
    number: overrides.number || '1',
    positionName: overrides.positionName || 'עמדה חדשה',
    complexName: overrides.complexName || '',
    businessName: overrides.businessName || '',
    water: overrides.water || infra,
    electricity: overrides.electricity || infra,
    sewage: overrides.sewage || infra,
    businessLicense: overrides.businessLicense || 'אין',
    traffic: overrides.traffic || 'טוב',
    waste: overrides.waste || 'טוב',
    accessibility: overrides.accessibility || 'טוב',
    lighting: overrides.lighting || 'טוב',
    buildingQuality: overrides.buildingQuality || infra,
    environmentQuality: overrides.environmentQuality || 'טוב',
    approval: overrides.approval || 'בבדיקה',
    status: overrides.status || overrides.approval || 'בבדיקה',
    notes: overrides.notes || '',
    mapPin: overrides.mapPin || { x: 34.6415, y: 31.8014 },
    foodTruckImageUrl: overrides.foodTruckImageUrl || '',
    foodTruckImageAlt: overrides.foodTruckImageAlt || '',
  };
}

export function seedPositions() {
  return REAL_POSITIONS.map(p => createPosition(p));
}
