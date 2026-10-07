# NEXORA SAVINGS

A multi-user Capacitor Android savings tracker with native Google Sign-In and Firebase Realtime Database.

## Authentication and data isolation

- Users sign in with **Google** using the native Capacitor Firebase Authentication plugin.
- The native flow returns to the Android app after Google authentication; it does not rely on a WebView popup.
- Every account gets its own data at `savings/{uid}`.
- Realtime Database listeners update the signed-in user’s balance, goal, and transactions instantly.

## Firebase Console setup

1. Open Firebase Console for project `savings-traker-database`.
2. Authentication → Sign-in method → enable **Google** and **Email/Password**.
3. Add SHA-1 and SHA-256 fingerprints to the Android app for package `com.nexora.savings`.
4. Realtime Database → Rules: publish `database.rules.json`.
5. `android/app/google-services.json` is included and matches package `com.nexora.savings`.

## Realtime Database rules

```json
{
  "rules": {
    "savings": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}
```

A user can only read or write `savings/<their own Firebase UID>`.

## Build

```bash
npm install
npm run cap:sync
cd android
./gradlew assembleDebug
```

GitHub Actions uploads the APK as `NEXORA-SAVINGS-APK`.
