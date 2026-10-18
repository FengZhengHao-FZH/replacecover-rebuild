// The shipped changelog header formatted its date with moment("MMMM Do, Y").
// Replaced by this local helper to keep the bundle free of moment; output is identical
// for the two dates the changelog actually carries (Aug 15 2020, March 12 2018).
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function ordinal(day) {
  const remainder100 = day % 100;
  if (remainder100 >= 11 && remainder100 <= 13) return day + 'th';
  switch (day % 10) {
    case 1: return day + 'st';
    case 2: return day + 'nd';
    case 3: return day + 'rd';
    default: return day + 'th';
  }
}

export function formatLongDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return MONTHS[date.getMonth()] + ' ' + ordinal(date.getDate()) + ', ' + date.getFullYear();
}
