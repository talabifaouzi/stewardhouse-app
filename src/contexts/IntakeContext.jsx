import { createContext, useContext, useEffect, useState } from 'react';
import {
  individualProfile as defaultProfile,
  gifts as defaultGifts,
} from '../data/individualProfile.js';

const STORAGE_KEY = 'stewardhouse_intake_v1';

// Default state — Marcus Thompson's pre-filled demo profile
const DEFAULT_STATE = {
  // Has the user completed onboarding?
  intakeComplete: true,

  // Intake answers (fully populated for Marcus by default)
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

  // Derived giving style (output of intake)
  givingStyle: defaultProfile.givingStyle,

  // World label — phase 1 always Athletics
  worldLabel: 'Athletics',

  // User's gift history
  gifts: defaultGifts,

  // Lessons completed
  lessonsDone: [],
};

const IntakeContext = createContext(null);

export function IntakeProvider({ children }) {
  const [state, setState] = useState(() => {
    // Try to load from localStorage; fall back to defaults
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // localStorage unavailable
    }
    return DEFAULT_STATE;
  });

  // Persist on any change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // localStorage unavailable — fail silently
    }
  }, [state]);

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

  // Reset state (for "start over" demo flow)
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
    });
  };

  // Restore the demo state (Marcus's filled-in profile)
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
