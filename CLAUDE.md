# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React Native (Expo SDK 54) app that helps RNLI crew members study for local knowledge exams at Teddington Lifeboat Station. Features quiz modes (quick test, custom test, endless) with 121 multiple-choice questions covering Thames geography, locks, warning systems, and hazards. Pass threshold is 90%.

## Commands

```bash
# Development
npx expo start                    # Start dev server
npx expo start --ios              # Start with iOS simulator
npx expo start --android          # Start with Android emulator

# Testing
npm test                          # Run all tests
npx jest __tests__/QuestionService.test.ts  # Run single test file
npm run test:coverage             # Run with coverage

# Scripts (use tsx, not ts-node)
npm run generate-image-map        # Regenerate src/services/ImageService.ts from assets/images/
npm run optimize-images           # Process raw images to WebP
```

## Architecture

### Stack
- **Expo SDK 54** with React Native 0.81, React 19, New Architecture enabled
- **Navigation:** React Navigation v7 native stack (`src/app/navigation/`)
- **State:** Zustand v5 stores (`src/stores/`)
- **Persistence:** AsyncStorage via zustand `persist` middleware (named `mmkv.ts` but wraps AsyncStorage)
- **Images:** expo-image with auto-generated image map (`src/services/ImageService.ts`)

### Source Layout
- `src/app/` - App entry point and navigation (RootNavigator, route types)
- `src/models/` - TypeScript types/enums (Question, TestSession, TestResults, UserStats)
- `src/services/` - Business logic (QuestionService, TestGeneratorService, ImageService)
- `src/stores/` - Zustand stores (useTestStore for session state, useStatsStore for persisted stats)
- `src/features/` - Screen-level feature modules:
  - `home/` - Home screen with mode cards
  - `setup/` - Custom test configuration and category filtering
  - `question/` - Question display, answer handling, hooks (useTestSession, useEndlessSession)
  - `results/` - Score display and pass/fail
  - `review/` - Review incorrect answers
- `src/core/` - Shared utilities: constants (colors, typography, spacing), storage adapter, shuffle utils
- `src/components/` - Shared components (SafeScreen, ConfirmationModal)
- `src/data/` - Static JSON (questions.json, categories.json)

### Navigation Flow
```
Home -> Quick Test (20 random questions)
Home -> CustomSetup -> CategoryFilter -> Question -> Results -> ReviewMistakes
Home -> Endless (CategoryFilter -> infinite loop of questions)
```

Route types are defined in `src/app/navigation/types.ts` with `RootStackParamList`.

### Data Flow
1. Questions loaded from `src/data/questions.json` (wrapped in `{ "questions": [...] }`)
2. `QuestionService` provides query functions (by category, by ID, etc.)
3. `TestGeneratorService` generates shuffled question sets for each mode
4. `useTestStore` manages active session state (current question index, answers, results)
5. `useStatsStore` persists cumulative stats to AsyncStorage via zustand middleware

### Image Pipeline
838 WebP images in `assets/images/` organized by category subdirectories (bridges, establishments, evacuation_points, islands, locks, poi, warnings, water_clubs). The `scripts/generateImageMap.ts` script auto-generates `src/services/ImageService.ts` containing `require()` calls for every image. Questions reference images via `imageRef` field matching keys in this map.

## Technical Gotchas

- **Storage naming:** `src/core/storage/mmkv.ts` is named for historical reasons but actually wraps `@react-native-async-storage/async-storage`, not MMKV
- **Jest config:** Uses `ts-jest` preset with `node` environment (NOT `jest-expo` which causes ESM/Flow parsing errors with Expo SDK 54). Image/expo-image imports are mocked via `moduleNameMapper` in package.json
- **Scripts:** Use `tsx` (not `ts-node`) for running TypeScript scripts due to ESM `__dirname` issues
- **Image refs:** Apostrophes in place names become `_s_` in filenames (e.g. "Raven's Ait" -> `raven_s_ait`). Always verify `imageRef` values against actual processed filenames
- **ImageService is auto-generated:** Do not edit `src/services/ImageService.ts` manually. Run `npm run generate-image-map` after adding/removing images
- **npm deps:** May need `--legacy-peer-deps` for `@testing-library/react-native` with React 19
- **Test files:** Tests live in `__tests__/` at project root (not colocated). Mock files in `__tests__/__mocks__/`
