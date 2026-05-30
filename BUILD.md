# Expo EAS Build Guide

This document explains a general way to configure Expo and EAS for building mobile apps with:

- Android APK builds
- iOS Ad Hoc builds
- locally managed signing credentials
- remote EAS cloud builds

It is written as a reusable guide for junior developers.

The examples and flow follow the configuration pattern used in this repository, but the document is intentionally written as a general guide rather than a project-only note.

## Goal

Use Expo and EAS so that:

- builds run on Expo servers
- signing credentials are managed by the team, not by Expo
- Android uses a local keystore
- iOS uses a local `.p12` certificate and `.mobileprovision` profile
- builds are guarded against broken lockfiles
- the local Node version matches the EAS build environment

## High-Level Build Flow

The recommended flow is:

1. Configure Expo app identifiers in `app.json`
2. Configure EAS build profiles in `eas.json`
3. Store signing files locally
4. Reference those files in `credentials.json`
5. Add build scripts in `package.json`
6. Add a lockfile guard before build
7. Pin Node version locally and on EAS
8. Run the build through EAS

## Build Strategy

This guide assumes the following strategy:

- build on EAS remote builders
- use `credentialsSource: "local"`
- keep credentials out of git
- use `npm ci` compatibility as a prebuild check

That means:

- Expo builds the binaries
- your team owns the signing files
- EAS reads `credentials.json` during build
- the build should fail early if dependency state is invalid

## Recommended Folder Structure

Juniors should know where the important build files live.

A typical structure for this setup looks like this:

```text
project-root/
├── app.json
├── eas.json
├── package.json
├── package-lock.json
├── credentials.json
├── credentials.json.example
├── .nvmrc
├── .gitignore
├── .eas/
│   └── workflows/
│       └── internal-builds.yml
├── credentials/
│   ├── android/
│   │   └── my-upload-key.keystore
│   └── ios/
│       ├── dist-cert.p12
│       └── profile.mobileprovision
├── src/
│   ├── app/
│   ├── components/
│   ├── store/
│   ├── theme/
│   └── ...
└── BUILD.md
```

### What Each Important File Does

#### Root Level

- `app.json`
  - Expo app config
  - versioning
  - Android package name
  - iOS bundle identifier
- `eas.json`
  - EAS build profiles
  - local credential mode
  - pinned Node version
- `package.json`
  - build scripts
  - lockfile guard script
- `package-lock.json`
  - exact npm dependency tree
  - must stay in sync with `package.json`
- `.nvmrc`
  - local Node version to use
- `.gitignore`
  - prevents secrets and generated files from being committed
- `BUILD.md`
  - documentation for the build setup

#### Credentials Files

- `credentials.json`
  - real local credential config used by EAS
  - should not be committed
- `credentials.json.example`
  - safe template for juniors to copy

#### Credentials Folder

- `credentials/android/my-upload-key.keystore`
  - Android signing keystore
- `credentials/ios/dist-cert.p12`
  - iOS distribution certificate export
- `credentials/ios/profile.mobileprovision`
  - iOS Ad Hoc provisioning profile

#### EAS Workflow Folder

- `.eas/workflows/internal-builds.yml`
  - optional EAS workflow file
  - useful if the team wants reusable build jobs

#### App Source Folder

- `src/app/`
  - Expo Router screens and routes
- `src/components/`
  - UI components
- `src/store/`
  - state management
- `src/theme/`
  - design system

Juniors do not usually need to edit source code to fix build signing issues.

For build problems, the first places to check are usually:

1. `app.json`
2. `eas.json`
3. `package.json`
4. `package-lock.json`
5. `credentials.json`
6. files inside `credentials/`

## Main Configuration Files

### `app.json`

This controls Expo app metadata and native identifiers.

Typical things configured here:

- app version
- iOS bundle identifier
- Android package name
- Android version code
- Expo Updates settings
- EAS project ID

Example:

```json
{
  "expo": {
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.company.app"
    },
    "android": {
      "package": "com.company.app",
      "versionCode": 1
    }
  }
}
```

Important rules:

- iOS bundle identifier and Android package name must match the credentials you use
- Android `versionCode` must increase for each Android release build
- app version is usually something like `x.y.z`

### `eas.json`

This controls EAS build profiles.

Typical profiles:

- `apk`
  - Android APK for direct install/testing
- `adhoc`
  - iOS Ad Hoc build for internal device distribution
