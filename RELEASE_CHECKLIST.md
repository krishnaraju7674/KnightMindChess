# KnightMind Chess Release Checklist

## Current Release Target

Android first release for Google Play Store.

## Local Checks

Run before every build:

```powershell
npm.cmd run lint
npx.cmd tsc --noEmit
```

## Preview APK For Phone Testing

```powershell
cd "C:\Users\DELL\OneDrive\Documents\KnightMindChess"
npx.cmd eas-cli build --platform android --profile preview
```

## Production AAB For Play Store

```powershell
cd "C:\Users\DELL\OneDrive\Documents\KnightMindChess"
npx.cmd eas-cli build --platform android --profile production
```

## First Play Store Upload

Google requires the first upload to be done manually in Google Play Console. Upload the generated `.aab` file to an internal testing release first.

## Later EAS Submit

After the first manual upload and Google service account setup:

```powershell
npx.cmd eas-cli submit --platform android --profile production
```

## Store Listing Draft

App name: KnightMind Chess

Short description:
Learn chess with AI games, puzzles, local rating, and beginner-friendly training tools.

Full description:
KnightMind Chess is an independent chess training app for players who want to improve step by step. Practice timed games against AI, solve tactical puzzles, track your local rating, view an offline leaderboard preview, manage a profile, and learn with beginner-friendly controls.

Current features:
- Play vs AI
- Local chess mode
- Timers
- Legal moves
- Pawn promotion
- Castling and en passant through chess rules
- Premove support vs AI
- Coach hints
- Puzzles
- Local rating and profile stats
- Offline social preview with friends and invitations
- Offline leaderboard preview
- Theme switcher

Disclaimer:
KnightMind Chess is an independent app and is not affiliated with, endorsed by, or sponsored by any other chess platform, company, or federation.

## Play Console Requirements To Prepare

- Google Play Developer account
- App icon made for KnightMind Chess
- Feature graphic made for KnightMind Chess
- Phone screenshots showing only KnightMind Chess
- Privacy policy URL
- App category: Games / Board
- Content rating questionnaire
- Data safety form
- First internal testing release

## Data Safety For Current Offline Version

Current version stores profile, rating, puzzle, theme, and offline social preview data locally on the device. It does not upload or share this data.

Suggested current answers:
- Data collected: No, because current stored data remains on device only.
- Data shared: No.
- Ads: No.
- Analytics: No.
- Location/contacts/camera/microphone/files: No.

Update this before adding real login, cloud leaderboard, matchmaking, chat, analytics, ads, or payments.

## IP And Impersonation Checks

- Do not mention competitor app names in store listing unless legally necessary and non-misleading.
- Do not use third-party logos or screenshots.
- Do not use copied chess piece artwork or copied puzzle collections.
- Keep the independent-app disclaimer in the listing or app support docs.
- Keep license/permission proof for any asset you did not create yourself.
