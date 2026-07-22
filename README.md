# GoStock

GoStock is a cross-platform mobile application built with **React Native** and **Expo** that helps businesses manage inventory, monitor sales, and generate reports in real time. It integrates with **Firebase** for secure authentication and cloud-based data storage.

---

# Features

* **Dashboard** – View key inventory and sales statistics at a glance.
* **Inventory Management** – Add, update, delete, and organize products.
* **Sales Management** – Record and track sales transactions.
* **Reports & Analytics** – Generate reports to monitor business performance.
* **Multi-language Support** – Switch between supported languages.
* **Dark Mode** – Toggle between light and dark themes.
* **Notifications** – Receive important alerts and reminders.
* **Calendar Integration** – Filter and manage records by date.
* **Firebase Integration** – Secure authentication, Firestore database, and cloud storage.

---

# Tech Stack

| Technology                  | Description                          |
| --------------------------- | ------------------------------------ |
| **React Native**            | Cross-platform mobile development    |
| **Expo**                    | Development and deployment framework |
| **Context API**             | Global state management              |
| **Firebase Authentication** | User authentication                  |
| **Cloud Firestore**         | NoSQL cloud database                 |
| **Firebase Storage**        | File and image storage               |
| **React Navigation**        | Screen navigation                    |
| **Custom i18n**             | Multi-language support               |

---

# Project Structure

```text
src/
├── components/          # Reusable UI components
│   ├── CalendarPicker.js
│   ├── ProductCard.js
│   ├── SaleCard.js
│   └── StatCard.js
│
├── screens/             # Application screens
│   ├── DashboardScreen.js
│   ├── InventoryScreen.js
│   ├── SalesScreen.js
│   ├── ReportsScreen.js
│   └── SettingsScreen.js
│
├── navigation/          # Navigation configuration
├── context/             # App, Theme, and Language providers
├── i18n/                # Localization files
├── constants/           # Colors, keys, and constants
└── utils/               # Firebase, formatting, and helper functions
```

---

# Getting Started

## Prerequisites

Before running the project, make sure you have:

* Node.js **v14+**
* npm or Yarn
* Expo CLI
* Android Studio (Android) or Xcode (iOS)

Install Expo CLI:

```bash
npm install -g expo-cli
```

---

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd GoStock
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Firebase

1. Create a Firebase project.
2. Enable Authentication, Firestore, and Storage.
3. Copy:

```text
credentials.json.example
```

to

```text
credentials.json
```

4. Add your Firebase configuration.

---

### 4. Start the development server

```bash
npm start
```

---

### 5. Run the application

* Press **a** → Android Emulator
* Press **i** → iOS Simulator
* Scan the QR code using the **Expo Go** app on a physical device

---

# Firebase Setup

1. Create a Firebase project.
2. Enable:

   * Authentication
   * Cloud Firestore
   * Firebase Storage
3. Download or copy your Firebase configuration.
4. Save it inside:

```text
credentials.json
```

---

# Building for Production

## Configure EAS

Create or update your `eas.json` file.

### Android

```bash
eas build --platform android
```

### iOS

```bash
eas build --platform ios --auto-submit
```

---

# Application Usage

### Inventory

* Add new products
* Update existing products
* Manage stock levels

### Sales

* Create sales records
* Track completed transactions
* View sales history

### Reports

* Analyze inventory performance
* Review sales statistics
* Generate business insights

### Settings

* Change application language
* Switch between light and dark themes

---

# Available Scripts

```bash
npm start        # Start Expo development server
npm run build    # Build the application with EAS
npm run eject    # Eject from Expo (not recommended)
```

---

# Contributing

Contributions are welcome.

If you find a bug or have an idea for improvement:

1. Fork the repository.
2. Create a new feature branch.
3. Commit your changes.
4. Open a Pull Request.

---

# License

This project is licensed under the terms described in the **LICENSE** file.

---

# Support

For more information, refer to the official documentation:

* Expo Documentation
* React Native Documentation
* Firebase Documentation
