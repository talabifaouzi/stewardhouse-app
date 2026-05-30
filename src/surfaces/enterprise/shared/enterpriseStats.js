import { athletes } from '../../../data/enterpriseFixtures.js';

// Module-level computed exports — single source of truth for the
// enterprise-surface metric block. Tree-shakable per import.

export const tot = athletes.length;
export const gpsD = athletes.filter((a) => a.gpsCompleted).length;
export const certD = athletes.filter((a) => a.certified).length;
export const inProg = athletes.filter((a) => a.lessons > 0 && !a.certified).length;
export const stalled = athletes.filter((a) => a.lessons > 0 && !a.gpsCompleted).length;
export const onTrack = inProg - stalled;
export const notStarted = athletes.filter((a) => a.lessons === 0).length;
export const tGi = athletes.reduce((s, a) => s + a.gifts, 0);
export const athletesWithGifts = athletes.filter((a) => a.gifts > 0).length;
export const gpsRate = Math.round((gpsD / tot) * 100);
export const activelyProgressingPct = Math.round(((certD + onTrack) / tot) * 100);
export const certRate = Math.round((certD / tot) * 100);
