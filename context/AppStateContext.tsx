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
  createDefaultUserProfile,
  generateGuestIdentity,
  Identity,
  IdentityVibe,
} from "@/lib/identity";
import { randomAvatarSeed } from "@/lib/avatar";
import {
  MOCK_OCEAN_STORIES,
  MOCK_SKY_STORIES,
  ReactionKind,
  Story,
  StoryAuthor,
  StoryType,
  warmthFromCount,
} from "@/lib/mockSignals";
import { moderateContent } from "@/lib/moderation";
import { useAuth } from "@/context/AuthContext";
import { fetchVisibleStories, insertReaction, insertStory } from "@/lib/storiesApi";

const STORAGE_KEY = "tram-phat-sang:v2"; // Đổi key để tránh xung đột dữ liệu cũ

export interface MoodHistoryEntry {
  timestamp: number;
  value: number;
}

// =====================================================
// MODULE 3.2 — Phản hồi đa dạng thay vì chỉ preset text.
// 5 hình thức: emotion react nhanh, sticker/emoji, virtual hug, món quà ẩn
// dụ, và lời nhắn (preset + tuỳ chọn viết ngắn — có moderation).
// `ReactionKind` giờ định nghĩa trong lib/mockSignals.ts — re-export lại
// ở đây để mọi nơi đang import từ "@/context/AppStateContext" không cần
// đổi gì (xem ghi chú trong mockSignals.ts).
// =====================================================
export type { ReactionKind };

/** Đếm số reaction đã gửi trong ngày hiện tại — giới hạn spam (spec 3.2
 * "Giới hạn số reaction / user / story / ngày"). Giới hạn theo story đã có
 * sẵn qua reactedStoryIds (mỗi story chỉ nhận 1 lượt/người dùng). */
export interface ReactionDayCounter {
  date: string; // yyyy-mm-dd, theo giờ local máy người dùng
  count: number;
}

export const DAILY_REACTION_LIMIT = 40;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

interface PersistedState {
  identity: Identity;
  soundEnabled: boolean;
  userStories: Story[];
  reactedStoryIds: string[];
  encouragedStoryIds: string[];
  moodHistory: MoodHistoryEntry[];
  reactionDay: ReactionDayCounter;
  /** Đã hoàn tất (hoặc chủ động bỏ qua) màn hình /profile-setup chưa —
   * Module 1.2. Chỉ có ý nghĩa với Registered user. */
  profileSetupComplete: boolean;
  /** Epoch ms lần đầu app này được mở trên thiết bị — dùng để tính mốc
   * "đã dùng app 7 ngày" cho gentle feedback prompt (spec 7.1). */
  firstOpenAt: number;
}

interface DraftState {
  content: string;
  type: StoryType | null;
}

export interface CompleteProfileSetupInput {
  displayName: string;
  vibe: IdentityVibe;
  avatarSeed: string;
  avatarPrompt?: string;
}

interface AppStateValue {
  identity: Identity;
  regenerateIdentity: () => void;
  setIdentityVibe: (vibe: IdentityVibe) => void;
  updateDisplayName: (name: string) => void;

  profileSetupComplete: boolean;
  completeProfileSetup: (input: CompleteProfileSetupInput) => void;
  skipProfileSetup: () => void;

  mood: number | null;
  setMood: (value: number) => void;
  moodHistory: MoodHistoryEntry[];

  draft: DraftState;
  setDraftContent: (text: string) => void;
  setDraftType: (type: StoryType) => void;

  /** Tất cả câu chuyện đang hiển thị công khai (đã qua kiểm duyệt) — Module 2.1. */
  stories: Story[];
  /** Câu chuyện của riêng người dùng hiện tại (kể cả đang chờ kiểm duyệt). */
  userStories: Story[];
  /** `overrideType` — cho phép /ritual quyết định loại thật sự (star/bubble)
   * theo hướng kéo thả ngay tại lúc thả, thay vì bị khoá cứng theo lựa
   * chọn ban đầu ở /write. Không truyền thì dùng draft.type như cũ. */
  releaseDraft: (overrideType?: StoryType) => { story: Story; highRisk: boolean } | null;
  lastReleasedStory: Story | null;

  reactedStoryIds: string[];
  /** Trả về false nếu bị chặn (đã reaction story này rồi, hoặc đã chạm
   * giới hạn reaction/ngày) để UI có thể phản hồi phù hợp. */
  sendReaction: (storyId: string, kind: ReactionKind, hasMessage?: boolean, messageText?: string) => boolean;
  /** Còn lại bao nhiêu reaction có thể gửi hôm nay — spec 3.2 giới hạn/ngày. */
  reactionsRemainingToday: number;

