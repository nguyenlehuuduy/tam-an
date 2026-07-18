"use client";

import { useMemo } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Info } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  LIBRARY_ARTICLES,
  CATEGORY_LABELS,
  MOOD_TAG_LABELS,
  getArticleBySlug,
  getArticleTranslation,
} from "@/lib/libraryContent";

export default function LibraryArticlePage() {
  const params = useParams<{ slug: string }>();
  const { language, t } = useLanguage();
  const article = getArticleBySlug(params.slug);

  const related = useMemo(() => {
    if (!article) return [];
    return LIBRARY_ARTICLES.filter(
      (a) => a.slug !== article.slug && a.moodTags.some((m) => article.moodTags.includes(m))
    ).slice(0, 3);
  }, [article]);

  if (!article) {
    notFound();
  }

  const tr = getArticleTranslation(article, language);

  return (
    <div className="min-h-dvh bg-base-gradient px-4 py-8 md:px-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/library"
          className="mb-6 inline-flex items-center gap-2 text-sm text-base-text-secondary hover:text-base-text-primary transition-colors"
        >
          <ArrowLeft size={16} /> {t("library.title")}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden rounded-card border border-base-divider bg-base-surface/40 backdrop-blur"
        >
          <div
            className="flex h-40 items-center justify-center text-6xl"
            style={{ background: article.coverGradient }}
          >
            {article.coverEmoji}
          </div>

          <div className="p-6">
            <span className="mb-3 inline-block rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-base-text-secondary/60">
              {CATEGORY_LABELS[article.category].emoji} {t(`library.categories.${article.category}`)}
            </span>

            <h1 className="font-display text-xl md:text-2xl font-extrabold text-base-text-primary leading-snug mb-2">
              {tr.title}
            </h1>

            <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-base-text-secondary/60">
              <span>{t("library.byAuthor")} {article.author.name}</span>
              <span>·</span>
              <span>{article.author.credentials}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Clock size={11} /> {article.readingTimeMinutes} {t("library.readingTimeSuffix")}
              </span>
            </div>

            <div className="mb-5 flex flex-wrap gap-1.5">
              <span className="text-[10.5px] text-base-text-secondary/40 mr-1">{t("library.moodTagsLabel")}:</span>
              {article.moodTags.map((m) => {
                const meta = MOOD_TAG_LABELS[m];
                return (
                  <span
                    key={m}
                    className="rounded-full border border-white/8 bg-white/[0.02] px-2 py-0.5 text-[10.5px] text-base-text-secondary/60"
                  >
                    {meta.emoji} {language === "en" ? meta.en : meta.vi}
                  </span>
                );
              })}
            </div>

            {tr.isFallback && (
              <div className="mb-5 flex items-start gap-2 rounded-xl border border-caution/25 bg-caution/10 px-3 py-2.5">
                <Info size={14} className="mt-0.5 shrink-0 text-caution" />
                <p className="text-[11.5px] leading-relaxed text-base-text-secondary/80">{t("library.fallbackNotice")}</p>
              </div>
            )}

            <div className="mb-2 h-px w-full bg-white/8" />

            <div className="flex flex-col gap-4 pt-4">
              {tr.body.map((para, idx) => (
                <p key={idx} className="text-[14.5px] leading-[1.9] text-base-text-primary/90">
                  {para}
                </p>
              ))}
            </div>
          </div>
        </motion.div>

        {related.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-base-text-secondary/60">
              {t("library.relatedLabel")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {related.map((a) => {
                const rtr = getArticleTranslation(a, language);
                return (
                  <Link
                    key={a.slug}
                    href={`/library/${a.slug}`}
                    className="group rounded-2xl border border-white/8 bg-white/[0.02] p-3.5 hover:bg-white/[0.06] hover:border-white/15 transition-all"
                  >
                    <div className="mb-2 text-xl">{a.coverEmoji}</div>
                    <p className="text-[12.5px] font-semibold text-base-text-primary group-hover:text-white leading-snug line-clamp-2">
                      {rtr.title}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
