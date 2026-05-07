/* ============================================================
   StewardHouse — Design Tokens
   Brand foundation, consistent across all surfaces.
   Edit values here; do not hardcode colors or fonts elsewhere.
   ============================================================ */

:root {
  /* Color — surfaces */
  --sh-bg: #FAF7F2;              /* warm beige background */
  --sh-bg-tint: #FBF8F3;         /* soft tint for non-action containers */
  --sh-card: #FFFFFF;            /* white card surfaces */
  --sh-card-border: #E8E2D6;     /* subtle card borders */
  --sh-divider: #F0EBDF;         /* between-section dividers */

  /* Color — text */
  --sh-text-primary: #2C2A26;    /* warm near-black */
  --sh-text-body: #3D3A33;       /* body text */
  --sh-text-secondary: #5A554C;  /* secondary information */
  --sh-text-muted: #8A8579;      /* metadata and labels */

  /* Color — accent */
  --sh-bronze: #8B7355;          /* primary accent — bronze */
  --sh-bronze-deep: #5A453A;     /* deeper bronze for text on tint */
  --sh-bronze-tint: #F5EFE3;     /* warm bronze tint for selected states */
  --sh-bronze-border: #D9C9B0;   /* bronze-adjacent border */

  /* Color — surface chrome accents
     Each user surface has a subtle accent strip
     to signal context without screaming */
  --sh-individual-accent: #6B7A6E;     /* sage green — personal */
  --sh-enterprise-accent: #4A5560;     /* slate — institutional */
  --sh-advisor-accent: #8B7355;        /* bronze — the original brand color, the working surface */
  --sh-operations-accent: #3D3A33;     /* dark warm — internal */

  /* Typography — families */
  --sh-font-serif: 'Libre Baskerville', Georgia, 'Times New Roman', serif;
  --sh-font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;

  /* Typography — sizes */
  --sh-text-xs: 11px;
  --sh-text-sm: 12px;
  --sh-text-base: 14px;
  --sh-text-md: 15px;
  --sh-text-lg: 17px;
  --sh-text-xl: 22px;
  --sh-text-2xl: 28px;
  --sh-text-3xl: 36px;

  /* Typography — line height */
  --sh-line-tight: 1.3;
  --sh-line-snug: 1.45;
  --sh-line-normal: 1.6;
  --sh-line-relaxed: 1.75;

  /* Spacing */
  --sh-space-1: 4px;
  --sh-space-2: 8px;
  --sh-space-3: 12px;
  --sh-space-4: 16px;
  --sh-space-5: 20px;
  --sh-space-6: 24px;
  --sh-space-8: 32px;
  --sh-space-10: 40px;
  --sh-space-12: 48px;
  --sh-space-16: 64px;
  --sh-space-20: 80px;

  /* Border radius */
  --sh-radius-sm: 4px;
  --sh-radius-md: 6px;
  --sh-radius-lg: 10px;
  --sh-radius-xl: 14px;
  --sh-radius-full: 999px;

  /* Borders */
  --sh-border-thin: 0.5px solid var(--sh-card-border);
  --sh-border-divider: 0.5px solid var(--sh-divider);

  /* Layout */
  --sh-content-max: 1200px;
  --sh-chrome-height: 64px;
  --sh-sidebar-width: 240px;

  /* Transitions */
  --sh-transition-fast: 120ms ease;
  --sh-transition: 200ms ease;
  --sh-transition-slow: 320ms ease;
}
