import { createContext, useContext, useState } from 'react';
import {
  individualProfile as defaultProfile,
  gifts as defaultGifts,
} from '../data/individualProfile.js';

// Default demo profile — Marcus Thompson.
// This is the canonical demo state. We always start here on every page load.
// Onboarding modifies state in-memory during the session; a refresh restores
// this default. The user can also explicitly restore via the "Restore demo"
// link on Home.
export const DEFAULT_STATE = {
  intakeComplete: true,

  answers: {
    stage: 'early',
    authority: 'self',
    causes: defaultProfile.causes.map(c => c.id),
    geo: ['hometown', 'current'],
    geoDetail: defaultProfile.geoDetail,
    lived: 'I grew up in Cleveland. The basketball court at the rec center on Detroit Avenue was where I learned everything — discipline, friendship, what it meant to show up for people.',
    influence: 'My mother. Quietly, every week she found ways to take care of people in our neighborhood. She never made it about her.',
    visibility: defaultProfile.visibility,
    trust: 'full',
    budget: defaultProfile.budget,
    depth: 'deep',
    existingOrgs: 'Cleveland Youth Hoops Foundation, Northeast Ohio Sports Access Coalition',
    legacy: 'That I gave back to the place that raised me, and that the kids coming up after me had what I had.',
  },

  givingStyle: defaultProfile.givingStyle,
  worldLabel: 'Athletics',
  gifts: defaultGifts,
  lessonsDone: [],
  assignmentsDone: [],
};

const IntakeContext = createContext(null);

export const AUTHENTICATED_EMPTY_STATE = {
  intakeComplete: false,
  answers: {
    stage: '', authority: '', causes: [], geo: [], geoDetail: '',
    lived: '', influence: '', visibility: '', trust: '', budget: '',
    depth: '', existingOrgs: '', legacy: '',
  },
  givingStyle: null,
  worldLabel: 'Athletics',
  gifts: [],
  lessonsDone: [],
  assignmentsDone: [],
};

const ANSWER_FIELDS = [
  'stage', 'authority', 'causes', 'geo', 'geoDetail',
  'lived', 'influence', 'visibility', 'trust', 'budget',
  'depth', 'existingOrgs', 'legacy',
];

// Merges server-persisted intake.individual.* data (from /api/me) over
// AUTHENTICATED_EMPTY_STATE. serverIntake may be null (fresh user, nothing
// saved yet) or a partial object (some fields present, others never
// written). Any field NOT present in serverIntake keeps its empty default —
// this is a merge, not a replace, so a user who's only answered 3 of 13
// questions gets those 3 restored and the rest still blank, not an error.
export function buildInitialStateFromServer(serverIntake) {
  if (!serverIntake) return AUTHENTICATED_EMPTY_STATE;

  const answers = { ...AUTHENTICATED_EMPTY_STATE.answers };
  for (const field of ANSWER_FIELDS) {
    if (serverIntake[field] !== undefined) {
      answers[field] = serverIntake[field];
    }
  }

  return {
    ...AUTHENTICATED_EMPTY_STATE,
    answers,
    intakeComplete: serverIntake.intakeComplete ?? AUTHENTICATED_EMPTY_STATE.intakeComplete,
    givingStyle: serverIntake.givingStyle ?? AUTHENTICATED_EMPTY_STATE.givingStyle,
    worldLabel: serverIntake.worldLabel ?? AUTHENTICATED_EMPTY_STATE.worldLabel,
  };
}

// Merges server-persisted gifts (from /api/me) into AUTHENTICATED_EMPTY_STATE's
// starting shape. Unlike intake answers, gifts are append-only records with no
// local draft state to preserve — so this is a straight replace, not a
// field-by-field merge. serverGifts defaults to [] for fresh users.
export function buildInitialGiftsFromServer(serverGifts) {
  return Array.isArray(serverGifts) ? serverGifts : [];
}

export function IntakeProvider({ children, initialState = DEFAULT_STATE }) {
  // Initializes from initialState (defaults to DEFAULT_STATE — Marcus's
  // demo fixture — for backward compatibility with existing mounts).
  // The authenticated tree passes AUTHENTICATED_EMPTY_STATE explicitly so
  // demo and authenticated state can never leak into each other — see
  // App.jsx for the two separate IntakeProvider mounts.
  const [state, setState] = useState(initialState);

  // Update intake answers (during onboarding)
  const updateAnswer = (key, value) => {
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [key]: value },
    }));
  };

  // Toggle multi-select array values (causes, geo)
  const toggleAnswer = (key, value, max = null) => {
    setState(prev => {
      const current = prev.answers[key] || [];
      let next;
      if (current.includes(value)) {
        next = current.filter(x => x !== value);
      } else if (max && current.length >= max) {
        next = current;
      } else {
        next = [...current, value];
      }
      return { ...prev, answers: { ...prev.answers, [key]: next } };
    });
  };

  // Complete the intake — sets givingStyle and marks complete
  const completeIntake = (givingStyle) => {
    setState(prev => ({
      ...prev,
      intakeComplete: true,
      givingStyle,
    }));
  };

  // Reset to a blank state — used to start the new-user onboarding preview
  const resetIntake = () => {
    setState({
      intakeComplete: false,
      answers: {
        stage: '',
        authority: '',
        causes: [],
        geo: [],
        geoDetail: '',
        lived: '',
        influence: '',
        visibility: '',
        trust: '',
        budget: '',
        depth: '',
        existingOrgs: '',
        legacy: '',
      },
      givingStyle: null,
      worldLabel: 'Athletics',
      gifts: [],
      lessonsDone: [],
      assignmentsDone: [],
    });
  };

  // Restore Marcus's demo profile
  const loadDemo = () => {
    setState(DEFAULT_STATE);
  };

  // Add a gift to history
  const addGift = (gift) => {
    setState(prev => ({
      ...prev,
      gifts: [gift, ...prev.gifts],
    }));
  };

  // Mark a lesson done
  const markLessonDone = (lessonId) => {
    setState(prev => ({
      ...prev,
      lessonsDone: prev.lessonsDone.includes(lessonId)
        ? prev.lessonsDone
        : [...prev.lessonsDone, lessonId],
    }));
  };

  // Toggle an assignment's done state (two-way — client can uncheck)
  const toggleAssignment = (id) => {
    setState(prev => ({
      ...prev,
      assignmentsDone: prev.assignmentsDone.includes(id)
        ? prev.assignmentsDone.filter(x => x !== id)
        : [...prev.assignmentsDone, id],
    }));
  };

  return (
    <IntakeContext.Provider value={{
      ...state,
      updateAnswer,
      toggleAnswer,
      completeIntake,
      resetIntake,
      loadDemo,
      addGift,
      markLessonDone,
      toggleAssignment,
    }}>
      {children}
    </IntakeContext.Provider>
  );
}

export function useIntake() {
  const ctx = useContext(IntakeContext);
  if (!ctx) {
    throw new Error('useIntake must be used within IntakeProvider');
  }
  return ctx;
}
