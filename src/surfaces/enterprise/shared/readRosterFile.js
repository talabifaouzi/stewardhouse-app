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

// A FLOOR for Excel only. It is kept, and its old justification is CORRECTED
// here because this tree has since proved it wrong.
//
// THE TRIGGER IS THE COMPRESSION-METHOD BYTE AT OFFSET 8, AND ANYONE
// REPRODUCING THIS MUST SET IT. A ZIP local-file header declaring method 8
// (DEFLATE) hangs. The same header declaring method 0 (STORED) THROWS in
// 1-3 ms and is caught below, surfacing as "That file could not be read. It
// may be corrupt or password-protected."
//
// THIS OMISSION HAS ALREADY COST AN HOUR. An earlier version of this comment
// described the input only as a "14-byte ZIP local-file header", so a screen
// built the obvious thing -- the signature followed by zero padding -- which
// declares method 0, threw in milliseconds, and read as proof that the hang
// was a Node-only artifact. It is not. Build the input with the method byte
// set or you will reproduce nothing.
//
// THE INPUT, IN FULL, so it can be rebuilt from this comment alone. A 30-byte
// local-file header, all little-endian, then padding to any length:
//   0-3   50 4B 03 04   signature
//   4-5   14 00         version needed
//   6-7   00 00         general purpose flag
//   8-9   08 00         COMPRESSION METHOD 8 = DEFLATE   <-- the trigger
//   10-11 00 00         last mod time
//   12-13 00 00         last mod date
//   14-17 00 00 00 00   CRC-32
//   18-21 00 00 00 00   compressed size
//   22-25 00 00 00 00   uncompressed size
//   26-27 00 00         file name length
//   28-29 00 00         extra field length
// Truncating that header to its first 14 bytes hangs identically, so bytes
// 14-29 are not load-bearing; byte 8 is. Padding may be zeros or noise.
//
// THE HANG IS A FULL-CORE CPU SPIN, NOT A WAIT. Measured: 4 seconds of
// processor time in 4 seconds of wall time. That matters for two reasons. It
// is why no timeout on the same thread could ever have interrupted it, and it
// is why this is not a Node artifact -- it is pure JavaScript with no I/O and
// no runtime services, and Chrome runs it on the same V8 engine.
//
// THE HANG IS NOT SIZE-BOUNDED. The earlier note said only a "tiny
// ZIP-header case" hangs and sized this floor to that belief. MEASURED IN
// THIS TREE, method byte set to 8: 600 bytes hangs, 5 KB hangs, 100 KB hangs,
// with zero padding and with noise padding alike, and the same holds for the
// bytes actually shipped in the built worker chunk. Every one of those is
// ABOVE this floor. No byte threshold separates the hanging inputs from the
// safe ones, so this value could not be raised into a guarantee at any figure.
//
// What still holds: every truncation of a REAL workbook, down to 1% of its
// bytes, throws cleanly in 1-2 ms and is caught below, and a genuine .xlsx
// cannot approach 512 bytes, since the container alone needs
// [Content_Types].xml, a workbook part, a sheet part and their relationships.
//
// So the floor is KEPT for what it actually is: a cheap refusal that settles
// one known input in about a millisecond without starting a Worker. It is not
// a safety boundary and nothing downstream may treat it as one. The Worker
// and its timeout are what contain the rest.
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

  // A FILE WITH NO USABLE SIZE IS REFUSED, not treated as unbounded. Both
  // thresholds below used to be written as `typeof file.size === 'number' &&
  // ...`, which SKIPPED them entirely for an object whose size was absent or
  // not a number: such an object passed the 10 MB ceiling AND the Excel floor
  // and went straight to the parser. Refusing is the deliberate choice. The
  // ceiling exists to fail before touching contents, so treating an unknown
  // size as small enough would defeat the one thing it is for, and a File from
  // a picker or a drop always carries a numeric size, so nothing legitimate is
  // turned away by this.
  if (typeof file.size !== 'number' || !Number.isFinite(file.size)) {
    return { ok: false, error: 'That file could not be measured, so it was not read. Try saving it again, or paste the rows.' };
  }

  // BEFORE any read (ruled).
  if (file.size > MAX_FILE_BYTES) {
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

// Excel. SheetJS NO LONGER LIVES ON THIS THREAD AT ALL: it is imported by
// rosterExcel.worker.js and bundled into that worker chunk, so this module
// names the worker and never touches a spreadsheet parser.
//
// The chunk stays LAZY, which was the point of the old dynamic import and is
// preserved by a different mechanism. The worker chunk is fetched when `new
// Worker` runs, which happens only for an Excel file, so the landing page, the
// individual surface and the advisor surface still pay nothing for a parser
// they never invoke. Verified against the build: the main bundle contains zero
// occurrences of the SheetJS banner and index.html preloads no worker chunk.
async function readExcel(file) {
  // No `typeof` test here: readRosterFile has already refused a file whose
  // size is not a finite number, so by this point it is one.
  if (file.size < MIN_EXCEL_BYTES) {
    return { ok: false, error: 'That file is too small to be a spreadsheet. It may be truncated or corrupt.' };
  }
  return parseExcelInWorker(await file.arrayBuffer());
}

// PARSE TIMEOUT, CHOSEN BY MEASUREMENT. Real workbooks were generated and
// timed against this exact SheetJS build: 500 rows (the row cap) parses in
// 7 ms at 92 KB, 10,000 rows in 69 ms at 1.55 MB, and 50,000 rows in 321 ms
// at 8.00 MB, which is the slowest parse that can legally reach the parser
// because MAX_FILE_BYTES refuses anything past 10 MB first.
//
// 10 seconds is roughly THIRTY TIMES that slowest legitimate parse. The
// headroom is deliberate and is not padding for its own sake: those figures
// come from Node on a desktop, and the operator may be on a phone, where the
// same work can be several times slower. A timeout that fires on a real
// 8 MB roster would be a worse defect than the one being contained, so the
// multiple is sized to make that outcome implausible rather than merely
// unlikely. Against a hang, any finite figure is an infinite improvement.
const PARSE_TIMEOUT_MS = 10000;

/**
 * Run the workbook through the Worker, with a timer the parse cannot block.
 *
 * WHY A TIMER IS POSSIBLE AT ALL NOW. On the main thread it was not: a hang
 * inside XLSX.read is synchronous, so a setTimeout scheduled beside it could
 * never be reached. With the parse on another thread this timer runs on a
 * thread the parse cannot block, which is the whole mechanical point of the
 * move.
 *
 * TERMINATION IS THE ONLY EXIT FROM A HANG, AND IT IS NOT A CURE. terminate()
 * stops the worker from the outside; it does not make the parse finish, and
 * until it fires the worker is spinning a core. The operator gets their page
 * and their work back, and that is all this buys. It is containment.
 *
 * ONE WORKER PER PARSE. It is created here, used once and terminated on every
 * exit path, so a hung worker can never outlive the read that started it and
 * there is no shared instance to leave poisoned. The chunk is browser-cached
 * after the first parse, so the cost of this is module instantiation, which is
 * negligible beside the parse itself.
 */
function parseExcelInWorker(buffer) {
  return new Promise((resolve) => {
    let worker;
    try {
      // `new URL(..., import.meta.url)` is the form Vite recognises to emit a
      // separate worker chunk. Constructed HERE rather than at module scope so
      // nothing is spun up until an Excel file is actually chosen.
      // No { type: 'module' }: the worker imports SheetJS statically so it needs
      // no code-splitting, which keeps it a CLASSIC worker and leaves vite.config.js
      // untouched. See the header of rosterExcel.worker.js for why that matters.
      worker = new Worker(new URL('./rosterExcel.worker.js', import.meta.url));
    } catch (err) {
      resolve({ ok: false, error: 'That file could not be read. It may be corrupt or password-protected.' });
      return;
    }

    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({
        ok: false,
        error: 'That file took too long to read and was stopped. It may be corrupt. Try saving it again as CSV, or paste the rows.',
      });
    }, PARSE_TIMEOUT_MS);

    worker.onmessage = (event) => {
      const data = event.data || {};
      if (data.ok) finish({ ok: true, text: data.text, notes: data.notes || [] });
      else finish({ ok: false, error: data.error || 'That file could not be read.' });
    };

    // Fires if the worker module itself fails to load or throws at top level,
    // which the onmessage handler would never see.
    worker.onerror = () => {
      finish({ ok: false, error: 'That file could not be read. It may be corrupt or password-protected.' });
    };

    // TRANSFERRED, not copied: a 10 MB roster would otherwise be duplicated in
    // memory on the way across. `buffer` is unusable here afterwards, which is
    // correct, since nothing on this side reads it again.
    worker.postMessage({ buffer }, [buffer]);
  });
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
