// List of Instagram accounts to follow and display in the feed
// Format: { username: string, displayName: string, userId?: string, profileImage?: string }
//
// To get userId for an Instagram Business Account:
// 1. Go to https://developers.facebook.com/tools/explorer/
// 2. Select your app and get an access token
// 3. Query: GET /ig_hashtag_search?q={username}
// 4. Or use: GET /{page-id}?fields=instagram_business_account
// 5. The userId is the Instagram Business Account ID
//
export const INSTAGRAM_ACCOUNTS = [
  {
    username: "ilkeeren27",
    displayName: "Developer",
    userId: "17841421275358087",
  },
  {
    username: "whitworthuniversity",
    displayName: "The University",
    // userId: "123456789", // Add Instagram Business Account ID here
  },
  {
    username: "whitworthaswu",
    displayName: "ASWU",
    // userId: "123456790", // Add Instagram Business Account ID here
  },
  {
    username: "whitworthpirates",
    displayName: "Pirates Athletics",
    // userId: "123456791", // Add Instagram Business Account ID here
  },
  // Add more Instagram accounts here
];
