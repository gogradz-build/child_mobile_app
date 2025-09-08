# ABC Dooble - Build Instructions

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Expo CLI** (`npm install -g @expo/cli`)
3. **Android Studio** (for Android builds)
4. **Xcode** (for iOS builds, macOS only)

## Model Conversion

Before building the app, you need to convert the TensorFlow Lite models to TensorFlow.js format:

### Option 1: Using Python Script (Recommended)

1. Install Python 3.7 or higher
2. Run the conversion script:
   ```bash
   python convert_models.py
   ```

### Option 2: Manual Conversion

1. Install TensorFlow.js converter:
   ```bash
   npm install -g @tensorflow/tfjs-converter
   ```

2. Convert the models:
   ```bash
   # Convert FP16 model
   tensorflowjs_converter --input_format=tf_lite --output_format=tfjs_graph_model --quantize_float16 ./assets/models/letters_fp16.tflite ./assets/models/letters_fp16/
   
   # Convert FP32 model
   tensorflowjs_converter --input_format=tf_lite --output_format=tfjs_graph_model ./assets/models/letters_fp32.tflite ./assets/models/letters_fp32/
   ```

## Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm start
   ```

3. **Run on device/simulator:**
   ```bash
   # Android
   npm run android
   
   # iOS
   npm run ios
   
   # Web
   npm run web
   ```

## Building for Production

### Android APK

1. **Configure app.json:**
   ```json
   {
     "expo": {
       "android": {
         "package": "com.yourcompany.abcdooble",
         "versionCode": 1
       }
     }
   }
   ```

2. **Build APK:**
   ```bash
   # Development build
   npx expo build:android
   
   # Or using EAS Build (recommended)
   npx eas build --platform android
   ```

3. **Download and install APK:**
   - The build will provide a download link
   - Download the APK file
   - Install on Android device

### iOS App

1. **Configure app.json:**
   ```json
   {
     "expo": {
       "ios": {
         "bundleIdentifier": "com.yourcompany.abcdooble",
         "buildNumber": "1"
       }
     }
   }
   ```

2. **Build iOS app:**
   ```bash
   # Development build
   npx expo build:ios
   
   # Or using EAS Build
   npx eas build --platform ios
   ```

## EAS Build (Recommended)

1. **Install EAS CLI:**
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure EAS:**
   ```bash
   eas build:configure
   ```

4. **Build for Android:**
   ```bash
   eas build --platform android
   ```

5. **Build for iOS:**
   ```bash
   eas build --platform ios
   ```

## Troubleshooting

### Model Loading Issues

- Ensure models are converted to TensorFlow.js format
- Check that model files are in the correct directory
- Verify model paths in the code

### Build Issues

- Clear Expo cache: `npx expo start --clear`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Expo CLI version: `npx expo --version`

### Audio Issues

- Ensure audio files are in the correct format (MP3/WAV)
- Check file paths in the code
- Test audio on device, not just simulator

## Project Structure

```
abcdooble/
├── app/                    # App screens
│   ├── home/              # Home screen
│   ├── mission/           # Mission/drawing screen
│   └── _layout.tsx        # Root layout
├── assets/                # Static assets
│   ├── models/            # ML models
│   ├── sounds/            # Audio files
│   └── images/            # Images
├── components/            # Reusable components
├── context/               # React context
└── hooks/                 # Custom hooks
```

## Features

- ✅ Letter recognition with TensorFlow.js
- ✅ Drawing canvas with SVG
- ✅ Audio feedback
- ✅ Mission system
- ✅ Timer functionality
- ✅ Cross-platform (iOS/Android/Web)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Expo documentation
3. Check TensorFlow.js documentation for model issues
