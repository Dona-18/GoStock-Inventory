# GoStock — Inventory & Sales Management App

**GoStock** is a modern, cross-platform mobile application built with **React Native** and **Expo SDK 57**. Designed for small to medium businesses, GoStock streamlines inventory tracking, sales recording, low stock alerts, analytics reporting, and PDF invoice generation.

It features an **offline-first architecture** using local storage (`@react-native-async-storage/async-storage`) with optional cloud sync powered by **Firebase** (Authentication, Firestore, and Storage).

---

## 🚀 Key Features

* 📊 **Interactive Dashboard** — View real-time sales metrics, product counts, stock warnings, and recent transaction history.
* 📦 **Inventory Management** — Add, edit, and delete products with image attachments via Expo Image Picker, category filters, and search functionality.
* 💰 **Sales Transaction Tracking** — Easily record sales with item selection, stock auto-deduction, total calculations, and transaction logs.
* 📄 **PDF Invoice Generation & Sharing** — Instantly create, preview, print, and export customizable PDF invoices for sales transactions using `expo-print` and `expo-sharing`.
* ⚠️ **Stock Alerts System** — Dedicated alerts view to notify users when items fall below safe inventory threshold limits.
* 📈 **Reports & Analytics** — Analyze revenue trends, top-selling categories, and overall inventory valuation.
* 🌍 **Multi-Language Support (i18n)** — Dynamic language switching support (English, Spanish, etc.) via `LanguageContext`.
* 🌙 **Dark & Light Themes** — Seamless theme toggling with custom dynamic color palettes via `ThemeContext`.
* 📱 **Offline-First & Cloud Ready** — Operates 100% offline out-of-the-box using local storage, with seamless cloud synchronization when configured with Firebase.

---

## 🛠️ Tech Stack

