// Даты для скиллов: сегодня по Варшаве, ISO-недели, время в ET.
// Без аргумента — текущий момент; с аргументом (ISO-время) — пересчёт этого момента.
//   node scripts/now.mjs
//   node scripts/now.mjs 2026-10-18T18:20:00Z
// Часовые пояса считает Intl, поэтому переходы на зимнее время (Европа и США в разные дни) учтены.

const at = process.argv[2] ? new Date(process.argv[2]) : new Date();
if (Number.isNaN(at.getTime())) {
  console.error('Не разобрала дату:', process.argv[2]);
  process.exit(1);
}

function parts(date, timeZone) {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23',
  });
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}`, weekday: p.weekday };
}

// ISO-неделя для календарной даты YYYY-MM-DD.
function isoWeek(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  const dow = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dow);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function shiftDays(ymd, days) {
  const [y, m, d] = ymd.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return t.toISOString().slice(0, 10);
}

// Понедельник и воскресенье недели, в которую входит дата.
function weekBounds(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay() || 7;
  const monday = shiftDays(ymd, 1 - dow);
  return { monday, sunday: shiftDays(monday, 6) };
}

const warsaw = parts(at, 'Europe/Warsaw');
const et = parts(at, 'America/New_York');
const thisWeek = weekBounds(warsaw.date);
const prevMonday = shiftDays(thisWeek.monday, -7);

console.log(JSON.stringify({
  warsaw: `${warsaw.date} ${warsaw.time} (${warsaw.weekday})`,
  et: `${et.date} ${et.time} (${et.weekday})`,
  date: warsaw.date,
  dateCompact: warsaw.date.replaceAll('-', ''),
  isoWeek: isoWeek(warsaw.date),
  week: thisWeek,
  previousIsoWeek: isoWeek(prevMonday),
  previousWeek: { monday: prevMonday, sunday: shiftDays(prevMonday, 6) },
  last3Days: [shiftDays(warsaw.date, -2), shiftDays(warsaw.date, -1), warsaw.date],
}, null, 2));
