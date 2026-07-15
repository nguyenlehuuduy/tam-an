"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AnonymousIdentity,
  generateIdentity,
  IdentityVibe,
} from "@/lib/identity";
import {
  MOCK_OCEAN_SIGNALS,
  MOCK_SKY_SIGNALS,
  Signal,
  SignalType,
} from "@/lib/mockSignals";
import { moderateContent } from "@/lib/moderation";

const STORAGE_KEY = "tram-phat-sang:v2"; // Đổi key để tránh xung đột dữ liệu cũ

export interface MoodHistoryEntry {
  timestamp: number;
  value: number;
}

interface PersistedState {
  identity: AnonymousIdentity;
  soundEnabled: boolean;
  userSignals: Signal[];
  reactedSignalIds: string[];
  encouragedSignalIds: string[];
  moodHistory: MoodHistoryEntry[];
}

interface DraftState {
  content: string;
  type: SignalType | null;
}

interface AppStateValue {
  identity: AnonymousIdentity;
  regenerateIdentity: () => void;
  setIdentityVibe: (vibe: IdentityVibe) => void;

  mood: number | null;
  setMood: (value: number) => void;
  moodHistory: MoodHistoryEntry[];

  draft: DraftState;
  setDraftContent: (text: string) => void;
  setDraftType: (type: SignalType) => void;

  signals: Signal[];
  userSignals: Signal[];
  releaseDraft: () => { signal: Signal; highRisk: boolean } | null;
  lastReleasedSignal: Signal | null;

  reactedSignalIds: string[];
  sendReaction: (signalId: string, hasMessage?: boolean) => void;

  encouragedSignalIds: string[];

  soundEnabled: boolean;
  toggleSound: () => void;

  hydrated: boolean;
}

const AppStateContext = createContext<AppStateValue | null>(null);

function getInitialMoodHistory(): MoodHistoryEntry[] {
  const now = Date.now();
  return [
    { timestamp: now - 5 * 24 * 60 * 60 * 1000, value: 4 },
    { timestamp: now - 4 * 24 * 60 * 60 * 1000, value: 3 },
    { timestamp: now - 3 * 24 * 60 * 60 * 1000, value: 6 },
    { timestamp: now - 2 * 24 * 60 * 60 * 1000, value: 5 },
    { timestamp: now - 1 * 24 * 60 * 60 * 1000, value: 7 },
  ];
}