- `production`
  - production-oriented profile

When managing credentials yourself, profiles should set:

- `credentialsSource: "local"`

Example:

```json
{
  "build": {
    "apk": {
      "node": "20.19.4",
      "android": {
        "buildType": "apk",
        "credentialsSource": "local"
      }
    },
    "adhoc": {
      "node": "20.19.4",
      "distribution": "internal",
      "ios": {
        "credentialsSource": "local"
      }
    }
  }
}
```

### `package.json`

This is where build commands are usually defined.

Recommended pattern:

- add a lockfile guard
- call `eas build`
- optionally add `--clear-cache`

Example:

```json
{
  "scripts": {
    "guard:lockfile": "node -e \"const v=process.versions.node.split('.').map(Number); if(v[0]!==20){console.error('Expected Node 20.x. Run: nvm use'); process.exit(1)}\" && npm ci --include=dev --dry-run",
    "build:android:apk": "npm run guard:lockfile && npx eas-cli build --platform android --profile apk --clear-cache",
    "build:ios:adhoc": "npm run guard:lockfile && npx eas-cli build --platform ios --profile adhoc --clear-cache"
  }
}
```

### `credentials.json`

This file is required when using local credentials.

EAS uses it to find your signing files.

This file must not be committed to git.

Example:

```json
{
  "android": {
    "keystore": {
      "keystorePath": "credentials/android/release.keystore",
      "keystorePassword": "ANDROID_KEYSTORE_PASSWORD",
      "keyAlias": "ANDROID_KEY_ALIAS",
      "keyPassword": "ANDROID_KEY_PASSWORD"
    }
  },
  "ios": {
    "provisioningProfilePath": "credentials/ios/profile.mobileprovision",
    "distributionCertificate": {
      "path": "credentials/ios/dist-cert.p12",
      "password": "IOS_P12_PASSWORD"
    }
  }
}
```

### `.nvmrc`

Use this to pin the local Node version.

Example:

```text
20.19.4
```

This helps keep local `npm` behavior closer to the EAS build environment.

## Local Credentials Structure

A clean folder structure is:

```text
credentials/
  android/
    release.keystore
  ios/
    dist-cert.p12
    profile.mobileprovision
```

Recommended rules:

- never commit real signing files
- keep a `credentials.json.example`
- keep `credentials.json` ignored
- back up credentials in a secure location

## Android Configuration

### What Android Needs

For Android APK signing, you need:

- a keystore file
- keystore password
- key alias
- key password

These are referenced through `credentials.json`.

### How to Generate an Android Keystore

If you do not already have an Android keystore, you can generate one with `keytool`.

Example command:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

What this does:

- creates a keystore file
- creates a key alias inside that keystore
- uses RSA 2048
- makes the certificate valid for a long period

Typical result:

- `my-upload-key.keystore`

After generating it, move it to your local credentials folder if needed.

Example:

```text
credentials/android/my-upload-key.keystore
```

### How to Check the Android Keystore

You can inspect the keystore and confirm the alias/password work using `keytool`.

Example:

```bash
keytool -list -v -keystore my-upload-key.keystore -alias my-key-alias -storepass android -keypass android
```

This helps confirm:

- the keystore exists
- the alias exists
- the passwords are correct
- the key can be read successfully

### How Android Keystore Values Map to `credentials.json`

If your keystore file is `my-upload-key.keystore` and your alias is `my-key-alias`, your Android credentials section will look like:

```json
{
  "android": {
    "keystore": {
      "keystorePath": "credentials/android/my-upload-key.keystore",
      "keystorePassword": "YOUR_STORE_PASSWORD",
      "keyAlias": "my-key-alias",
      "keyPassword": "YOUR_KEY_PASSWORD"
    }
  }
}
```

Important:

- `keystorePassword` is the password for the keystore file
- `keyAlias` is the name of the key inside the keystore
- `keyPassword` is the password for that key

In some setups:

- `keystorePassword` and `keyPassword` are the same

### Common Android Keystore Mistakes

#### Wrong Alias

If `credentials.json` uses the wrong alias, EAS cannot sign the APK.

#### Wrong Password

If either password is wrong, signing fails.

#### Keystore Path Is Wrong

If the file path in `credentials.json` does not point to the real keystore file, EAS cannot find it.

#### Keystore Not Backed Up

If the keystore is lost, future Android updates become difficult because the app must usually continue using the same signing key.

