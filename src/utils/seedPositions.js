const names = ['חוף הקשתות', 'פארק אשדוד ים', 'מרינה אשדוד', 'שדרות הנשיא', 'כיכר המוסיקה', 'רובע הבילויים', 'גבעת יונה', 'שכונת יא'];
const complexes = ['מתחם חוף', 'מתחם פארק', 'מתחם מרינה', 'מתחם עירוני'];
const businesses = ['שווארמה אלי', 'פיצה נונו', 'בורגר בוס', 'פלאפל הזהב', 'קפה לנדוור', 'סושי בר', 'מסעדת ים', 'גלידה איטלקית'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

let counter = 0;

export function createPosition(overrides = {}) {
  counter++;
  return {
    id: overrides.id || crypto.randomUUID(),
    number: overrides.number || String(counter),
    positionName: overrides.positionName || pick(names),
    complexName: overrides.complexName || pick(complexes),
    businessName: overrides.businessName || pick(businesses),
    water: overrides.water || 'טוב',
    electricity: overrides.electricity || 'טוב',
    sewage: overrides.sewage || 'טוב',
    businessLicense: overrides.businessLicense || 'יש',
    traffic: overrides.traffic || 'טוב',
    waste: overrides.waste || 'טוב',
    accessibility: overrides.accessibility || 'טוב',
    lighting: overrides.lighting || 'טוב',
    buildingQuality: overrides.buildingQuality || pick(['טוב', 'לא טוב']),
    environmentQuality: overrides.environmentQuality || pick(['טוב', 'לא טוב']),
    approval: overrides.approval || pick(['מיקום מקובל', 'בבדיקה', 'מיקום לא מקובל']),
    status: overrides.status || overrides.approval || 'בבדיקה',
    notes: overrides.notes || '',
    mapPin: overrides.mapPin || { x: Math.round(Math.random() * 100), y: Math.round(Math.random() * 100) },
    foodTruckImageUrl: overrides.foodTruckImageUrl || '',
    foodTruckImageAlt: overrides.foodTruckImageAlt || '',
  };
}

export function seedPositions(count = 8) {
  counter = 0;
  return Array.from({ length: count }, () => createPosition());
}
