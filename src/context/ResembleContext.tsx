import React, { createContext, useContext, useReducer, type Dispatch } from 'react';
import type {
  ResembleState,
  SlotData,
  PendingCapture,
  ModelStatus,
  ComparisonMode,
  CelebResult,
} from '../types';
import type { ComparisonResult, Point2D } from '../engine';

// ── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_MODE'; mode: ComparisonMode }
  | { type: 'SET_IMAGE'; slot: string; uri: string }
  | { type: 'SET_DETECTION'; slot: string; landmarks: Point2D[]; descriptor: Float32Array | null; quality: number; platform: 'web' | 'native' }
  | { type: 'SET_DETECTION_ERROR'; slot: string; error: string }
  | { type: 'SET_DETECTING'; slot: string; detecting: boolean }
  | { type: 'CLEAR_SLOT'; slot: string }
  | { type: 'CLEAR_ALL' }
  | { type: 'SUBMIT_CAPTURE'; capture: PendingCapture }
  | { type: 'CONSUME_CAPTURE' }
  | { type: 'SET_MODEL_STATUS'; status: ModelStatus; error?: string }
  | { type: 'SET_RESULTS'; results: ComparisonResult | CelebResult }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CLEAR_RESULTS' };

// ── Initial State ────────────────────────────────────────────────────────────

const initialState: ResembleState = {
  mode: null,
  slots: {},
  pendingCapture: null,
  modelStatus: 'idle',
  modelError: null,
  results: null,
  error: null,
};

// ── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: ResembleState, action: Action): ResembleState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.mode, results: null, error: null };

    case 'SET_IMAGE': {
      const slot: SlotData = {
        uri: action.uri,
        landmarks: null,
        descriptor: null,
        quality: null,
        detecting: false,
        detectionError: null,
        platform: null,
      };
      return {
        ...state,
        slots: { ...state.slots, [action.slot]: slot },
        results: null,
      };
    }

    case 'SET_DETECTING':
      return {
        ...state,
        slots: {
          ...state.slots,
          [action.slot]: state.slots[action.slot]
            ? { ...state.slots[action.slot]!, detecting: action.detecting }
            : null,
        },
      };

    case 'SET_DETECTION': {
      const existing = state.slots[action.slot];
      if (!existing) return state;
      return {
        ...state,
        slots: {
          ...state.slots,
          [action.slot]: {
            ...existing,
            landmarks: action.landmarks,
            descriptor: action.descriptor,
            quality: action.quality,
            platform: action.platform,
            detecting: false,
            detectionError: null,
          },
        },
      };
    }

    case 'SET_DETECTION_ERROR': {
      const existing = state.slots[action.slot];
      if (!existing) return state;
      return {
        ...state,
        slots: {
          ...state.slots,
          [action.slot]: {
            ...existing,
            detecting: false,
            detectionError: action.error,
          },
        },
      };
    }

    case 'CLEAR_SLOT':
      return {
        ...state,
        slots: { ...state.slots, [action.slot]: null },
        results: null,
      };

    case 'CLEAR_ALL':
      return { ...state, slots: {}, results: null, error: null };

    case 'SUBMIT_CAPTURE':
      return { ...state, pendingCapture: action.capture };

    case 'CONSUME_CAPTURE':
      return { ...state, pendingCapture: null };

    case 'SET_MODEL_STATUS':
      return {
        ...state,
        modelStatus: action.status,
        modelError: action.error ?? null,
      };

    case 'SET_RESULTS':
      return { ...state, results: action.results, error: null };

    case 'SET_ERROR':
      return { ...state, error: action.error };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'CLEAR_RESULTS':
      return { ...state, results: null };

    default:
      return state;
  }
}

// ── Context ──────────────────────────────────────────────────────────────────

interface ResembleContextValue {
  state: ResembleState;
  dispatch: Dispatch<Action>;
}

const ResembleContext = createContext<ResembleContextValue | null>(null);

export function ResembleProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <ResembleContext.Provider value={{ state, dispatch }}>
      {children}
    </ResembleContext.Provider>
  );
}

export function useResemble(): ResembleContextValue {
  const ctx = useContext(ResembleContext);
  if (!ctx) throw new Error('useResemble must be used within ResembleProvider');
  return ctx;
}

export type { Action };
