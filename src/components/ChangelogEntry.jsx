import { formatLongDate } from '../lib/formatLongDate.js';

// main.js:1:28455-28905 (`ee`). Class strings are copied exactly, including the
// original's `text-1xl` (a typo for text-xl that Tailwind never generates a rule for,
// so that heading falls back to the stylesheet's default size).
export function ChangelogEntry({ title = '', date = new Date(), children = [] }) {
  return (
    <div className="">
      <span className="font-normal uppercase text-sm text-yellow-400">{formatLongDate(date)}</span>
      <h2 className="text-1xl md:text-2xl font-regular text-teal-200 leading-normal mt-1">{title}</h2>
      <div>{children}</div>
    </div>
  );
}

export default ChangelogEntry;
