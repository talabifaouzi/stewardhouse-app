import { useState } from 'react';
import { Card } from '../../../components/Card.jsx';
import { Button } from '../../../components/Button.jsx';
import { SectionLabel } from '../../../components/SectionLabel.jsx';
import { Modal } from '../../../components/Modal.jsx';
import { formatDate } from '../../../utils/formatDate.js';
import { CURRENT_USER } from '../../../data/enterpriseFixtures.js';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const STEPS = [
  'Institution',
  'Partnership',
  'Roster',
  'Roles',
  'Modules',
  'Workshops',
  'Sign-off',
];

const DEFAULT_LESSONS = [
  'Lesson 1: Building Your GPS',
  'Lesson 2: Cause Discovery',
  'Lesson 3: Giving Identity',
  'Lesson 4: Vetting Organizations',
  'Lesson 5: Giving Vehicles',
  'Lesson 6: Tax Strategy',
  'Lesson 7: Building Your Plan',
  'Lesson 8: Year-End Review',
  'Lesson 9: Capstone Reflection',
];

const DEFAULT_STATE = {
  institution: {
    name: 'Cooper State University',
    sector: 'Athletics',
    dept: 'Athletic Department',
    contactName: CURRENT_USER.name,
    contactEmail: CURRENT_USER.email,
    contactTitle: CURRENT_USER.title,
  },
  partnership: {
    tier: 'revenue-sports',
    term: 'Season Residency',
    startDate: '2026-08-01',
    endDate: '2027-05-31',
    annualPrice: '$85,000',
    endowment: '$8,500',
  },
  roster: {
    athleteCount: 16,
    note: 'Cooper State pilot cohort (pre-filled demo data)',
  },
  roles: {
    programAdmin: { name: CURRENT_USER.name, email: CURRENT_USER.email },
    complianceOfficer: { name: 'Sarah Mitchell', email: 'sarah.mitchell@cooperstate.edu' },
    devDirector: { name: 'Sarah Johnson', email: 'sarah.johnson@cooperstate.edu' },
  },
  modules: {
    defaultCurriculum: DEFAULT_LESSONS,
  },
  workshops: [
    { id: 1, date: '2026-09-15', title: 'Kickoff: Building Your GPS' },
    { id: 2, date: '2026-10-20', title: 'Giving Vehicles & Tax Strategy' },
    { id: 3, date: '2026-11-17', title: 'Vetting Organizations' },
    { id: 4, date: '2027-02-16', title: 'Year-End Review & Planning' },
    { id: 5, date: '2027-04-14', title: 'Capstone: Reflection & Next Steps' },
  ],
  signoff: {
    accuracy: false,
    terms: false,
  },
};

// -----------------------------------------------------------------------------
// Wizard
// -----------------------------------------------------------------------------

