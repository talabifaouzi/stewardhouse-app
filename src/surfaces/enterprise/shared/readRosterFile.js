// Roster file reader (roster-import arc, INPUT SHAPE AMENDED 2026-08-27).
//
// ONE CODE PATH. This module's whole job is to turn a File into the SAME kind
// of delimited string the operator would have pasted, and hand it back. It does
// not parse, does not map, and does not know about athletes. parseRoster is
// untouched and unforked: text files are read verbatim, and Excel is converted
// to CSV before it ever reaches the parser, so the paste path and the upload
// path converge on one implementation.
//
// SIZE IS CHECKED BEFORE ANY READ (ruled: 10 MB). File.size is available from
// the drop or picker event without touching contents, so a wrong-file drop
// fails immediately instead of after a large read. The 500-row cap stays the
// authority on content; this ceiling only stops the read.
//
// PDF IS REFUSED BY NAME, on extension OR MIME. Some clients hand over a .pdf
// with an empty type string, so extension alone is not enough and MIME alone is
// not enough either. No extraction is attempted: a PDF roster is a rendered
// document, and inferring column boundaries from layout is exactly the guessing
// this arc has ruled against.

export const MAX_FILE_BYTES = 10 * 1024 * 1024;   // 10 MB (ruled)

// A FLOOR for Excel only, and it exists for a reason worth stating plainly.
// SheetJS 0.18.5 HANGS INDEFINITELY on a file that carries a ZIP signature and
// then stops: a hand-built 14-byte local-file header never returns and never
// throws. On a browser main thread that is a frozen tab with no recovery and
// no error, and no timeout can interrupt synchronous JS.
//
// What was measured: every truncation of a REAL workbook, down to 1% of its
// bytes, throws cleanly in about 70ms and is caught below. Random non-ZIP
// bytes return quickly as garbage text. Only the tiny ZIP-header case hangs,
// and a genuine .xlsx cannot approach this size, since the container alone
// needs [Content_Types].xml, a workbook part, a sheet part and their
// relationships.
//
// So this floor removes the DEMONSTRATED hang at no cost to any real file. It
// is NOT a guarantee that no larger input can hang: only moving the parse off
// the main thread would give that, which is a Worker and is not this slice.
const MIN_EXCEL_BYTES = 512;

// The picker's `accept` attribute. Concrete extensions AND MIME types, no
// wildcards, for two reasons that pull the same way:
//   - iOS filters the system sheet on this list. A `text/*` wildcard filters
//     unreliably there and can grey out files the ruling admits; concrete
//     entries behave predictably.
//   - No image types are listed, so the sheet's Photo Library and Take Photo
//     entries appear (iOS always offers them) with photos non-selectable, which
//     is the correct signal rather than an invitation.
// This attribute is a HINT to the picker. classifyFile below is the authority,
// and it accepts any text/* MIME per the ruling even if the sheet did not
// offer it.
export const ACCEPT_ATTR = [
  '.csv', '.tsv', '.txt', '.xlsx', '.xls',
  'text/csv',
  'text/tab-separated-values',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
].join(',');

const TEXT_EXT = ['csv', 'tsv', 'txt'];
const EXCEL_EXT = ['xlsx', 'xls'];

function extensionOf(name) {
  const n = String(name || '');
  const dot = n.lastIndexOf('.');
  return dot < 0 ? '' : n.slice(dot + 1).toLowerCase();
}

/**
 * Decide what a File is, from extension and MIME together.
 * Returns 'text' | 'excel' | 'pdf' | 'unknown'.
 */
export function classifyFile(file) {
  const ext = extensionOf(file && file.name);
  const type = String((file && file.type) || '').toLowerCase();

  // PDF first: refusing it by name is more useful than letting it fall into
  // 'unknown', and the check is deliberately either/or.
  if (ext === 'pdf' || type === 'application/pdf') return 'pdf';

  if (EXCEL_EXT.includes(ext)) return 'excel';
  if (type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'excel';
  if (type === 'application/vnd.ms-excel') return 'excel';

  if (TEXT_EXT.includes(ext)) return 'text';
  if (type.startsWith('text/')) return 'text';

  return 'unknown';
}

const REFUSE_PDF =
  'That is a PDF. Open it, copy the rows, and paste them here instead.';

const REFUSE_UNKNOWN =
  'That file type is not supported. Use a CSV, TSV, plain text, or Excel file (.xlsx or .xls), or paste the rows.';

/**
 * Read a File into the delimited string parseRoster expects.
 *
 * @returns {Promise<{ok: true, text: string, notes: string[]}
 *                 | {ok: false, error: string}>}
 * Never throws for an expected refusal; an unexpected failure is caught and
 * returned as a message rather than surfacing a raw exception to the operator.
 */
export async function readRosterFile(file) {
  if (!file) return { ok: false, error: 'No file was provided.' };

  // BEFORE any read (ruled).
  if (typeof file.size === 'number' && file.size > MAX_FILE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      ok: false,
      error: `That file is ${mb} MB, over the 10 MB limit. A roster of 500 athletes is well under 1 MB, so this is probably not a roster.`,
    };
  }

  const kind = classifyFile(file);
  if (kind === 'pdf') return { ok: false, error: REFUSE_PDF };
  if (kind === 'unknown') return { ok: false, error: REFUSE_UNKNOWN };

  try {
    if (kind === 'text') {
      const text = await file.text();
      if (text.trim() === '') return { ok: false, error: 'That file is empty.' };
      return { ok: true, text, notes: [] };
    }
    return await readExcel(file);
  } catch (err) {
    return { ok: false, error: 'That file could not be read. It may be corrupt or password-protected.' };
  }
}