  encouragedStoryIds: string[];

  soundEnabled: boolean;
  toggleSound: () => void;

  /** Epoch ms lần đầu mở app trên thiết bị — spec 7.1 gentle feedback prompt. */
  firstOpenAt: number;

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

function fallbackPersisted(): PersistedState {
  return {
    identity: generateGuestIdentity(),
    soundEnabled: false,
    userStories: [],
    reactedStoryIds: [],
    encouragedStoryIds: [],
    moodHistory: getInitialMoodHistory(),
    reactionDay: { date: todayKey(), count: 0 },
    profileSetupComplete: false,
    firstOpenAt: Date.now(),
  };
}

/** Di trú identity cũ (trước Module 1, chưa phân biệt guest/user — chỉ có
 * { name, icon, vibe }) sang Identity union mới. Nhận `unknown` để tránh
 * mọi rắc rối suy luận kiểu dữ liệu khi đọc từ localStorage. */
function migrateIdentity(raw: unknown): Identity {
  if (raw && typeof raw === "object" && "kind" in (raw as Record<string, unknown>)) {
    return raw as Identity;
  }
  const legacy = raw as Record<string, unknown> | null | undefined;
  if (legacy && typeof legacy.name === "string") {
    return {
      kind: "guest",
      name: legacy.name,
      icon: legacy.icon as any,
      vibe: (legacy.vibe as IdentityVibe) || "cozy",
    };
  }
  return generateGuestIdentity();
}

/** Di trú "signal" cũ (trước Module 2 — thiếu reactionCount/moodAtRelease/
 * createdAt/author) sang Story đầy đủ metadata, để không vỡ dữ liệu người
 * dùng đã có trong localStorage. */
function migrateStory(raw: Record<string, unknown>): Story {
  const warmth = (raw.warmth as Story["warmth"]) || "few";
  return {
    id: raw.id as string,
    type: raw.type as StoryType,
    content: raw.content as string,
    x: raw.x as number,
    y: raw.y as number,
    size: raw.size as Story["size"],
    warmth,
    reactionCount: typeof raw.reactionCount === "number" ? raw.reactionCount : 0,
    moodAtRelease: typeof raw.moodAtRelease === "number" ? raw.moodAtRelease : null,
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : Date.now(),
    createdAgo: (raw.createdAgo as string) || "vừa xong",
    status: raw.status as Story["status"],
    author: (raw.author as StoryAuthor) || { name: "Ẩn Danh", vibe: "cozy" },
  };
}

function loadPersisted(): PersistedState {
  if (typeof window === "undefined") {
    return fallbackPersisted();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const moodHistory = Array.isArray(parsed.moodHistory) && parsed.moodHistory.length > 0
        ? (parsed.moodHistory as MoodHistoryEntry[])
        : getInitialMoodHistory();
      // Tương thích ngược: bản trước Module 2 lưu dưới khoá "userSignals".
      const rawUserStories = (parsed.userStories ?? parsed.userSignals) as unknown;
      const rawReacted = (parsed.reactedStoryIds ?? parsed.reactedSignalIds) as unknown;
      const rawEncouraged = (parsed.encouragedStoryIds ?? parsed.encouragedSignalIds) as unknown;
      const rawReactionDay = parsed.reactionDay as Record<string, unknown> | undefined;
      const reactionDay: ReactionDayCounter =
        rawReactionDay && typeof rawReactionDay.date === "string" && typeof rawReactionDay.count === "number"
          ? (rawReactionDay as unknown as ReactionDayCounter)
          : { date: todayKey(), count: 0 };

      return {
        identity: migrateIdentity(parsed.identity),
        soundEnabled: Boolean(parsed.soundEnabled),
        userStories: Array.isArray(rawUserStories)
          ? (rawUserStories as Record<string, unknown>[]).map(migrateStory)
          : [],
        reactedStoryIds: Array.isArray(rawReacted) ? (rawReacted as string[]) : [],
        encouragedStoryIds: Array.isArray(rawEncouraged) ? (rawEncouraged as string[]) : [],
        moodHistory,
        reactionDay,
        profileSetupComplete: typeof parsed.profileSetupComplete === "boolean" ? parsed.profileSetupComplete : false,
        firstOpenAt: typeof parsed.firstOpenAt === "number" ? parsed.firstOpenAt : Date.now(),
      };
    }
  } catch {
    // ignore, fall through
  }
  return fallbackPersisted();
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, hydrated: authHydrated } = useAuth();

  const [hydrated, setHydrated] = useState(false);
  const [identity, setIdentity] = useState<Identity>(() => generateGuestIdentity());
  const [profileSetupComplete, setProfileSetupComplete] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [reactedStoryIds, setReactedStoryIds] = useState<string[]>([]);
  const [encouragedStoryIds, setEncouragedStoryIds] = useState<string[]>([]);
  const [reactionDay, setReactionDay] = useState<ReactionDayCounter>({ date: todayKey(), count: 0 });
  const [firstOpenAt, setFirstOpenAt] = useState<number>(() => Date.now());
  const [mood, setMoodState] = useState<number | null>(null);
  const [moodHistory, setMoodHistory] = useState<MoodHistoryEntry[]>([]);
  const [draft, setDraft] = useState<DraftState>({ content: "", type: null });
  const [lastReleasedStory, setLastReleasedStory] = useState<Story | null>(null);
  const [allStories, setAllStories] = useState<Story[]>([]);

  // Hydrate from localStorage once, client-side only.
  useEffect(() => {
    const persisted = loadPersisted();
    setIdentity(persisted.identity);
    setProfileSetupComplete(persisted.profileSetupComplete);
    setSoundEnabled(persisted.soundEnabled);
    setUserStories(persisted.userStories);
    setReactedStoryIds(persisted.reactedStoryIds);
    setEncouragedStoryIds(persisted.encouragedStoryIds || []);
    setReactionDay(persisted.reactionDay);
    setFirstOpenAt(persisted.firstOpenAt);
    setMoodHistory(persisted.moodHistory);

    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem("tram-phat-sang:all-signals");
        if (raw) {
          const parsedAll = JSON.parse(raw) as Record<string, unknown>[];
          setAllStories(parsedAll.map(migrateStory));
        } else {
          setAllStories([...persisted.userStories, ...MOCK_SKY_STORIES, ...MOCK_OCEAN_STORIES]);
        }
      } catch {
        setAllStories([...persisted.userStories, ...MOCK_SKY_STORIES, ...MOCK_OCEAN_STORIES]);
      }
    }
    setHydrated(true);
  }, []);

  // Lấy câu chuyện THẬT từ Supabase (nếu đã cấu hình) và BỔ SUNG vào dữ
  // liệu mẫu đang có — không thay thế hoàn toàn, để không gian vẫn cảm
  // thấy sống động ngay cả khi mới có rất ít người dùng thật. An toàn khi
  // lỗi: fetchVisibleStories() tự trả về [] nếu chưa cấu hình/lỗi mạng/
  // chưa chạy schema.sql, nên không ảnh hưởng gì tới app nếu Supabase
  // chưa sẵn sàng (xem lib/storiesApi.ts).
  useEffect(() => {
    let cancelled = false;
    fetchVisibleStories().then((realStories) => {
      if (cancelled || realStories.length === 0) return;
      setAllStories((prev) => {
        const existingIds = new Set(prev.map((s) => s.id));
        const newOnes = realStories.filter((s) => !existingIds.has(s.id));
        if (newOnes.length === 0) return prev;
        return [...newOnes, ...prev];
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist relevant slices whenever they change.
  useEffect(() => {
    if (!hydrated) return;
    const toSave: PersistedState = {
      identity,
      soundEnabled,
      userStories,
      reactedStoryIds,
      encouragedStoryIds,
      moodHistory,
      reactionDay,
      profileSetupComplete,
      firstOpenAt,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      window.localStorage.setItem("tram-phat-sang:all-signals", JSON.stringify(allStories));
    } catch {
      // storage full or unavailable
    }
  }, [
    identity,
    soundEnabled,
    userStories,
    reactedStoryIds,
    encouragedStoryIds,
    moodHistory,
    reactionDay,
    firstOpenAt,
    allStories,
    hydrated,
    profileSetupComplete,
  ]);

  // =====================================================
  // MODULE 1 — Đồng bộ Identity theo trạng thái đăng nhập
  // Guest dùng danh tính ẩn danh tự sinh (không sửa được tên).
  // Registered có UserProfile riêng (tên tuỳ chỉnh + avatar AI) gắn với
  // userId (MVP hiện tại = email đã xác thực qua magic link).
  // =====================================================
  useEffect(() => {
    if (!hydrated || !authHydrated) return;

    if (isAuthenticated && user) {
      setIdentity((prev) => {
        if (prev.kind === "user" && prev.userId === user.email) return prev;
        const carriedVibe = prev.vibe;
        const carriedName = prev.kind === "guest" ? prev.name : undefined;
        const base = createDefaultUserProfile(user.email, carriedVibe);
        return carriedName ? { ...base, displayName: carriedName } : base;
      });
    } else if (!isAuthenticated) {
      setIdentity((prev) => (prev.kind === "guest" ? prev : generateGuestIdentity()));
      setProfileSetupComplete(false);
    }
  }, [isAuthenticated, user, hydrated, authHydrated]);

  const regenerateIdentity = useCallback(() => {
    setIdentity((prev) =>
      prev.kind === "guest"
        ? generateGuestIdentity()
        : { ...prev, avatarSeed: randomAvatarSeed(), avatarPrompt: undefined }
    );
  }, []);

  const setIdentityVibe = useCallback((vibe: IdentityVibe) => {
    setIdentity((prev) => ({ ...prev, vibe }));
  }, []);

  /** Module 9.1 — sửa tên hiển thị từ /settings, chỉ áp dụng cho Registered
   * user (Guest không edit tên được, theo đúng nguyên tắc Module 1.1). */
  const updateDisplayName = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setIdentity((prev) => (prev.kind === "user" ? { ...prev, displayName: trimmed } : prev));
  }, []);

  const completeProfileSetup = useCallback(
    (input: CompleteProfileSetupInput) => {
      setIdentity((prev) => ({
        kind: "user",
        userId: prev.kind === "user" ? prev.userId : user?.email ?? "guest",
        displayName: input.displayName.trim() || "Ẩn Danh",
        vibe: input.vibe,
        avatarSeed: input.avatarSeed,
        avatarPrompt: input.avatarPrompt?.trim() || undefined,
      }));
      setProfileSetupComplete(true);
    },
    [user]
  );

  const skipProfileSetup = useCallback(() => {
    setProfileSetupComplete(true);
  }, []);

  const setMood = useCallback((value: number) => {
    setMoodState(value);
  }, []);

  const setDraftContent = useCallback((text: string) => {
    setDraft((d) => ({ ...d, content: text }));
  }, []);

  const setDraftType = useCallback((type: StoryType) => {
    setDraft((d) => ({ ...d, type }));
  }, []);

  const releaseDraft = useCallback((overrideType?: StoryType) => {
    const finalType = overrideType ?? draft.type;
    if (!finalType || draft.content.trim().length === 0) return null;

    const { status, highRisk, matchedTerms } = moderateContent(draft.content);

    // Snapshot danh tính ẩn danh tại thời điểm thả — spec Module 2.1
    // "author_identity (ẩn danh)". Không hiển thị cho người khác xem.
    const author: StoryAuthor =
      identity.kind === "guest"
        ? { name: identity.name, vibe: identity.vibe, icon: identity.icon }
        : { name: identity.displayName, vibe: identity.vibe };

    const tempId = `u-${Date.now()}`;
    // Trải rộng khắp không gian ảo (5–95%) thay vì co cụm giữa màn hình,
    // để việc kéo lướt khám phá luôn có gì đó chờ ở các góc xa.
    const x = 5 + Math.random() * 90;
    const y = 5 + Math.random() * 90;

    const story: Story = {
      id: tempId,
      type: finalType,
      content: draft.content.trim(),
      x,
      y,
      size: "md",
      warmth: "few",
      reactionCount: 0,
      moodAtRelease: mood,
      createdAt: Date.now(),
      createdAgo: "vừa xong",
      status,
      author,
    };

    // Lưu vào lịch sử câu chuyện của user — TỨC THÌ, không chờ mạng.
    setUserStories((prev) => [story, ...prev]);
    setAllStories((prev) => [story, ...prev]);
    setLastReleasedStory(story);

    // Đồng thời lưu mood hiện tại vào lịch sử mood trend
    if (mood !== null) {
      setMoodHistory((prev) => [
        ...prev,
        { timestamp: Date.now(), value: mood },
      ]);
    }

    setDraft({ content: "", type: null });

    // Lưu THẬT lên Supabase ở nền, không chặn UI chờ mạng (xem
    // lib/storiesApi.ts). authorId luôn null hiện tại — Auth thật (magic
    // link qua Supabase) chưa được nối, xem supabase/BACKEND_INTEGRATION.md
    // mục 6; khi nối xong, thay bằng auth.uid() thật ở đây.
    insertStory({
      authorId: null,
      author,
      type: finalType,
      content: story.content,
      x,
      y,
      moodAtRelease: mood,
      status,
      matchedTerms,
    }).then((saved) => {
      if (!saved) return;
      // Thay id tạm bằng id thật từ database — để các reaction gửi tiếp
      // theo sau (cùng phiên) lưu đúng vào đúng câu chuyện trên server.
      const swap = (list: Story[]) => list.map((s) => (s.id === tempId ? saved : s));
      setUserStories(swap);
      setAllStories(swap);
      setLastReleasedStory((prev) => (prev && prev.id === tempId ? saved : prev));
    });

    return { story, highRisk };
  }, [draft, mood, identity]);

  const reactionsRemainingToday = useMemo(() => {
    const key = todayKey();
    const usedToday = reactionDay.date === key ? reactionDay.count : 0;
    return Math.max(0, DAILY_REACTION_LIMIT - usedToday);
  }, [reactionDay]);

  // Module 3.2 — nhận thêm `kind` để phân biệt 5 hình thức gửi ấm áp, và
  // trả về boolean để UI biết có bị chặn hay không. Lưu ý: một người dùng
  // ĐƯỢC PHÉP gửi nhiều tia sáng/lời nhắn tới cùng một câu chuyện (không
  // còn giới hạn "chỉ gửi được 1 lần/story" như trước) — giới hạn an toàn
  // duy nhất còn lại là tổng số lượt gửi trong một ngày (chống spam/bully
  // trên diện rộng), không phải theo từng story riêng lẻ.
  const sendReaction = useCallback(
    (storyId: string, kind: ReactionKind, hasMessage?: boolean, messageText?: string): boolean => {
      const key = todayKey();
      const usedToday = reactionDay.date === key ? reactionDay.count : 0;
      if (usedToday >= DAILY_REACTION_LIMIT) return false;

      setReactedStoryIds((prev) => (prev.includes(storyId) ? prev : [...prev, storyId]));
      if (hasMessage) {
        setEncouragedStoryIds((prev) => (prev.includes(storyId) ? prev : [...prev, storyId]));
      }
      setReactionDay({ date: key, count: usedToday + 1 });

      // Tăng reaction_count thật (metadata nội bộ) và suy ra lại nhãn warmth
      // định tính từ đó — không hiển thị con số thô cho người dùng (A8).
      // `kind` không đổi cách tính warmth (mọi hình thức đều "ấm" như nhau)
      // nhưng được giữ lại tham số để tương lai phân tích/API thật dùng tới.
      setAllStories((prev) =>
        prev.map((s) => {
          if (s.id !== storyId) return s;
          const reactionCount = s.reactionCount + 1;
          return { ...s, reactionCount, warmth: warmthFromCount(reactionCount) };
        })
      );

      // Lưu THẬT lên Supabase ở nền — không chặn UI chờ mạng. senderId
      // luôn null hiện tại, tương tự releaseDraft() (chưa nối Auth thật).
      // Nếu storyId là id tạm (câu chuyện vừa thả trong CÙNG phiên, chưa
      // kịp đồng bộ id thật từ server) thì lượt gửi này sẽ không lưu được
      // lên server — vẫn cập nhật UI cục bộ bình thường ở trên, chỉ là
      // chưa đồng bộ, chấp nhận được ở giai đoạn tích hợp này.
      insertReaction({ storyId, senderId: null, kind, message: hasMessage ? messageText : undefined });

      return true;
    },
    [reactionDay]
  );

  const toggleSound = useCallback(() => {
    setSoundEnabled((v) => !v);
  }, []);

  const stories = useMemo(() => {
    return allStories.filter((s) => s.status === "visible");
  }, [allStories]);

  const value: AppStateValue = {
    identity,
    regenerateIdentity,
    setIdentityVibe,
    updateDisplayName,
    profileSetupComplete,
    completeProfileSetup,
    skipProfileSetup,
    mood,
    setMood,
    moodHistory,
    draft,
    setDraftContent,
    setDraftType,
    stories,
    userStories,
    releaseDraft,
    lastReleasedStory,
    reactedStoryIds,
    sendReaction,
    reactionsRemainingToday,
    encouragedStoryIds,
    soundEnabled,
    toggleSound,
    firstOpenAt,
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
