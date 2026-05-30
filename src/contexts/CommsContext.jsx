import { createContext, useCallback, useContext, useState } from 'react';
import ComposeMessage from '../components/ComposeMessage.jsx';

// Session-only communications state for the enterprise surface.
// Holds the compose-modal state + per-recipient message threads (keyed by
// recipient email). Refresh clears everything — no persistence.
//
// ComposeMessage is rendered once at the provider level so all triggers
// (chrome user identity → UserProfile → Send message, AthleteProfile →
// Send reminder, ContactsDirectory → row → UserProfile → Send message)
// share a single instance.

const CommsContext = createContext(null);

/**
 * @typedef {Object} Message
 * @property {string} timestamp  ISO timestamp
 * @property {string} fromEmail
 * @property {string} fromName
 * @property {string} toEmail
 * @property {string} toName
 * @property {string} subject
 * @property {string} body
 */

export function CommsProvider({ currentUser, recipients, children }) {
  const [composingTo, setComposingTo] = useState(null);
  const [composeContext, setComposeContext] = useState(null);
  const [threads, setThreads] = useState({});

  const openCompose = useCallback((recipient, context) => {
    setComposingTo(recipient || null);
    setComposeContext(context || null);
  }, []);

  const closeCompose = useCallback(() => {
    setComposingTo(null);
    setComposeContext(null);
  }, []);

  const sendMessage = useCallback(
    (toEmail, toName, subject, body) => {
      const msg = {
        timestamp: new Date().toISOString(),
        fromEmail: currentUser.email,
        fromName: currentUser.name,
        toEmail,
        toName,
        subject,
        body,
      };
      setThreads((prev) => ({
        ...prev,
        [toEmail]: [...(prev[toEmail] || []), msg],
      }));
    },
    [currentUser],
  );

  const getThread = useCallback(
    (email) => threads[email] || [],
    [threads],
  );

  const value = {
    openCompose,
    closeCompose,
    sendMessage,
    getThread,
    currentUser,
    recipients,
  };

  return (
    <CommsContext.Provider value={value}>
      {children}
      <ComposeMessage
        isOpen={composingTo !== null}
        onClose={closeCompose}
        recipient={composingTo}
        context={composeContext}
        currentUser={currentUser}
        recipients={recipients}
        onSend={sendMessage}
      />
    </CommsContext.Provider>
  );
}

export function useComms() {
  const ctx = useContext(CommsContext);
  if (!ctx) {
    throw new Error('useComms must be used inside CommsProvider');
  }
  return ctx;
}