function loadPersisted(): PersistedState {
  if (typeof window === "undefined") {
    return {
      identity: generateIdentity(),
      soundEnabled: false,
      userSignals: [],
      reactedSignalIds: [],
      encouragedSignalIds: [],
      moodHistory: getInitialMoodHistory(),
    };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      if (!parsed.moodHistory || parsed.moodHistory.length === 0) {
        parsed.moodHistory = getInitialMoodHistory();
      }
      return parsed;
    }
  } catch {
    // ignore, fall through
  }
  return {
    identity: generateIdentity(),
    soundEnabled: false,
    userSignals: [],
    reactedSignalIds: [],
    encouragedSignalIds: [],
    moodHistory: getInitialMoodHistory(),
  };
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [identity, setIdentity] = useState<AnonymousIdentity>(() => generateIdentity());
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [userSignals, setUserSignals] = useState<Signal[]>([]);
  const [reactedSignalIds, setReactedSignalIds] = useState<string[]>([]);
  const [encouragedSignalIds, setEncouragedSignalIds] = useState<string[]>([]);
  const [mood, setMoodState] = useState<number | null>(null);
  const [moodHistory, setMoodHistory] = useState<MoodHistoryEntry[]>([]);
  const [draft, setDraft] = useState<DraftState>({ content: "", type: null });
  const [lastReleasedSignal, setLastReleasedSignal] = useState<Signal | null>(null);
  const [allSignals, setAllSignals] = useState<Signal[]>([]);

  // Hydrate from localStorage once, client-side only.
  useEffect(() => {
    const persisted = loadPersisted();
    setIdentity(persisted.identity);
    setSoundEnabled(persisted.soundEnabled);
    setUserSignals(persisted.userSignals);
    setReactedSignalIds(persisted.reactedSignalIds);
    setEncouragedSignalIds(persisted.encouragedSignalIds || []);
    setMoodHistory(persisted.moodHistory);
    
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem("tram-phat-sang:all-signals");
        if (raw) {
          setAllSignals(JSON.parse(raw));
        } else {
          setAllSignals([...persisted.userSignals, ...MOCK_SKY_SIGNALS, ...MOCK_OCEAN_SIGNALS]);
        }
      } catch {
        setAllSignals([...persisted.userSignals, ...MOCK_SKY_SIGNALS, ...MOCK_OCEAN_SIGNALS]);
      }
    }
    setHydrated(true);
  }, []);

  // Persist relevant slices whenever they change.
  useEffect(() => {
    if (!hydrated) return;
    const toSave: PersistedState = {
      identity,
      soundEnabled,
      userSignals,
      reactedSignalIds,
      encouragedSignalIds,
      moodHistory,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      window.localStorage.setItem("tram-phat-sang:all-signals", JSON.stringify(allSignals));
    } catch {
      // storage full or unavailable
    }
  }, [identity, soundEnabled, userSignals, reactedSignalIds, encouragedSignalIds, moodHistory, allSignals, hydrated]);

  const regenerateIdentity = useCallback(() => {
    setIdentity(generateIdentity());
  }, []);

  const setIdentityVibe = useCallback((vibe: IdentityVibe) => {
    setIdentity((prev) => ({ ...prev, vibe }));
  }, []);

  const setMood = useCallback((value: number) => {
    setMoodState(value);
  }, []);

  const setDraftContent = useCallback((text: string) => {
    setDraft((d) => ({ ...d, content: text }));
  }, []);

  const setDraftType = useCallback((type: SignalType) => {
    setDraft((d) => ({ ...d, type }));
  }, []);

  const releaseDraft = useCallback(() => {
    if (!draft.type || draft.content.trim().length === 0) return null;

    const { status, highRisk } = moderateContent(draft.content);

    const signal: Signal = {
      id: `u-${Date.now()}`,
      type: draft.type,
      content: draft.content.trim(),
      x: 15 + Math.random() * 70,
      y: 15 + Math.random() * 70,
      size: "md",
      warmth: "few",
      createdAgo: "vừa xong",
      status,
    };

    // Lưu vào lịch sử tín hiệu của user
    setUserSignals((prev) => [signal, ...prev]);
    setAllSignals((prev) => [signal, ...prev]);
    setLastReleasedSignal(signal);

    // Đồng thời lưu mood hiện tại vào lịch sử mood trend
    if (mood !== null) {
      setMoodHistory((prev) => [
        ...prev,
        { timestamp: Date.now(), value: mood },
      ]);
    }

    setDraft({ content: "", type: null });

    return { signal, highRisk };
  }, [draft, mood]);

  const sendReaction = useCallback((signalId: string, hasMessage?: boolean) => {
    setReactedSignalIds((prev) =>
      prev.includes(signalId) ? prev : [...prev, signalId]
    );
    if (hasMessage) {
      setEncouragedSignalIds((prev) =>
        prev.includes(signalId) ? prev : [...prev, signalId]
      );
    }
    
    // Nâng cấp độ ấm áp của tín hiệu
    setAllSignals((prev) =>
      prev.map((s) => {
        if (s.id === signalId) {
          let newWarmth = s.warmth;
          if (s.warmth === "few") newWarmth = "some";
          else if (s.warmth === "some") newWarmth = "many";
          return { ...s, warmth: newWarmth };
        }
        return s;
      })
    );
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((v) => !v);
  }, []);

  const signals = useMemo(() => {
    return allSignals.filter((s) => s.status === "visible");
  }, [allSignals]);

  const value: AppStateValue = {
    identity,
    regenerateIdentity,
    setIdentityVibe,
    mood,
    setMood,
    moodHistory,
    draft,
    setDraftContent,
    setDraftType,
    signals,
    userSignals,
    releaseDraft,
    lastReleasedSignal,
    reactedSignalIds,
    sendReaction,
    encouragedSignalIds,
    soundEnabled,
    toggleSound,
    hydrated,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return ctx;
}
