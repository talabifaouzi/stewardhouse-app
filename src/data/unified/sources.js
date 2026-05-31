// Source-surface enum. Every unified-layer record carries one of these as
// its `sourceSurface` field. See ./types.js for the entity typedefs.

export const SOURCE_SURFACE = Object.freeze({
  INDIVIDUAL: 'individual',
  ADVISOR: 'advisor',
  ENTERPRISE: 'enterprise',
  SYNTHETIC: 'synthetic',
});
