# Android and Mobile Readiness

This folder stays native-only. Web platform code must stay in `client/`.

## Current boundary
- `client/`: React + Vite + TSX platform frontend
- `android/`: native Android prep artifacts
- `apps/mobile` (future): React Native app for student/faculty

## React Native kickoff checklist
1. Lock app id and signing strategy for production.
2. Decide environment strategy for API base URLs and Firebase keys.
3. Finalize auth token refresh flow shared with backend.
4. Define student/faculty screen scope for v1.
5. Add CI lanes for Android build and smoke tests.