| Component | Technology / Library |
| :--- | :--- |
| **Framework** | [React Native 0.86](https://reactnative.dev/) with [Expo SDK 57](https://docs.expo.dev/) |
| **Language & Runtime** | JavaScript (ES6+), Node.js v20.x |
| **Navigation** | [React Navigation v7](https://reactnavigation.org/) (Stack & Bottom Tabs) |
| **State Management** | React Context API (`AppContext`, `ThemeContext`, `LanguageContext`) |
| **Local Storage** | `@react-native-async-storage/async-storage` |
| **Cloud Backend** | [Firebase v12](https://firebase.google.com/) (Firestore, Auth, Storage) |
| **Invoice & PDF** | `expo-print` & `expo-sharing` |
| **Media & UI** | `expo-image-picker`, `expo-blur`, `@expo/vector-icons` |
| **Build & CI** | Expo Application Services (EAS Build) |

---

## 📁 Project Structure

```text
GoStock/
├── App.js                      # Application entry point & Root Navigator
├── index.js                    # Expo entry file
├── app.json                    # Expo configuration (App ID, versioning)
├── eas.json                    # EAS build profiles (APK, Ad-Hoc, production)
├── BUILD.md                    # Comprehensive guide for EAS production/local builds
├── credentials.json.example    # Template for local EAS signing credentials
├── package.json                # Project dependencies and build scripts
│
└── src/
    ├── components/             # Reusable UI components
    │   ├── CalendarPicker.js   # Custom date picker modal & filter
    │   ├── EmptyState.js       # Fallback UI for empty lists
    │   ├── FadeInView.js       # Animated transition container
    │   ├── InvoiceModal.js     # PDF invoice preview, print & share modal
    │   ├── ProductCard.js      # Product item display card
    │   ├── SaleCard.js         # Sales transaction item card
    │   └── StatCard.js         # Highlight metric card for dashboard
    │
    ├── screens/                # Application screens
    │   ├── AddEditProductScreen.js # Create/modify inventory items
    │   ├── AddSaleScreen.js        # New sales transaction entry
    │   ├── AlertsScreen.js         # Low stock notifications screen
    │   ├── DashboardScreen.js      # Overview metrics & quick actions
    │   ├── InventoryScreen.js      # Product catalog with search & filter
    │   ├── ReportsScreen.js        # Analytics & business insights
    │   ├── SalesScreen.js          # Transaction history & invoice export
    │   ├── SettingsScreen.js       # Preferences (Theme, Language, Firebase)
    │   └── SplashScreen.js         # Application splash screen
    │
    ├── navigation/             # React Navigation config
    │   ├── MainTabNavigator.js   # Bottom tab bar navigator
    │   ├── InventoryNavigator.js # Inventory stack navigator
    │   └── SalesNavigator.js     # Sales stack navigator
    │
    ├── context/                # Global React Context providers
    │   ├── AppContext.js         # Products, sales, stock alerts state
    │   ├── LanguageContext.js    # Active language & translation state
    │   └── ThemeContext.js       # Light/Dark theme state & tokens
    │
    ├── i18n/                   # Localization translations
    │   └── translations.js     # Multilingual dictionary
    │
    ├── constants/              # App constants & theme styling
    │   ├── colors.js           # Palette tokens for light/dark mode
    │   └── storageKeys.js      # AsyncStorage key definitions
    │
    └── utils/                  # Utility functions & helpers
        ├── dateHelpers.js      # Date range formatting & filtering
        ├── firebase.js         # Firebase initialization & fallback handling
        ├── formatters.js       # Currency & quantity display formatters
        └── invoiceHelpers.js   # HTML invoice generation & PDF layout
```

---

## ⚡ Getting Started

### Prerequisites

Before running the project, make sure you have installed:

* **Node.js**: `v20.x` (Matching the EAS build environment — see `.nvmrc`)
* **npm**: `v10+`
* **Expo Go** app on your physical device (iOS / Android) or an emulator (Android Studio / Xcode)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd GoStock-Inventory
   ```

2. **Set Node version & install dependencies:**
   ```bash
   nvm use
   npm install
   ```

3. **(Optional) Configure Firebase:**
   By default, GoStock runs in **100% offline mode** using local storage. To enable cloud sync:
   * Open [`src/utils/firebase.js`](file:///c:/Users/DoNa/Desktop/GoStock-Inventory/src/utils/firebase.js).
   * Replace the `firebaseConfig` object values with your Firebase project credentials.

---

## 💻 Available Scripts

Run these scripts from the project root directory:

| Script | Command | Description |
| :--- | :--- | :--- |
| `start` | `npm start` | Start the Expo development server (`npx expo start`) |
| `android` | `npm run android` | Launch application on Android emulator/device |
| `ios` | `npm run ios` | Launch application on iOS simulator |
| `web` | `npm run web` | Run application in browser |
| `guard:lockfile` | `npm run guard:lockfile` | Verify Node version and lockfile synchronization |
| `build:android:apk` | `npm run build:android:apk` | Build standalone Android APK via EAS Cloud |
| `build:ios:adhoc` | `npm run build:ios:adhoc` | Build standalone iOS Ad-Hoc IPA via EAS Cloud |

---

## 🏗️ Building for Distribution (EAS Build)

GoStock includes preconfigured EAS profiles for generating standalone Android APKs and iOS Ad-Hoc builds using local credentials.

1. Create your credentials file from the example template:
   ```bash
   cp credentials.json.example credentials.json
   ```
2. Place your signing keystore or certificate files in the `credentials/` directory and populate [`credentials.json`](file:///c:/Users/DoNa/Desktop/GoStock-Inventory/credentials.json.example).
3. Trigger a build:
   ```bash
   # Build Android APK
   npm run build:android:apk

   # Build iOS Ad-Hoc IPA
   npm run build:ios:adhoc
   ```

For detailed guidance on keystore generation, Apple certificate configuration, and troubleshooting EAS builds, refer to [BUILD.md](file:///c:/Users/DoNa/Desktop/GoStock-Inventory/BUILD.md).

---

## 📄 License

This project is licensed under the terms described in the [LICENSE](file:///c:/Users/DoNa/Desktop/GoStock-Inventory/LICENSE) file.