export default function SetupWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [visitedSteps, setVisitedSteps] = useState(new Set([0]));
  const [formState, setFormState] = useState(DEFAULT_STATE);
  const [showConfirmation, setShowConfirmation] = useState(false);
  // Demo control: facilitator (default) gates Steps 5-6 as pending; in-house keeps them editable.
  const [partnershipType, setPartnershipType] = useState('facilitator');

  const goToStep = (idx) => {
    if (visitedSteps.has(idx)) setCurrentStep(idx);
  };

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setVisitedSteps((prev) => new Set([...prev, nextStep]));
    }
  };

  const back = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const updateRoles = (patch) =>
    setFormState((s) => ({ ...s, roles: { ...s.roles, ...patch } }));
  const updateWorkshops = (workshops) =>
    setFormState((s) => ({ ...s, workshops }));
  const updateSignoff = (patch) =>
    setFormState((s) => ({ ...s, signoff: { ...s.signoff, ...patch } }));

  const canFinalize = formState.signoff.accuracy && formState.signoff.terms;
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <main style={mainStyle}>
      <p style={eyebrowStyle}>Athletic Department · Cooper State University</p>
      <h1 style={titleStyle}>Setup</h1>

      <Card tint style={{ marginBottom: 'var(--sh-space-5)' }}>
        <p style={bannerNoteStyle}>
          Illustrative full setup flow. In production, Steps 1–2 are completed by StewardHouse during partnership onboarding; Steps 3–4 by the athletic department; Steps 5–6 by the assigned philanthropic advisor or department admin; Step 7 requires sign-off from all parties.
        </p>
        <div style={toggleRowStyle}>
          <span style={toggleLabelStyle}>Demo: toggle partnership type —</span>
          <div style={segmentedControlStyle}>
            <button
              type="button"
              onClick={() => setPartnershipType('facilitator')}
              style={segmentButtonStyle(partnershipType === 'facilitator', 'left')}
            >
              Facilitator
            </button>
            <button
              type="button"
              onClick={() => setPartnershipType('in-house')}
              style={segmentButtonStyle(partnershipType === 'in-house', 'right')}
            >
              In-house
            </button>
          </div>
        </div>
      </Card>

      <Stepper
        steps={STEPS}
        currentStep={currentStep}
        visitedSteps={visitedSteps}
        onStepClick={goToStep}
      />

      <Card>
        <div style={stepContentStyle}>
          {currentStep === 0 && (
            <PendingStepPlaceholder
              title="Step 1: Institution"
              message="This step is completed by your StewardHouse contact during partnership onboarding. Institution details — name, sector, contract terms — are gathered and entered before the wizard becomes available to the athletic department."
            />
          )}
          {currentStep === 1 && (
            <PendingStepPlaceholder
              title="Step 2: Partnership"
              message="This step is completed by your StewardHouse contact during partnership onboarding. Partnership terms — tier, annual contribution, term length — are negotiated and recorded before the wizard becomes available to the athletic department."
            />
          )}
          {currentStep === 2 && <Step3Roster data={formState.roster} />}
          {currentStep === 3 && <Step4Roles data={formState.roles} onChange={updateRoles} />}
          {currentStep === 4 && (
            partnershipType === 'facilitator' ? (
              <PendingStepPlaceholder
                title="Step 5: Modules"
                message="This step is completed by your assigned philanthropic advisor. Module curriculum is selected based on the cohort's giving experience level and program duration."
              />
            ) : (
              <Step5Modules data={formState.modules} />
            )
          )}
          {currentStep === 5 && (
            partnershipType === 'facilitator' ? (
              <PendingStepPlaceholder
                title="Step 6: Workshops"
                message="This step is completed by your assigned philanthropic advisor. Workshop calendar is scheduled around your athletic season and program term."
              />
            ) : (
              <Step6Workshops data={formState.workshops} onChange={updateWorkshops} />
            )
          )}
          {currentStep === 6 && <Step7Signoff data={formState} onSignoffChange={updateSignoff} partnershipType={partnershipType} />}
        </div>
      </Card>

      <div style={navStyle}>
        <Button variant="ghost" onClick={back} disabled={currentStep === 0}>
          Back
        </Button>
        {!isLastStep ? (
          <Button variant="primary" onClick={next}>Next</Button>
        ) : (
          <Button variant="primary" onClick={() => setShowConfirmation(true)} disabled={!canFinalize}>
            Finalize Setup
          </Button>
        )}
      </div>

      <Modal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title="Setup complete"
      >
        <p style={confirmationTextStyle}>
          Setup complete — this is a prototype. No data is saved.
        </p>
      </Modal>
    </main>
  );
}

// -----------------------------------------------------------------------------
// Stepper
// -----------------------------------------------------------------------------

function PendingStepPlaceholder({ title, message }) {
  return (
    <div style={placeholderStyle}>
      <SectionLabel>{title}</SectionLabel>
      <span style={pendingPillStyle}>PENDING</span>
      <p style={placeholderMessageStyle}>{message}</p>
    </div>
  );
}

