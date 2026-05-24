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
const DEFAULT_STATE = {
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

export function IntakeProvider({ children }) {
  // Always initialize from DEFAULT_STATE — no localStorage persistence in
  // the demo. State changes are session-only.
  const [state, setState] = useState(DEFAULT_STATE);

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
