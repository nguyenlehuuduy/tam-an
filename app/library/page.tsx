"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Clock } from "lucide-react";
import clsx from "clsx";
import { useLanguage } from "@/context/LanguageContext";
import {
  LIBRARY_ARTICLES,
  CATEGORY_LABELS,
  MOOD_TAG_LABELS,
  ArticleCategory,
  MoodTag,
  getArticleTranslation,
} from "@/lib/libraryContent";

type CategoryFilter = ArticleCategory | "all";

export default function LibraryPage() {
  const { language, t } = useLanguage();
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [moodFilter, setMoodFilter] = useState<MoodTag | null>(null);
  const [query, setQuery] = useState("");

  const allMoodTags = useMemo(() => {
    const set = new Set<MoodTag>();
    LIBRARY_ARTICLES.forEach((a) => a.moodTags.forEach((m) => set.add(m)));
    return Array.from(set);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LIBRARY_ARTICLES.filter((a) => {
      if (category !== "all" && a.category !== category) return false;
      if (moodFilter && !a.moodTags.includes(moodFilter)) return false;
      if (q) {
        const tr = getArticleTranslation(a, language);
        const haystack = `${tr.title} ${tr.excerpt} ${a.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [category, moodFilter, query, language]);

  return (
    <div className="min-h-dvh bg-base-gradient px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/explore"
          className="mb-6 inline-flex items-center gap-2 text-sm text-base-text-secondary hover:text-base-text-primary transition-colors"
        >
          <ArrowLeft size={16} /> {t("common.back")}
        </Link>

        <header className="mb-6">
          <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-base-text-primary">
            {t("library.title")}
          </h1>
          <p className="mt-2 text-sm text-base-text-secondary">{t("library.subtitle")}</p>
        </header>

        {/* Search */}
        <div className="relative mb-4 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-text-secondary/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("library.searchPlaceholder")}
            className="w-full rounded-full border border-base-divider bg-base-surface/40 py-2.5 pl-10 pr-4 text-sm text-base-text-primary placeholder:text-base-text-secondary/40 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        {/* Category tabs */}
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            onClick={() => setCategory("all")}
            className={clsx(
              "rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-all",
              category === "all"
                ? "border-sky-aurora/50 bg-sky-aurora/15 text-sky-aurora"
                : "border-base-divider text-base-text-secondary/60 hover:text-base-text-primary"
            )}
          >
            {t("library.categories.all")}
          </button>
          {(Object.keys(CATEGORY_LABELS) as ArticleCategory[]).map((c) => {
            const meta = CATEGORY_LABELS[c];
            const active = category === c;
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={clsx(
                  "rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-all",
                  active
                    ? "border-sky-aurora/50 bg-sky-aurora/15 text-sky-aurora"
                    : "border-base-divider text-base-text-secondary/60 hover:text-base-text-primary"
                )}
              >
                {meta.emoji} {t(`library.categories.${c}`)}
              </button>
            );
          })}
        </div>

        {/* Mood tag filter chips */}
        <div className="mb-6 flex flex-wrap gap-1.5">
          {allMoodTags.map((m) => {
            const meta = MOOD_TAG_LABELS[m];
            const active = moodFilter === m;
            return (
              <button
                key={m}
                onClick={() => setMoodFilter(active ? null : m)}
                className={clsx(
                  "rounded-full border px-2.5 py-1 text-[10.5px] font-medium transition-all",
                  active
                    ? "border-warm/50 bg-warm/15 text-warm"
                    : "border-white/8 bg-white/[0.02] text-base-text-secondary/50 hover:text-base-text-secondary"
                )}
              >
                {meta.emoji} {language === "en" ? meta.en : meta.vi}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="rounded-card border border-base-divider bg-base-surface/20 p-10 text-center backdrop-blur">
            <p className="text-sm text-base-text-secondary italic">{t("library.emptyState")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((article, idx) => {
              const tr = getArticleTranslation(article, language);
              return (
                <motion.div
                  key={article.slug}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.35 }}
                >
                  <Link
                    href={`/library/${article.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-card border border-base-divider bg-base-surface/40 backdrop-blur transition-all hover:border-white/15 hover:bg-base-surface/60"
                  >
                    <div
                      className="flex h-28 items-center justify-center text-4xl"
                      style={{ background: article.coverGradient }}
                    >
                      {article.coverEmoji}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <span className="w-fit rounded-full bg-white/8 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-base-text-secondary/60">
                        {CATEGORY_LABELS[article.category].emoji} {t(`library.categories.${article.category}`)}
                      </span>
                      <h3 className="text-sm font-bold text-base-text-primary group-hover:text-white transition-colors leading-snug">
                        {tr.title}
                      </h3>
                      <p className="text-[12px] leading-relaxed text-base-text-secondary/60 line-clamp-2">
                        {tr.excerpt}
                      </p>
                      <div className="mt-auto flex items-center gap-2 pt-2 text-[10.5px] text-base-text-secondary/40">
                        <Clock size={11} />
                        {article.readingTimeMinutes} {t("library.readingTimeSuffix")}
                        <span>·</span>
                        <span className="truncate">{article.author.name}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
