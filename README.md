# GoStock

A mobile inventory and sales management application built with React Native and Expo.

## Features

- **Dashboard**: Overview of inventory and sales metrics
- **Inventory Management**: Add, edit, and manage products
- **Sales Tracking**: Record and monitor sales transactions
- **Reporting**: Generate sales reports and analytics
- **Multi-language Support**: English and additional language support
- **Dark Mode**: Theme switching capability
- **Alerts**: Get notifications for important events
- **Calendar Integration**: Date-based tracking and filtering
- **Firebase Integration**: Cloud-based data storage and authentication

## Tech Stack

- **Frontend**: React Native with Expo
- **State Management**: Context API
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Internationalization**: Custom i18n implementation
- **Navigation**: React Navigation

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── CalendarPicker.js
│   ├── ProductCard.js
│   ├── SaleCard.js
│   └── StatCard.js
├── screens/            # App screens/pages
│   ├── DashboardScreen.js
│   ├── InventoryScreen.js
│   ├── SalesScreen.js
│   ├── ReportsScreen.js
│   └── SettingsScreen.js
├── navigation/         # Navigation configuration
├── context/            # Context providers (App, Language, Theme)
├── i18n/              # Internationalization
├── constants/         # Colors, storage keys, etc.
└── utils/             # Helper functions (Firebase, formatters, dates)
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Android Studio (for Android) or Xcode (for iOS)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd GoStock
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase credentials:
- Copy `credentials.json.example` to `credentials.json`
- Add your Firebase configuration

4. Start the Expo development server:
```bash
npm start
```

5. Run on your device or emulator:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo app on physical device

## Configuration

### Firebase Setup

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Configure authentication and Firestore database
3. Add your credentials to `credentials.json`

### EAS Build

For production builds, configure `eas.json`:
```bash
eas build --platform ios
eas build --platform android
```

## Building for Production

### iOS
```bash
eas build --platform ios --auto-submit
```

### Android
```bash
eas build --platform android
```

## Usage

- **Add Products**: Navigate to Inventory → Add new product
- **Record Sales**: Go to Sales → Create new sale entry
- **View Reports**: Check Reports tab for analytics
- **Manage Settings**: Adjust language and theme preferences

## Scripts

```bash
npm start        # Start Expo development server
npm run build    # Build for production (requires EAS CLI)
npm run eject    # Eject from Expo (not recommended)
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

See [LICENSE](LICENSE) file for details.

## Support

For issues and questions, please check:
- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
