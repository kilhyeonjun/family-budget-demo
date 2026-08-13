function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function formatLocalDate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function monthOfLocalDate(date = new Date()) {
  return formatLocalDate(date).slice(0, 7);
}

export function dateForSelectedMonth(month: string, now = new Date(), previousDate?: string) {
  if (previousDate?.startsWith(`${month}-`)) return previousDate;
  return month === monthOfLocalDate(now) ? formatLocalDate(now) : `${month}-01`;
}
