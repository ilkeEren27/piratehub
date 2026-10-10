// Slurs, hate speech, and explicit content — listed here solely to block them from user submissions.
const BLOCKLIST = [
  "fuck",
  "motherfuck",
  "shit",
  "bullshit",
  "bitch",
  "asshole",
  "cunt",
  "nigger",
  "nigga",
  "faggot",
  "fag",
  "retard",
  "whore",
  "slut",
  "porn",
  "porno",
  "pornography",
  "xxx",
  "onlyfans",
];

// Whole words only (plus common endings), so innocent words that merely
// contain a blocked one — "Scunthorpe", "flame retardant" — still pass.
const BLOCKLIST_PATTERN = new RegExp(
  `\\b(${BLOCKLIST.join("|")})(s|es|ed|er|ers|ing|in|y|ty)?\\b`,
  "i"
);

/**
 * Returns true if the text contains a blocked word.
 */
export function checkBlocklist(text) {
  return BLOCKLIST_PATTERN.test(String(text ?? ""));
}

/**
 * Calls the OpenAI Moderation API.
 * Returns { flagged: boolean }.
 * Fails closed (returns flagged: true) if moderation is unavailable, so content
 * remains pending until a moderator can review it.
 */
export async function checkOpenAIModeration(text) {
  // OPEN_AI_KEY is accepted too, since that is how the key was first named.
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY;
  if (!apiKey) {
    console.error("Moderation is unavailable: OPENAI_API_KEY is not configured");
    return { flagged: true };
  }

  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ input: text }),
    });

    if (!res.ok) {
      console.error(`Moderation request failed with status ${res.status}`);
      return { flagged: true };
    }

    const data = await res.json();
    return { flagged: data.results?.[0]?.flagged ?? true };
  } catch (error) {
    console.error("Moderation request failed:", error);
    return { flagged: true };
  }
}
