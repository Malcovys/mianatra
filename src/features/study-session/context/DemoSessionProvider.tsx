import { checkExerciseAnswer } from "@/src/features/exercises/utils/exercise-checker";
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useReducer,
    type ReactNode,
} from "react";
import type { SessionAttempt, SessionMode, SessionSummary } from "../types/study-session.types";
import type { RealSessionExercise } from "../utils/real-session-exercise";
import { buildSessionSummary } from "../utils/session-summary";

type SessionStatus = "idle" | "active" | "completed" | "invalid";

type SessionState = {
  sessionId: string | null;
  status: SessionStatus;
  mode: SessionMode;
  currentIndex: number;
  exercises: RealSessionExercise[];
  answers: Record<string, string>;
  attempts: SessionAttempt[];
  hintsUsed: Record<string, boolean>;
  lastAttemptExerciseId: string | null;
  message: string | null;
};

type SessionContextValue = {
  state: SessionState;
  currentExercise: RealSessionExercise | null;
  lastAttempt: SessionAttempt | null;
  summary: SessionSummary;
  isLastExercise: boolean;
  startSession: (sessionId: string, mode?: SessionMode) => void;
  setAnswer: (exerciseId: string, answer: string) => void;
  showHint: (exerciseId: string) => void;
  submitAnswer: () => SessionAttempt | null;
  goToNextExercise: () => void;
  completeSession: () => void;
  startTargetedSession: () => void;
  resetSession: () => void;
};

type SessionAction =
  | { type: "start"; sessionId: string; mode: SessionMode; exercises: RealSessionExercise[] }
  | { type: "setAnswer"; exerciseId: string; answer: string }
  | { type: "showHint"; exerciseId: string }
  | { type: "submitAnswer"; attempt: SessionAttempt }
  | { type: "next" }
  | { type: "complete" }
  | { type: "invalid"; sessionId: string }
  | { type: "reset" };

const initialState: SessionState = {
  sessionId: null,
  status: "idle",
  mode: "initial",
  currentIndex: 0,
  exercises: [],
  answers: {},
  attempts: [],
  hintsUsed: {},
  lastAttemptExerciseId: null,
  message: null,
};

const SessionContext = createContext<SessionContextValue | null>(null);

function reducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "start": {
      const shouldKeepState =
        state.sessionId === action.sessionId &&
        state.mode === action.mode &&
        state.exercises.length === action.exercises.length &&
        state.status !== "invalid";

      if (shouldKeepState) {
        return state;
      }

      return {
        ...initialState,
        sessionId: action.sessionId,
        status: action.exercises.length > 0 ? "active" : "invalid",
        mode: action.mode,
        exercises: action.exercises,
        message: action.exercises.length > 0 ? null : "Cette série ne contient aucun exercice.",
      };
    }
    case "setAnswer":
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.exerciseId]: action.answer,
        },
        message: null,
      };
    case "showHint":
      return {
        ...state,
        hintsUsed: {
          ...state.hintsUsed,
          [action.exerciseId]: true,
        },
      };
    case "submitAnswer": {
      const attempts = state.attempts.filter(
        (attempt) => attempt.exerciseId !== action.attempt.exerciseId,
      );

      return {
        ...state,
        attempts: [...attempts, action.attempt],
        lastAttemptExerciseId: action.attempt.exerciseId,
        message: null,
      };
    }
    case "next":
      return {
        ...state,
        currentIndex: Math.min(state.currentIndex + 1, Math.max(state.exercises.length - 1, 0)),
        lastAttemptExerciseId: null,
        message: null,
      };
    case "complete":
      return {
        ...state,
        status: "completed",
        message: null,
      };
    case "invalid":
      return {
        ...initialState,
        sessionId: action.sessionId,
        status: "invalid",
        message: "Cette session d'exercices n'existe pas.",
      };
    case "reset":
      return initialState;
    default:
      return state;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const currentExercise = state.exercises[state.currentIndex] ?? null;
  const lastAttempt =
    state.attempts.find((attempt) => attempt.exerciseId === state.lastAttemptExerciseId) ?? null;
  const isLastExercise = state.currentIndex >= state.exercises.length - 1;
  const summary = useMemo(
    () => buildSessionSummary(state.attempts, state.exercises),
    [state.attempts, state.exercises],
  );

  const startSession = useCallback((sessionId: string, mode: SessionMode = "initial") => {
    dispatch({
      type: "start",
      sessionId,
      mode,
      exercises: [],
    });
  }, []);

  const setAnswer = useCallback((exerciseId: string, answer: string) => {
    dispatch({ type: "setAnswer", exerciseId, answer });
  }, []);

  const showHint = useCallback((exerciseId: string) => {
    dispatch({ type: "showHint", exerciseId });
  }, []);

  const submitAnswer = useCallback(() => {
    if (!currentExercise) {
      return null;
    }

    const rawAnswer = state.answers[currentExercise.id] ?? "";

    if (rawAnswer.trim().length === 0) {
      return null;
    }

    const checkResult = checkExerciseAnswer(currentExercise, rawAnswer);
    const attempt: SessionAttempt = {
      ...checkResult,
      conceptName: currentExercise.conceptName,
      usedHint: state.hintsUsed[currentExercise.id] ?? false,
    };

    dispatch({ type: "submitAnswer", attempt });

    return attempt;
  }, [currentExercise, state.answers, state.hintsUsed]);

  const goToNextExercise = useCallback(() => {
    dispatch({ type: "next" });
  }, []);

  const completeSession = useCallback(() => {
    dispatch({ type: "complete" });
  }, []);

  const startTargetedSession = useCallback(() => {
    dispatch({
      type: "start",
      sessionId: state.sessionId ?? "",
      mode: "targeted",
      exercises: [],
    });
  }, []);

  const resetSession = useCallback(() => {
    dispatch({ type: "reset" });
  }, []);

  const value = useMemo(
    () => ({
      state,
      currentExercise,
      lastAttempt,
      summary,
      isLastExercise,
      startSession,
      setAnswer,
      showHint,
      submitAnswer,
      goToNextExercise,
      completeSession,
      startTargetedSession,
      resetSession,
    }),
    [
      completeSession,
      currentExercise,
      goToNextExercise,
      isLastExercise,
      lastAttempt,
      resetSession,
      setAnswer,
      showHint,
      startSession,
      startTargetedSession,
      state,
      submitAnswer,
      summary,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);

  if (!value) {
    throw new Error("useSession must be used inside SessionProvider");
  }

  return value;
}
