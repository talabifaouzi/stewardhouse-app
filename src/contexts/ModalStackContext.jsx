import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/**
 * @typedef {Object} ModalStackValue
 * @property {(id: string) => void} push       Register a modal ID on the stack
 * @property {(id: string) => void} pop        Unregister a modal ID from the stack
 * @property {(id: string) => boolean} isTop   Whether this modal ID is the top of the stack
 * @property {(id: string) => number} indexOf  Position of this modal ID in the stack (0-based)
 * @property {number} depth                    Current stack size
 */

const ModalStackContext = createContext({
  push: () => {},
  pop: () => {},
  isTop: () => false,
  indexOf: () => -1,
  depth: 0,
});

export function ModalStackProvider({ children }) {
  const [stack, setStack] = useState([]);
  const stackRef = useRef(stack);
  stackRef.current = stack;

  const push = useCallback((id) => {
    setStack((s) => (s.includes(id) ? s : [...s, id]));
  }, []);

  const pop = useCallback((id) => {
    setStack((s) => s.filter((x) => x !== id));
  }, []);

  const isTop = useCallback(
    (id) => stackRef.current[stackRef.current.length - 1] === id,
    [],
  );
  const indexOf = useCallback((id) => stackRef.current.indexOf(id), []);

  useEffect(() => {
    if (stack.length === 0) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [stack.length]);

  const depth = stack.length;
  const value = useMemo(
    () => ({ push, pop, isTop, indexOf, depth }),
    [push, pop, isTop, indexOf, depth],
  );

  return (
    <ModalStackContext.Provider value={value}>
      {children}
    </ModalStackContext.Provider>
  );
}

export function useModalStack() {
  return useContext(ModalStackContext);
}
