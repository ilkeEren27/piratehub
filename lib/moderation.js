// Slurs, hate speech, and explicit content — listed here solely to block them from user submissions.
const BLOCKLIST = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "cunt",
  "nigger",
  "nigga",
  "faggot",
  "retard",
  "whore",
  "slut",
  "porn",
  "xxx",
  "onlyfans",
];

/**
 * Returns true if the text contains a blocked word.
 */
export function checkBlocklist(text) {
  const lower = text.toLowerCase();
  return BLOCKLIST.some((word) => lower.includes(word));
}

/**
 * Calls the OpenAI Moderation API.
 * Returns { flagged: boolean }.
 * Fails closed (returns flagged: true) if moderation is unavailable, so content
 * remains pending until a moderator can review it.
 */
export async function checkOpenAIModeration(text) {
  const apiKey = process.env.OPENAI_API_KEY;
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