function Stepper({ steps, currentStep, visitedSteps, onStepClick }) {
  return (
    <ol style={stepperStyle} aria-label="Setup progress">
      {steps.map((label, idx) => {
        const isCurrent = idx === currentStep;
        const isCompleted = idx < currentStep && visitedSteps.has(idx);
        const canClick = visitedSteps.has(idx);
        return (
          <li key={idx} style={stepperItemStyle}>
            {idx > 0 && <div style={connectorStyle(idx <= currentStep)} />}
            <div style={stepperColumnStyle}>
              <button
                type="button"
                onClick={canClick ? () => onStepClick(idx) : undefined}
                disabled={!canClick}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`Step ${idx + 1}: ${label}`}
                style={indicatorStyle(isCurrent, isCompleted, canClick)}
              >
                {isCompleted ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="2 6 5 9 10 3" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </button>
              <p style={stepLabelStyle(isCurrent)}>{label}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// -----------------------------------------------------------------------------
// Step components
// -----------------------------------------------------------------------------

function Step3Roster({ data }) {
  return (
    <>
      <SectionLabel>Roster import</SectionLabel>
      <p style={paragraphStyle}>
        Athletes are added via CSV import or manual entry after setup. This step previews the roster shape; bulk import happens post-finalization.
      </p>
      <div style={rosterPreviewStyle}>
        <p style={rosterCountStyle}>{data.athleteCount} athletes</p>
        <p style={rosterNoteStyle}>{data.note}</p>
      </div>
      <Button variant="secondary" onClick={() => {}} disabled>
        Upload CSV (pending integration)
      </Button>
    </>
  );
}

function Step4Roles({ data, onChange }) {
  const roles = [
    { key: 'programAdmin', label: 'Program Admin' },
    { key: 'complianceOfficer', label: 'Compliance Officer' },
    { key: 'devDirector', label: 'Development Director' },
  ];
  return (
    <>
      <SectionLabel>Program roles</SectionLabel>
      <p style={paragraphStyle}>
        Three primary roles govern the program. Additional users can be added post-setup.
      </p>
      <div style={fieldStackStyle}>
        {roles.map((role) => (
          <div key={role.key} style={roleBlockStyle}>
            <p style={roleLabelStyle}>{role.label}</p>
            <div style={fieldGridStyle}>
              <TextField
                label="Name"
                value={data[role.key].name}
                onChange={(v) => onChange({ [role.key]: { ...data[role.key], name: v } })}
              />
              <TextField
                label="Email"
                type="email"
                value={data[role.key].email}
                onChange={(v) => onChange({ [role.key]: { ...data[role.key], email: v } })}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Step5Modules({ data }) {
  return (
    <>
      <SectionLabel>Default curriculum (9 lessons)</SectionLabel>
      <ul style={moduleListStyle}>
        {data.defaultCurriculum.map((lesson) => (
          <li key={lesson} style={moduleItemStyle}>{lesson}</li>
        ))}
      </ul>
      <div style={addOnSectionStyle}>
        <SectionLabel>Optional add-on modules</SectionLabel>
        <p style={addOnNoteStyle}>
          No add-ons available in v1. Contact your facilitator for custom curriculum.
        </p>
      </div>
    </>
  );
}

function Step6Workshops({ data, onChange }) {
  const updateWorkshop = (idx, patch) => {
    const next = [...data];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  return (
    <>
      <SectionLabel>Workshop schedule</SectionLabel>
      <div style={fieldStackStyle}>
        {data.map((w, idx) => (
          <div key={w.id} style={workshopRowStyle}>
            <p style={workshopNumberStyle}>Workshop {w.id}</p>
            <div style={fieldGridStyle}>
              <DateField
                label="Date"
                value={w.date}
                onChange={(v) => updateWorkshop(idx, { date: v })}
              />
              <TextField
                label="Title"
                value={w.title}
                onChange={(v) => updateWorkshop(idx, { title: v })}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Step7Signoff({ data, onSignoffChange, partnershipType }) {
  const facilitatorMode = partnershipType === 'facilitator';

  return (
    <>
      <SectionLabel>Review and sign off</SectionLabel>

      <div style={reviewSectionStyle}>
        <p style={reviewSectionTitleStyle}>Institution</p>
        <ReviewRow label="Status" value="Pending external completion" />
      </div>

      <div style={reviewSectionStyle}>
        <p style={reviewSectionTitleStyle}>Partnership</p>
        <ReviewRow label="Status" value="Pending external completion" />
      </div>

      <div style={reviewSectionStyle}>
        <p style={reviewSectionTitleStyle}>Roster</p>
        <ReviewRow label="Initial count" value={`${data.roster.athleteCount} athletes`} />
      </div>

      <div style={reviewSectionStyle}>
        <p style={reviewSectionTitleStyle}>Roles</p>
        <ReviewRow label="Program Admin" value={`${data.roles.programAdmin.name} · ${data.roles.programAdmin.email}`} />
        <ReviewRow label="Compliance Officer" value={`${data.roles.complianceOfficer.name} · ${data.roles.complianceOfficer.email}`} />
        <ReviewRow label="Development Director" value={`${data.roles.devDirector.name} · ${data.roles.devDirector.email}`} />
      </div>

      <div style={reviewSectionStyle}>
        <p style={reviewSectionTitleStyle}>Modules</p>
        {facilitatorMode ? (
          <ReviewRow label="Status" value="Pending external completion" />
        ) : (
          <ReviewRow label="Curriculum" value={`${data.modules.defaultCurriculum.length} default lessons`} />
        )}
      </div>

      <div style={reviewSectionStyle}>
        <p style={reviewSectionTitleStyle}>Workshops</p>
        {facilitatorMode ? (
          <ReviewRow label="Status" value="Pending external completion" />
        ) : (
          data.workshops.map((w) => (
            <ReviewRow key={w.id} label={`Workshop ${w.id}`} value={`${formatDate(w.date)} · ${w.title}`} />
          ))
        )}
      </div>

      <div style={signoffSectionStyle}>
        <CheckboxField
          label="I confirm the above details are accurate and authorize the StewardHouse partnership setup."
          checked={data.signoff.accuracy}
          onChange={(v) => onSignoffChange({ accuracy: v })}
        />
        <CheckboxField
          label="I have reviewed the platform terms and Path B structural posture."
          checked={data.signoff.terms}
          onChange={(v) => onSignoffChange({ terms: v })}
        />
      </div>
    </>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div style={reviewRowStyle}>
      <span style={reviewLabelStyle}>{label}</span>
      <span style={reviewValueStyle}>{value}</span>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Field helpers — each carries local focus state for bronze ring
// -----------------------------------------------------------------------------

function TextField({ label, value, onChange, type = 'text' }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={fieldStyle}>
      <label style={fieldLabelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...inputStyle,
          outline: focused ? '2px solid var(--sh-bronze)' : 'none',
          outlineOffset: '2px',
        }}
      />
    </div>
  );
}

function DateField({ label, value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={fieldStyle}>
      <label style={fieldLabelStyle}>{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...inputStyle,
          outline: focused ? '2px solid var(--sh-bronze)' : 'none',
          outlineOffset: '2px',
        }}
      />
    </div>
  );
}

function CheckboxField({ label, checked, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <label
      style={{
        ...checkboxLabelStyle,
        outline: focused ? '2px solid var(--sh-bronze)' : 'none',
        outlineOffset: '2px',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={checkboxInputStyle}
      />
      <span style={checkboxTextStyle}>{label}</span>
    </label>
  );
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const mainStyle = {
  maxWidth: 'var(--sh-content-max)',
  margin: '0 auto',
  padding: 'var(--sh-space-10) clamp(var(--sh-space-3), 4vw, var(--sh-space-8)) var(--sh-space-16)',
};

const eyebrowStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 'var(--sh-space-2)',
};

const titleStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-2xl)',
  color: 'var(--sh-text-primary)',
  marginBottom: 'var(--sh-space-6)',
};

const stepperStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  listStyle: 'none',
  margin: 0,
  padding: 0,
  marginBottom: 'var(--sh-space-6)',
  gap: 0,
};

const stepperItemStyle = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'flex-start',
  flex: 1,
  minWidth: 0,
};

const stepperColumnStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  flexShrink: 0,
};

function connectorStyle(reached) {
  return {
    flex: 1,
    height: '1px',
    background: reached ? 'var(--sh-bronze)' : 'var(--sh-card-border)',
    marginTop: 'var(--sh-space-4)',
    transition: 'background 150ms ease',
  };
}

function indicatorStyle(isCurrent, isCompleted, canClick) {
  return {
    width: 'var(--sh-space-8)',
    height: 'var(--sh-space-8)',
    borderRadius: '50%',
    border: `1px solid ${isCurrent || isCompleted ? 'var(--sh-bronze)' : 'var(--sh-card-border)'}`,
    background: isCurrent ? 'var(--sh-bronze)' : 'transparent',
    color: isCurrent ? 'var(--sh-text-on-accent)' : isCompleted ? 'var(--sh-bronze)' : 'var(--sh-text-muted)',
    fontSize: 'var(--sh-text-sm)',
    fontFamily: 'inherit',
    fontWeight: 500,
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: canClick ? 'pointer' : 'not-allowed',
    padding: 0,
    flexShrink: 0,
    transition: 'background 150ms ease, color 150ms ease, border-color 150ms ease',
  };
}

function stepLabelStyle(isCurrent) {
  return {
    fontSize: 'var(--sh-text-xs)',
    color: isCurrent ? 'var(--sh-text-primary)' : 'var(--sh-text-muted)',
    marginTop: 'var(--sh-space-2)',
    letterSpacing: '0.02em',
    fontWeight: isCurrent ? 500 : 400,
    whiteSpace: 'nowrap',
  };
}

const stepContentStyle = {
  paddingTop: 'var(--sh-space-3)',
  paddingBottom: 'var(--sh-space-3)',
};

const navStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 'var(--sh-space-5)',
};

const fieldGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 'var(--sh-space-4)',
  marginTop: 'var(--sh-space-3)',
};

const fieldStackStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--sh-space-4)',
  marginTop: 'var(--sh-space-3)',
};

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--sh-space-2)',
};

const fieldLabelStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 500,
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 'var(--sh-space-3)',
  border: 'var(--sh-border-thin)',
  borderRadius: 'var(--sh-radius-md)',
  fontFamily: 'inherit',
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  background: 'var(--sh-card)',
};

const checkboxLabelStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'var(--sh-space-3)',
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  cursor: 'pointer',
  padding: 'var(--sh-space-2)',
  borderRadius: 'var(--sh-radius-sm)',
  lineHeight: 1.55,
};

const checkboxInputStyle = {
  marginTop: '3px',
  cursor: 'pointer',
  flexShrink: 0,
};

const checkboxTextStyle = {
  flex: 1,
};

const paragraphStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.65,
  marginTop: 'var(--sh-space-3)',
  marginBottom: 'var(--sh-space-4)',
  maxWidth: '640px',
};

const rosterPreviewStyle = {
  background: 'var(--sh-bg-tint)',
  border: 'var(--sh-border-thin)',
  borderRadius: 'var(--sh-radius-md)',
  padding: 'var(--sh-space-4) var(--sh-space-5)',
  marginBottom: 'var(--sh-space-4)',
};

const rosterCountStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-lg)',
  color: 'var(--sh-text-primary)',
  marginBottom: 'var(--sh-space-1)',
};

const rosterNoteStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  fontStyle: 'italic',
};

const roleBlockStyle = {
  paddingTop: 'var(--sh-space-3)',
  paddingBottom: 'var(--sh-space-3)',
  borderBottom: 'var(--sh-border-default)',
};

const roleLabelStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-base)',
  color: 'var(--sh-text-primary)',
  marginBottom: 'var(--sh-space-2)',
};

