// Content moderation for forum posts and comments (owner: Dhanishtha).
//
// checkText(...texts) returns { allowed: true } or { allowed: false, reason }.
// The forum service calls it before saving; a blocked text becomes 422 CONTENT_BLOCKED.
//
// HOW IT WORKS
// 1. normalize(): lowercase, swap look-alike symbols for letters (sh1t → shit,
//    @ss → ass), and squeeze repeated letters (fuuuuck → fuck).
// 2. Split into words on anything that is not a letter.
// 3. Join runs of single letters, so "f u c k" or "f.u.c.k" becomes "fuck".
// 4. A word is blocked if it IS a blocked word, or STARTS WITH a blocked root.
// Whole-word matching avoids false alarms like "class", "assessment" or "Scunthorpe".
//
// Also blocks obvious spam: more than MAX_LINKS links in one post.

import { BLOCKED_WORDS, BLOCKED_ROOTS } from "../data/blockedWords.js";

const MAX_LINKS = 5;

const LOOK_ALIKES = { 0: "o", 1: "i", 3: "e", 4: "a", 5: "s", 7: "t", "@": "a", $: "s", "!": "i" };

// "shiiit" → "shit": any letter repeated 2+ times becomes one letter.
const squeeze = (word) => word.replace(/([a-z])\1+/g, "$1");

export function normalize(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // remove accents: é → e
    .replace(/[013457@$!]/g, (ch) => LOOK_ALIKES[ch]);
}

// The blocked lists, squeezed the same way as the text ("asshole" → "ashole").
const WORDS = new Set(BLOCKED_WORDS.map(squeeze));
const ROOTS = BLOCKED_ROOTS.map(squeeze);

export function findBlockedWord(text) {
  const raw = normalize(text).split(/[^a-z]+/).filter(Boolean);

  // Join runs of single letters: ["f","u","c","k"] → "fuck"
  const words = [];
  let letters = "";
  for (const w of raw) {
    if (w.length === 1) {
      letters += w;
      continue;
    }
    if (letters) words.push(letters);
    letters = "";
    words.push(w);
  }
  if (letters) words.push(letters);

  for (const word of words.map(squeeze)) {
    if (WORDS.has(word) || ROOTS.some((root) => word.startsWith(root))) return word;
  }
  return null;
}

export function checkText(...texts) {
  const text = texts.filter(Boolean).join("\n");

  const links = text.match(/https?:\/\/|www\./gi) || [];
  if (links.length > MAX_LINKS) {
    return { allowed: false, reason: `Posts can contain at most ${MAX_LINKS} links` };
  }

  if (findBlockedWord(text)) {
    // We don't repeat the word back; just ask the user to edit.
    return { allowed: false, reason: "Your post contains language that isn't allowed on AlumSetu. Please edit it and try again." };
  }
  return { allowed: true };
}