### Android Build Command

Typical command:

```bash
npm run build:android:apk
```

What happens:

1. local guard checks Node version and lockfile consistency
2. EAS reads the `apk` profile from `eas.json`
3. EAS sees `credentialsSource: "local"`
4. EAS reads Android keystore info from `credentials.json`
5. EAS uploads the project snapshot
6. EAS builds the APK remotely
7. EAS returns a build page and APK download link

### Android Versioning

Android normally uses:

- app version like `1.0.0`
- build number as `versionCode`

Displayed together, this is often written as:

- `1.0.0(1)`

Where:

- `1.0.0` comes from `expo.version`
- `1` comes from `expo.android.versionCode`

## iOS Ad Hoc Configuration

### What iOS Ad Hoc Needs

For iOS Ad Hoc distribution, you need:

- a distribution certificate in `.p12`
- the password for that `.p12`
- a provisioning profile in `.mobileprovision`

The provisioning profile must:

- match the bundle identifier exactly
- include the tester device UDIDs

### iOS Build Command

Typical command:

```bash
npm run build:ios:adhoc
```

What happens:

1. local guard runs first
2. EAS reads the `adhoc` profile
3. EAS sees `credentialsSource: "local"`
4. EAS reads the `.p12` and `.mobileprovision` paths from `credentials.json`
5. EAS builds the `.ipa` remotely
6. EAS gives a build page and downloadable artifact

### iOS Rules

iOS Ad Hoc is stricter than Android APK builds.

You must make sure:

- the bundle identifier matches the provisioning profile
- the device is registered in the provisioning profile
- the `.p12` matches the same signing setup as the provisioning profile

### How to Get the `.p12` File

Apple does not usually hand you a `.p12` file directly.

What you normally get from Apple first is a certificate file such as `.cer`.

The `.p12` is created on a Mac by exporting the certificate identity from Keychain Access together with its private key.

General process:

1. Sign in to the Apple Developer portal.
2. Create or download an Apple distribution certificate.
3. Download the certificate file from Apple, usually as `.cer`.
4. Open the `.cer` file on a Mac so it is installed into Keychain Access.
5. Open **Keychain Access** and look under **My Certificates**.
6. Find the distribution certificate identity and confirm it has a private key nested under it.
7. Right-click the certificate identity and choose **Export**.
8. Export it as a `.p12` file.
9. Set and remember the `.p12` export password.

Important:

- if the private key is missing, you cannot export a usable `.p12`
- the `.p12` must contain both:
  - the certificate
  - the matching private key

Typical result:

- `dist-cert.p12`

### How to Get the `.mobileprovision` File

The `.mobileprovision` file is downloaded from the Apple Developer portal.

For this workflow, it should be an **Ad Hoc provisioning profile**.

General process:

1. Sign in to Apple Developer.
2. Open **Certificates, Identifiers & Profiles**.
3. Make sure you already have:
   - an App ID for the correct bundle identifier
   - a valid Apple distribution certificate
   - the test devices registered in the Apple Developer account
4. Create a new provisioning profile.
5. Choose **Ad Hoc** as the profile type.
6. Select the App ID that matches the app bundle identifier.
7. Select the distribution certificate that matches the `.p12` you exported.
8. Select the test devices that should be allowed to install the app.
9. Generate the provisioning profile.
10. Download the resulting `.mobileprovision` file.

Typical result:

- `profile.mobileprovision`

### Relationship Between `.p12` and `.mobileprovision`

These two files must belong to the same signing setup.

That means:

- the provisioning profile must reference the same distribution certificate identity
- the provisioning profile must match the same bundle identifier used by the app
- for Ad Hoc distribution, the provisioning profile must include the intended test devices

If they do not match, signing fails.

### Common Problems When Creating iOS Signing Files

#### The Certificate Has No Private Key

If Keychain Access shows the certificate without a private key, the `.p12` export will not work correctly.

#### The Profile Uses the Wrong Bundle Identifier

If the profile bundle identifier does not exactly match the app bundle identifier, signing fails.

#### The Profile Uses the Wrong Certificate

If the provisioning profile was created for a different distribution certificate than the one inside the `.p12`, signing fails.

#### Devices Are Missing

For Ad Hoc builds, the app can install only on devices included in the provisioning profile.

## Official References

Official Apple documentation:

