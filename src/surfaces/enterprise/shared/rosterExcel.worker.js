// Excel parse worker (roster-import arc). The FIRST off-main-thread code in
// this tree, so the reasoning is recorded here rather than assumed.
//
// THIS IS CONTAINMENT, NOT REPAIR. SheetJS 0.18.5 does not stop on some inputs:
// a ZIP local-file header DECLARING COMPRESSION METHOD 8 (DEFLATE) at offset 8,
// followed by arbitrary padding, never returns and never throws. Moving the
// parse here does NOT fix that. The spinning thread keeps spinning until the
// main thread terminates it, burning one core until it does. What this buys is
// that the spin is no longer the UI thread, so the page survives, the operator
// keeps their work, and a timeout becomes possible at all -- a timer on the
// main thread cannot be blocked by a loop that is no longer on the main thread.
// The hang is contained, not cured.
//
// THE METHOD BYTE IS THE WHOLE TRIGGER, and this comment used to omit it, which
// cost a screen an hour. Method 8 hangs; method 0 (STORED) throws in 1-3 ms and
// is caught below. A header built as the signature plus zero padding declares
// method 0, so it proves nothing. readRosterFile.js carries the full 30-byte
// construction beside MIN_EXCEL_BYTES; build the input from there.
//
// IT IS A FULL-CORE CPU SPIN, NOT A WAIT: 4 seconds of processor time in 4
// seconds of wall time. Pure JavaScript, no I/O, so it is not a Node artifact
// and Chrome runs it on the same V8 engine. FT confirmed the containment in
// Chrome: the crafted method-8 file spun this worker, the page stayed
// interactive throughout, and the timeout fired with the intended refusal.
//
// SIZE DOES NOT BOUND THE FAILURE. Measured in this tree with the method byte
// set: the same crafted header hangs at 600 bytes, at 5 KB and at 100 KB, while
// every truncation of a real workbook throws cleanly in 1-2 ms. So no byte
// threshold can be the answer, which is exactly why the parse had to move
// rather than be fenced.
//
// EVERYTHING SheetJS TOUCHES RUNS HERE. The read, the sheet inspection and the
// CSV conversion are all in this file. Returning a workbook object to the main
// thread and converting there would put sheet_to_csv back on the UI thread and
// leave half the problem in place.

// SheetJS is imported STATICALLY, and the choice is load-bearing for the build.
// Vite bundles workers as IIFE by default, and an IIFE cannot code-split, so a
// dynamic import('xlsx') in here fails the build outright with "UMD and IIFE
// output formats are not supported for code-splitting builds". The two ways
// out were to set worker.format to 'es' in vite.config.js, which makes this a
// MODULE worker and narrows browser support, or to import statically and let
// SheetJS be inlined into this worker chunk. Static wins on both counts: the
// shared Vite config is left alone, the worker stays a CLASSIC worker with the
// widest support, and the deferral the dynamic import was buying was already
// worthless here, because this worker is only ever constructed at the moment a
// workbook is about to be parsed.
//
// LAZINESS IS UNAFFECTED, which is the property that actually matters: this
// whole file, SheetJS included, is a separate chunk the browser fetches when
// the first Excel file is chosen. The main bundle does not carry a spreadsheet
// parser, and neither the landing page nor any other surface pays for one.
import * as XLSX from 'xlsx';

/**
 * One message in, one message out, then the main thread terminates this worker.
 *
 * IN:  { buffer: ArrayBuffer }   (transferred, not copied)
 * OUT: { ok: true, text: string, notes: string[] }
 *    | { ok: false, error: string }
 *
 * ERRORS CROSS AS STRINGS, DELIBERATELY. Error objects do not survive
 * structured clone intact: support for cloning them at all is uneven, and where
 * it exists the stack and any custom properties are lost, so a caught Error can
 * arrive as an empty or unrecognisable object. Every failure is therefore
 * flattened to an operator-facing string HERE, where the real error is still in
 * hand, and the main thread never has to interpret a half-cloned object.
 */
self.onmessage = (event) => {
  const buffer = event.data && event.data.buffer;
  if (!buffer) {
    self.postMessage({ ok: false, error: 'That file could not be read.' });
    return;
  }

  try {
    const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });

    const names = wb.SheetNames || [];
    if (names.length === 0) {
      self.postMessage({ ok: false, error: 'That workbook has no sheets.' });
      return;
    }

    // MULTIPLE WORKSHEETS: the FIRST is used, and the others are NAMED in a
    // note rather than silently dropped. Choosing among them by content would
    // be a guess, and asking would add a step to every single-sheet import,
    // which is nearly all of them.
    const notes = [];
    if (names.length > 1) {
      notes.push(`This workbook has ${names.length} sheets. Only "${names[0]}" was read; ${names.slice(1).map((n) => `"${n}"`).join(', ')} ${names.length === 2 ? 'was' : 'were'} ignored.`);
    }

    const sheet = wb.Sheets[names[0]];
    if (!sheet) {
      self.postMessage({ ok: false, error: 'That workbook has no readable sheet.' });
      return;
    }

    // MERGED CELLS: SheetJS puts a merged range's value in its top-left cell
    // and leaves the covered cells empty, so a header merged across two columns
    // yields one label followed by a blank. That blank is carried through
    // honestly and renders as "Column N" in the mapping step. Un-merging by
    // spreading the value across the range would invent header labels the file
    // does not contain.
    if (Array.isArray(sheet['!merges']) && sheet['!merges'].length > 0) {
      notes.push('Some cells in this sheet are merged. Merged values stay in their first column and the rest read as empty.');
    }

    // DISPLAYED VALUE, NOT STORED VALUE. sheet_to_csv emits each cell's
    // FORMATTED text (the `w` property) in preference to its raw value, which
    // is what the operator sees in Excel and what a roster means. Verified
    // against this version: a date cell holding 46036.79 with a display of
    // "1/14/26" emits "1/14/26". No option is needed to get this, and none is
    // passed, because the default is already the correct behaviour; passing
    // rawNumbers:false changes nothing and would imply otherwise.
    //
    // CSV rather than TSV: sheet_to_csv quotes any cell containing a comma, a
    // quote or a newline, and parseRoster's sniffer counts delimiters OUTSIDE
    // quotes, so a name like "Lovelace, Ada" survives the round trip. A TSV
    // conversion would have no equivalent guarantee for a cell containing a
    // tab.
    const text = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    if (text.trim() === '') {
      self.postMessage({ ok: false, error: `The sheet "${names[0]}" has no rows.` });
      return;
    }

    self.postMessage({ ok: true, text, notes });
  } catch (err) {
    // Flattened to a string here; see the note above on structured clone.
    self.postMessage({
      ok: false,
      error: 'That file could not be read. It may be corrupt or password-protected.',
    });
  }
};