const moduleListStyle = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  marginTop: 'var(--sh-space-3)',
};

const moduleItemStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  padding: 'var(--sh-space-3) 0',
  borderBottom: 'var(--sh-border-default)',
};

const addOnSectionStyle = {
  marginTop: 'var(--sh-space-6)',
};

const addOnNoteStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-muted)',
  fontStyle: 'italic',
  lineHeight: 1.6,
  marginTop: 'var(--sh-space-3)',
};

const workshopRowStyle = {
  paddingTop: 'var(--sh-space-3)',
  paddingBottom: 'var(--sh-space-3)',
  borderBottom: 'var(--sh-border-default)',
};

const workshopNumberStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-base)',
  color: 'var(--sh-text-primary)',
  marginBottom: 'var(--sh-space-2)',
};

const reviewSectionStyle = {
  marginTop: 'var(--sh-space-5)',
  paddingBottom: 'var(--sh-space-4)',
  borderBottom: 'var(--sh-border-default)',
};

const reviewSectionTitleStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-base)',
  color: 'var(--sh-text-primary)',
  marginBottom: 'var(--sh-space-2)',
};

const reviewRowStyle = {
  display: 'flex',
  gap: 'var(--sh-space-3)',
  padding: 'var(--sh-space-2) 0',
  fontSize: 'var(--sh-text-sm)',
};

