import { vi } from "./vi";
import { en } from "./en";
import { Translations } from "./vi";

export type Lang = "vi" | "en";
export type { Translations };

export function getDict(lang: Lang): Translations {
  return lang === "en" ? en : vi;
}