// Excel. SheetJS is DYNAMICALLY IMPORTED so it lands in its own chunk rather
// than the main bundle: it is roughly the size of the entire rest of the app,
// and every visitor to the landing page, the individual surface and the advisor
// surface would otherwise pay for a spreadsheet parser they never invoke. The
// import resolves on first Excel file only.
async function readExcel(file) {
  if (typeof file.size === 'number' && file.size < MIN_EXCEL_BYTES) {
    return { ok: false, error: 'That file is too small to be a spreadsheet. It may be truncated or corrupt.' };
  }
  const XLSX = await import('xlsx');
  const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array' });

  const names = wb.SheetNames || [];
  if (names.length === 0) return { ok: false, error: 'That workbook has no sheets.' };

  // MULTIPLE WORKSHEETS: the FIRST is used, and the others are NAMED in a note
  // rather than silently dropped. Choosing among them by content would be a
  // guess, and asking would add a step to every single-sheet import, which is
  // nearly all of them.
  const notes = [];
  if (names.length > 1) {
    notes.push(`This workbook has ${names.length} sheets. Only "${names[0]}" was read; ${names.slice(1).map((n) => `"${n}"`).join(', ')} ${names.length === 2 ? 'was' : 'were'} ignored.`);
  }

  const sheet = wb.Sheets[names[0]];
  if (!sheet) return { ok: false, error: 'That workbook has no readable sheet.' };

  // MERGED CELLS: SheetJS puts a merged range's value in its top-left cell and
  // leaves the covered cells empty, so a header merged across two columns
  // yields one label followed by a blank. That blank is carried through
  // honestly and renders as "Column N" in the mapping step. Un-merging by
  // spreading the value across the range would invent header labels the file
  // does not contain.
  if (Array.isArray(sheet['!merges']) && sheet['!merges'].length > 0) {
    notes.push('Some cells in this sheet are merged. Merged values stay in their first column and the rest read as empty.');
  }

  // DISPLAYED VALUE, NOT STORED VALUE. sheet_to_csv emits each cell's FORMATTED
  // text (the `w` property) in preference to its raw value, which is what the
  // operator sees in Excel and what a roster means. Verified against this
  // version: a date cell holding 46036.79 with a display of "1/14/26" emits
  // "1/14/26". No option is needed to get this, and none is passed, because the
  // default is already the correct behaviour; passing rawNumbers:false changes
  // nothing and would imply otherwise.
  //
  // CSV rather than TSV: sheet_to_csv quotes any cell containing a comma, a
  // quote or a newline, and parseRoster's sniffer counts delimiters OUTSIDE
  // quotes, so a name like "Lovelace, Ada" survives the round trip. A TSV
  // conversion would have no equivalent guarantee for a cell containing a tab.
  const text = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
  if (text.trim() === '') {
    return { ok: false, error: `The sheet "${names[0]}" has no rows.` };
  }
  return { ok: true, text, notes };
}

/**
 * Pull a single usable File out of a drop event, refusing the shapes that break
 * naive implementations. Returns { file } or { error }.
 */
export function fileFromDrop(dataTransfer) {
  if (!dataTransfer) return { error: REFUSE_UNKNOWN };

  // A dragged text selection, a link, or an image from another page produces a
  // drop with zero files. Refuse rather than appear to accept it.
  const files = dataTransfer.files ? Array.from(dataTransfer.files) : [];
  if (files.length === 0) {
    return { error: 'That was not a file. Drop a CSV, TSV, text or Excel file, or paste the rows.' };
  }

  // MULTIPLE FILES: refused rather than silently taking the first. Which one is
  // the roster is a guess, and guessing wrong imports the wrong people.
  if (files.length > 1) {
    return { error: `${files.length} files were dropped. Drop one roster file at a time.` };
  }

  // A FOLDER arrives as a File with no type and (on most engines) size 0.
  // webkitGetAsEntry is the reliable test where it exists; the size/type pair
  // is the fallback for engines that do not expose it.
  const items = dataTransfer.items ? Array.from(dataTransfer.items) : [];
  const entry = items[0] && typeof items[0].webkitGetAsEntry === 'function'
    ? items[0].webkitGetAsEntry()
    : null;
  if (entry && entry.isDirectory) {
    return { error: 'That is a folder. Drop a single roster file instead.' };
  }
  const file = files[0];
  if (!entry && file.size === 0 && file.type === '') {
    return { error: 'That looks like a folder or an empty file. Drop a single roster file instead.' };
  }

  return { file };
}