const reviewLabelStyle = {
  color: 'var(--sh-text-muted)',
  minWidth: '180px',
  flexShrink: 0,
};

const reviewValueStyle = {
  color: 'var(--sh-text-body)',
  flex: 1,
};

const signoffSectionStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--sh-space-3)',
  marginTop: 'var(--sh-space-5)',
};

const confirmationTextStyle = {
  fontSize: 'var(--sh-text-md)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.65,
};

const bannerNoteStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.65,
  margin: 0,
};

const toggleRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--sh-space-3)',
  marginTop: 'var(--sh-space-3)',
  flexWrap: 'wrap',
};

const toggleLabelStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.02em',
};

const segmentedControlStyle = {
  display: 'inline-flex',
  borderRadius: 'var(--sh-radius-md)',
  overflow: 'hidden',
};

function segmentButtonStyle(isActive, side) {
  const radius = 'var(--sh-radius-md)';
  return {
    background: isActive ? 'var(--sh-bronze)' : 'transparent',
    color: isActive ? 'var(--sh-bg)' : 'var(--sh-bronze)',
    border: '1px solid var(--sh-bronze)',
    padding: '4px 12px',
    fontSize: 'var(--sh-text-xs)',
    fontFamily: 'inherit',
    fontWeight: 500,
    letterSpacing: '0.04em',
    cursor: 'pointer',
    borderTopLeftRadius: side === 'left' ? radius : 0,
    borderBottomLeftRadius: side === 'left' ? radius : 0,
    borderTopRightRadius: side === 'right' ? radius : 0,
    borderBottomRightRadius: side === 'right' ? radius : 0,
    borderRight: side === 'left' ? 'none' : '1px solid var(--sh-bronze)',
    transition: 'background 150ms ease, color 150ms ease',
  };
}

const placeholderStyle = {
  background: 'var(--sh-card)',
  border: 'var(--sh-border-thin)',
  borderRadius: 'var(--sh-radius-md)',
  padding: 'var(--sh-space-8) var(--sh-space-6)',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--sh-space-3)',
};

const pendingPillStyle = {
  display: 'inline-block',
  padding: '4px 12px',
  background: 'var(--sh-bronze-tint)',
  color: 'var(--sh-bronze-deep)',
  borderRadius: 'var(--sh-radius-full)',
  fontSize: 'var(--sh-text-xs)',
  fontWeight: 500,
  letterSpacing: '0.08em',
};

const placeholderMessageStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.65,
  maxWidth: '560px',
  margin: 0,
};
