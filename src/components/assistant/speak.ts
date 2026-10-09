"use client";

import { useSyncExternalStore } from "react";

/**
 * Read a word aloud with the device's own speech voice. There is no audio
 * service behind this: if the device has no voice for the language, nothing
 * is played.
 */

export const canSpeak = (): boolean => typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";

const subscribeNothing = () => () => {};

/** Whether this browser can read aloud; false while hydrating, so server and browser agree. */
export function useCanSpeak(): boolean {
  return useSyncExternalStore(subscribeNothing, canSpeak, () => false);
}

const LANG = { en: "en-US", es: "es-ES" } as const;

/** What is read for a Spanish translation: without the "/a" the book prints after gendered words. */
export const spokenSpanish = (text: string) => text.replace(/\/\p{L}{1,2}(?![\p{L}/])/gu, "").replace(/\s+/g, " ").trim();

export function speak(text: string, language: "en" | "es"): void {
  if (!canSpeak() || !text.trim()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(language === "es" ? spokenSpanish(text) : text);
  utterance.lang = LANG[language];
  utterance.rate = 0.9;
  const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(language));
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
}
