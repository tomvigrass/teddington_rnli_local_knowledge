# App Store Release Plan

This plan focuses on iOS App Store approval for the current Expo app.

## Repository changes to make
- Add `eas.json` with a `production` profile for App Store builds.
- Run `eas init` so `app.json` gets `expo.extra.eas.projectId`.
- Update `app.json` for release metadata:
  - Bump `expo.version` for the new release.
  - Add `ios.buildNumber` (required for App Store submissions).
  - Add or increment `android.versionCode` (optional but good practice).
- Verify app icons and splash assets meet store specs:
  - `assets/icon.png` should be 1024x1024, no transparency.
  - `assets/splash-icon.png` should match desired branding.
- Add `PRIVACY_POLICY.md` (and hosting link plan).
- Add `CHANGELOG.md` with release notes for the version being submitted.
- Optional but recommended: add a `store_assets/ios/` folder for screenshots and promo art.

## Actions you need to take for App Store approval
- Enroll in the Apple Developer Program (if not already).
- Create an App Store Connect app record:
  - App name, bundle ID (`com.teddington.localknowledge`), SKU.
- Prepare required metadata:
  - App description, keywords, support URL, marketing URL (if any).
  - Privacy policy URL (host the policy file somewhere public).
  - Age rating and content rights (ensure you have rights to RNLI images and data).
- Prepare screenshots (at least 6.5" and 5.5" iPhone sizes).
- Complete App Privacy details in App Store Connect:
  - This app appears to store data locally only; confirm no data collection.
- Set up certificates and provisioning:
  - Use `eas credentials` if building with EAS.
- Build the release binary:
  - `eas build --profile production --platform ios`
- Upload and submit:
  - Upload via EAS or Transporter.
  - Choose the build in App Store Connect and submit for review.
- Respond to review:
  - Provide demo info if requested.
  - Address any metadata or guideline feedback.

## Suggested local release checklist
- Run tests: `npm test`
- Smoke test on iOS simulator/device: `npx expo start --ios`
- Verify all questions, images, and map screens load correctly.
