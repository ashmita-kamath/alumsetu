// Words the forum filter blocks (English and common Hindi/Hinglish abuse).
// Kept in its own file so the team can extend it without touching the logic.
// Write words in lowercase, plain letters only; the filter handles case,
// repeated letters ("fuuuck") and look-alike symbols ("sh1t", "@ss") itself.

// Blocked only as a whole word ("ass" blocks "ass", not "class" or "assessment").
export const BLOCKED_WORDS = [
  "ass", "arse", "asshole", "bastard", "bitch", "bollocks", "boobs", "cock",
  "cunt", "dick", "dickhead", "dumbass", "jackass", "nigga", "nigger", "piss",
  "porn", "prick", "pussy", "retard", "shit", "slut", "twat", "wanker", "whore",
  "faggot", "fag",
  // Hindi / Hinglish
  "bsdk", "bhosdi", "bhosdike", "bhosda", "bhenchod", "behenchod", "benchod",
  "madarchod", "maderchod", "chutiya", "chutiye", "chutia", "chut", "gaand", "gandu",
  "lauda", "lavda", "lund", "randi", "harami", "haramkhor", "jhatu",
];

// Also blocked at the START of a word, to catch endings: "fucking", "bitches", "shitty".
// Only roots that are never the start of a normal word belong here.
export const BLOCKED_ROOTS = ["fuck", "motherfuck", "bitch", "shit", "asshole", "bullshit", "chutiy", "madarchod", "bhenchod", "behenchod"];
