# NEXORA SAVINGS

A multi-user Capacitor Android savings tracker with Google Sign-In and Firebase Realtime Database.

## Authentication and data isolation

- Users sign in with **Google** through Firebase Authentication.
- Every account gets its own data at `savings/{uid}`.
- Realtime Database listeners update the signed-in user’s balance, goal, and transactions instantly.
- The app never uses the old personal password mode.

## Firebase Console setup

1. Open Firebase Console for project `savings-traker-database`.
2. Authentication → Sign-in method → enable **Google**.
3. Authentication → Settings → Authorized domains: add the domains used by your web preview/host if you use a browser build.
4. Realtime Database → Rules: publish `database.rules.json`.
5. The Android file `android/app/google-services.json` is already included for package `com.nexora.savings`.
6. For Android Google Sign-In on real devices, add the app SHA-1/SHA-256 fingerprints in Firebase Project Settings → Your apps → Android app. The debug SHA-1 can be obtained with `cd android && ./gradlew signingReport`.

## Realtime Database rules

The included rules enforce the essential boundary:

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

This means a user can only read or write `savings/<their own Firebase UID>`. Never replace this with public read/write rules.

## Run and build

```bash
npm install
npm run dev
npm run cap:sync
cd android
./gradlew assembleDebug
```

GitHub Actions builds `android/app/build/outputs/apk/debug/app-debug.apk` and uploads it as `NEXORA-SAVINGS-APK`.
