# NEXORA SAVINGS

A multi-user Capacitor Android savings tracker with native Google Sign-In and Firebase Realtime Database.

## Authentication and data isolation

- Users sign in with **Google** using the native Capacitor Firebase Authentication plugin.
- The native flow returns to the Android app after Google authentication; it does not rely on a WebView popup.
- Every account gets its own data at `savings/{uid}`.
- Realtime Database listeners update the signed-in user’s balance, goal, and transactions instantly.

## Firebase Console setup

1. Open Firebase Console for project `savings-traker-database`.
2. Authentication → Sign-in method → enable **Google**, **Email/Password**, and **Email link (passwordless sign-in)**.
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


## Google Sign-In checklist

For Android Google login, the APK certificate must match a SHA-1 registered on the Firebase Android app for package `com.nexora.savings`. After changing fingerprints, download a fresh `google-services.json`, replace the native file, uninstall the old APK, and install the newly built APK. For a Play Store release, also add the Play App Signing SHA-1 and SHA-256.

## Passwordless email-link setup

Enable **Email link (passwordless sign-in)** in Firebase Authentication. Add the web/hosting domain used by the app under Authentication → Settings → Authorized domains. The user enters an email, taps **Email me a sign-in link**, and completes the one-time link from the email.
