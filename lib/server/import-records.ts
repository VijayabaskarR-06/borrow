import { HttpError } from './storage';

export interface ImportedRecord {
  kind: 'invoice' | 'receipt';
  fields: Record<string, string | number>;
}

function csvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') { cell += '"'; i++; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') {
      if (cell) throw new HttpError(400, 'INVALID_CSV', 'A quoted CSV field must start with a quote.');
      quoted = true;
    } else if (char === ',') {
      row.push(cell.trim()); cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && input[i + 1] === '\n') i++;
      row.push(cell.trim()); cell = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else cell += char;
  }
  if (quoted) throw new HttpError(400, 'INVALID_CSV', 'A CSV field has an unclosed quote.');
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

const aliases: Record<string, string> = {
  type: 'type', kind: 'type', vendor: 'vendor', supplier: 'vendor', merchant: 'vendor',
  invoicenumber: 'invoiceNumber', invoiceid: 'invoiceNumber', reference: 'invoiceNumber',
  date: 'date', invoicedate: 'date', amount: 'amount', total: 'amount',
  currency: 'currency', category: 'category', description: 'description', notes: 'notes',
};
function normalizeKey(key: string): string { return aliases[key.toLowerCase().replace(/[^a-z]/g, '')] ?? ''; }
function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00.000Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function record(value: unknown, row: number): ImportedRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'INVALID_RECORD', `Row ${row} must be an invoice or payment object.`);
  const source = value as Record<string, unknown>;
  const input: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(source)) {
    const field = normalizeKey(key);
    if (field && input[field] === undefined) input[field] = entry;
  }
  const kindText = String(input.type ?? 'invoice').trim().toLowerCase();
  const kind = kindText === 'receipt' || kindText === 'payment' ? 'receipt' : kindText === 'invoice' ? 'invoice' : null;
  if (!kind) throw new HttpError(400, 'INVALID_RECORD', `Row ${row} type must be invoice or receipt.`);
  const vendor = typeof input.vendor === 'string' ? input.vendor.trim() : '';
  const date = typeof input.date === 'string' ? input.date.trim() : '';
  const currency = String(input.currency ?? 'USD').trim().toUpperCase();
  const rawAmount = String(input.amount ?? '').trim();
  const amount = rawAmount ? Number(rawAmount.replace(/,/g, '')) : Number.NaN;
  if (!vendor || vendor.length > 120) throw new HttpError(400, 'INVALID_VENDOR', `Row ${row} needs a vendor under 120 characters.`);
  if (!validDate(date)) throw new HttpError(400, 'INVALID_DATE', `Row ${row} needs a real date in YYYY-MM-DD format.`);
  if (!/^[A-Z]{3}$/.test(currency)) throw new HttpError(400, 'INVALID_CURRENCY', `Row ${row} needs a three-letter currency code.`);
  if (!Number.isFinite(amount) || amount < 0 || amount > 100000000) throw new HttpError(400, 'INVALID_AMOUNT', `Row ${row} needs a valid non-negative amount.`);
  const fields: Record<string, string | number> = { vendor, date, amount, currency };
  for (const key of ['invoiceNumber', 'category', 'description', 'notes']) {
    if (input[key] !== undefined && input[key] !== null) {
      const text = String(input[key]).trim();
      if (text.length > 500) throw new HttpError(400, 'FIELD_TOO_LONG', `Row ${row} ${key} exceeds 500 characters.`);
      if (text) fields[key] = text;
    }
  }
  return { kind, fields };
}

/** Import only report fields. Unknown columns, including bank details, are discarded. */
export function importRecords(name: string, content: string): ImportedRecord[] {
  let raw: unknown[];
  if (/\.csv$/i.test(name)) {
    const rows = csvRows(content.replace(/^\uFEFF/, ''));
    if (rows.length < 2) throw new HttpError(400, 'EMPTY_CSV', 'CSV needs a header and at least one invoice or payment row.');
    const headers = rows[0].map(normalizeKey);
    if (!headers.includes('vendor') || !headers.includes('date') || !headers.includes('amount')) throw new HttpError(400, 'CSV_HEADERS', 'CSV needs vendor, date and amount columns.');
    raw = rows.slice(1).map((cells, index) => {
      if (cells.length !== headers.length) throw new HttpError(400, 'CSV_COLUMNS', `Row ${index + 2} has a different number of columns than the header.`);
      return Object.fromEntries(headers.map((key, i) => [key || `unused${i}`, cells[i]]));
    });
  } else if (/\.json$/i.test(name)) {
    let parsed: unknown;
    try { parsed = JSON.parse(content); } catch { throw new HttpError(400, 'INVALID_JSON_DOCUMENT', 'The file must contain valid JSON.'); }
    raw = Array.isArray(parsed) ? parsed : [parsed];
  } else throw new HttpError(400, 'UNSUPPORTED_FILE', 'Upload a .csv or .json invoice file.');
  if (!raw.length || raw.length > 24) throw new HttpError(400, 'IMPORT_LIMIT', 'Import between 1 and 24 records at a time.');
  return raw.map((value, index) => record(value, index + 1));
}