- Create an Ad Hoc provisioning profile:
  https://developer.apple.com/help/account/provisioning-profiles/create-an-ad-hoc-provisioning-profile
- Apple certificate overview:
  https://developer.apple.com/support/certificates/

Helpful Expo documentation:

- Existing credentials:
  https://docs.expo.dev/app-signing/existing-credentials/
- Local credentials:
  https://docs.expo.dev/app-signing/local-credentials/

## Why the Lockfile Guard Matters

EAS remote builders commonly run:

```bash
npm ci
```

`npm ci` is strict.

It will fail if:

- `package.json` and `package-lock.json` are out of sync
- the lockfile was generated under a dependency state that no longer matches
- environment differences expose lockfile problems

That is why a prebuild guard is useful.

Recommended guard:

```bash
npm ci --include=dev --dry-run
```

This prevents a remote build from starting when the lockfile is already broken locally.

## Why Node Version Should Be Pinned

Local dependency resolution can behave differently across Node/npm versions.

A common failure pattern is:

1. local `npm ci` passes
2. EAS remote `npm ci` fails
3. the root cause is runtime/tooling mismatch

To reduce that risk:

- pin Node in `eas.json`
- pin Node locally with `.nvmrc`
- run `nvm use` before dependency or build commands

Recommended local workflow:

```bash
nvm use
npm ci --include=dev
```

## Recommended Build Workflow

### Normal Build

```bash
nvm use
npm ci --include=dev
npm run build:android:apk
```

or:

```bash
nvm use
npm ci --include=dev
npm run build:ios:adhoc
```

### After Dependency Changes

If dependencies changed, do a clean regeneration:

```bash
rm -rf node_modules package-lock.json
nvm use
npm install
npm ci --include=dev
```

Then build.

## Common Mistakes

### 1. Wrong App Identifier

If app identifiers do not match credentials:

- Android signing or update flow can break
- iOS provisioning can fail

Examples of where these identifiers matter:

- `expo.ios.bundleIdentifier`
- `expo.android.package`
- provisioning profiles
- Apple certificates/profiles

### 2. Missing `credentials.json`

If `credentialsSource` is `local` but `credentials.json` does not exist, EAS cannot sign the build.

### 3. Wrong Paths in `credentials.json`

If the file paths are wrong, EAS cannot find:

- the Android keystore
- the iOS `.p12`
- the iOS provisioning profile

### 4. Wrong Passwords

If the keystore or `.p12` password is wrong, signing fails.

### 5. Broken Lockfile

If `package-lock.json` does not match `package.json`, EAS may fail during `npm ci`.

### 6. Deleting `package-lock.json` and Building Immediately

If you remove `package-lock.json`, you must regenerate it before EAS build.

Correct:

```bash
rm -rf node_modules package-lock.json
npm install
```

Wrong:

```bash
rm -rf node_modules package-lock.json
npm run build:android:apk
```

### 7. Committing Credentials

Never commit:

- `credentials.json`
- `.keystore`
- `.jks`
- `.p12`
- `.mobileprovision`

## Suggested File Safety Rules

Add these to `.gitignore`:

```gitignore
credentials.json
credentials/
*.keystore
*.jks
*.p12
*.mobileprovision
```

If you need a tracked folder placeholder, use:

- `credentials/.gitkeep`

If you need a template, use:

- `credentials.json.example`

## Example Setup Pattern

This is a good reusable pattern for small teams:

- `app.json`
  - app identifiers
  - versions
- `eas.json`
  - `apk`
  - `adhoc`
  - `production`
  - `credentialsSource: "local"`
  - pinned Node version
- `.nvmrc`
  - same Node version as EAS
- `credentials.json.example`
  - sample structure only
- `credentials/`
  - real files stored locally
- `package.json`
  - build scripts with guard

## Quick Reference

### Android

```bash
nvm use
npm ci --include=dev
npm run build:android:apk
```

Needs:

- keystore
- passwords
- alias

### iOS Ad Hoc

```bash
nvm use
npm ci --include=dev
npm run build:ios:adhoc
```

Needs:

- `.p12`
- `.mobileprovision`
- correct bundle identifier
- registered devices in profile

## Final Advice for Juniors

Before building, always check these four things:

1. Are you on the correct Node version?
2. Does `npm ci --include=dev` pass?
3. Does `credentials.json` point to real files?
4. Do the app identifiers match the signing credentials?

If all four are correct, most EAS build problems become much easier to debug.
