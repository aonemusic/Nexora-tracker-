# NEXORA SAVINGS

A private, password-gated Capacitor Android savings tracker for personal use.

## Personal mode

- Unlock password: `risham0043`
- No email/password Firebase login is shown; the app uses a password-only unlock screen.
- After unlock, it creates a Firebase Anonymous Auth session silently so Realtime Database rules can securely isolate this installation.
- Savings data is stored primarily in Firebase Realtime Database at `savings/{anonymousUid}` and mirrored locally for offline continuity.
- Add money, withdrawals, goal progress, transaction history, deletion reversal, and lock/logout are all implemented.
- Data is not shared across devices and is lost if app storage is cleared or the app is uninstalled.

**Security note:** because this is a password-only personal app, the password is embedded in the client APK. This is a convenience lock, not high-security encryption. Anyone who can inspect/decompile the APK may recover it. Firebase Database rules still prevent one anonymous installation from reading another installation’s data.

## Firebase Console setup

1. In Firebase Console → Authentication → Sign-in method, enable **Anonymous**. No email/password sign-in is required for this personal mode.
2. Create/enable Realtime Database for the supplied Firebase project.
3. Publish the rules from `database.rules.json`.

## Run locally

```bash
npm install
npm run dev
```

For Android project generation/sync:

```bash
npm run cap:sync
```

The complete Android project is generated in `android/`. Open it with Android Studio or build with `./gradlew assembleDebug` from that directory.

## GitHub Actions APK

1. Push this repository to GitHub with the default branch named `main`.
2. The workflow `.github/workflows/build-apk.yml` runs on pushes to `main` and via **Actions → Build NEXORA SAVINGS APK → Run workflow**.
3. Open the completed workflow run.
4. Under **Artifacts**, download **NEXORA-SAVINGS-APK**.
5. Inside the downloaded archive, install `app-debug.apk` on an Android phone with installation from that source enabled.

APK output path: `android/app/build/outputs/apk/debug/app-debug.apk`.

## Original Firebase files

The supplied Firebase configuration and `database.rules.json` are retained as project reference files, and personal mode now uses Firebase Realtime Database with anonymous per-installation access; email/password login remains disabled in the UI. If multi-device sync or account-based access is needed later, restore Firebase Authentication and Realtime Database behind proper rules instead of using the embedded password mode.
