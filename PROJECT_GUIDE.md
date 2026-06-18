# KnightMind Chess - Beginner Project Guide

This guide explains the project from scratch in beginner-friendly words.

## 1. What We Built

KnightMind Chess is a free Android chess learning app built with Expo and React Native. It is inspired by modern chess apps, but it uses its own name, own design, own colors, and original beginner features.

Current features:

- Home dashboard with rating, puzzle score, friends, and invites
- Play vs AI mode
- Local two-player mode on one phone
- Start Game setup screen before the board opens
- 1m, 3m, 5m, and 10m timers
- Easy, Normal, Hard, and Pro AI levels
- Real chess rules through chess.js
- Castling, en passant, check, checkmate, draw, and promotion support
- Premove support while the AI is thinking
- Coach Hint button
- AI Guide text during the game
- Opening name tracker and opening move count
- Move history
- Captured pieces
- Undo, Pause/Resume, Resign, New Game
- Puzzle screen with multiple tactics
- Puzzle score and solved puzzle saving
- Offline leaderboard
- Offline profile, rating, wins/losses/draws
- Search players, friend requests, accept/reject invitations
- Online Multiplayer preview screen with player counts
- Theme switcher with Classic and Midnight themes
- In-app Legal screen for privacy, terms, and attribution

## 2. What Tech We Used

Main tools:

- Expo: helps build and run the Android app
- React Native: lets us build mobile screens with JavaScript/TypeScript
- Expo Router: gives file-based navigation like Home, Puzzles, Profile, Online
- chess.js: handles real chess rules and legal moves
- AsyncStorage: saves profile, rating, puzzles, friends, and theme on the phone
- TypeScript: helps catch mistakes before running the app
- EAS Build: builds the Android app bundle for Play Store

## 3. Important Folder Structure

- app/_layout.tsx: wraps the app with providers and navigation
- app/(tabs)/index.tsx: Home screen
- app/play-ai.tsx: Main chess game screen
- app/(tabs)/puzzles.tsx: Puzzle training screen
- app/(tabs)/leaderboard.tsx: Leaderboard screen
- app/(tabs)/online.tsx: Online multiplayer preview screen
- app/(tabs)/profile.tsx: Profile and social screen
- app/legal.tsx: Privacy, terms, and attribution screen
- constants/knight-theme.tsx: App theme colors and theme saving
- constants/player-profile.tsx: Profile, stats, friends, invitations, and puzzle progress storage
- components/ui/icon-symbol.tsx: Bottom tab icons
- app.json: App name, Android package, icon, splash, version
- eas.json: Android build and submit settings

## 4. How The Chess Game Works

The board uses chess.js. We do not manually guess if a move is legal. When the user taps a piece, chess.js gives possible moves. When the user taps a target square, chess.js confirms the move.

This is why special rules work:

- Castling is handled by chess.js
- En passant is handled by chess.js
- Pawn promotion is handled by our promotion modal plus chess.js
- Check/checkmate/draw are detected by chess.js

The AI is a local computer player. It scores possible moves and chooses based on difficulty:

- Easy: random legal move
- Normal: chooses from good moves with some randomness
- Hard: chooses from the top moves
- Pro: chooses the best scored move

## 5. What Is Offline And What Is Online

Currently offline:

- Profile
- Rating
- Leaderboard
- Friends
- Invitations
- Online counts

These are local preview features for the first version. They make the app look and feel complete while keeping the budget low.

Later online version needs:

- Firebase or Supabase login
- Cloud database for users and ratings
- Realtime match rooms
- Server-side move validation
- Real online presence count
- Friend invitations stored online

## 6. Copyright Safety

We can say the app is inspired by chess learning apps, but we should not copy Chess.com branding or assets.

Do not copy:

- Chess.com logo
- Chess.com name or green branding exactly
- Their icons, sounds, boards, or piece artwork
- Their puzzle database
- Their wording or page layout exactly

Our app should keep:

- KnightMind Chess name
- Our own themes
- Our own screens
- Our own beginner puzzles
- Our own app icon and splash screen

## 7. How To Explain This Project

Simple explanation:

"I built KnightMind Chess, a React Native Android chess learning app using Expo. The app supports play vs AI, local play, timers, chess rules, puzzles, ratings, social preview, leaderboard, themes, and a future online multiplayer preview. I used chess.js for legal chess moves and AsyncStorage for saving data on the phone. The project is prepared for Play Store build using EAS."

Slightly technical explanation:

"The app uses Expo Router for navigation, TypeScript for safer code, chess.js for move validation, and React state for board interaction. User stats and puzzle progress are stored locally with AsyncStorage. The current multiplayer and social system is offline demo data, and the next step is connecting Firebase or Supabase for real authentication and realtime matches."