// ══════════════════════════════════════════════════════════
//  CLASSGRID ANDROID — Root Build Configuration
// ══════════════════════════════════════════════════════════
//
//  📌 INSTRUCTIONS FOR NIKHIL:
//
//  1. Open Android Studio
//  2. Click "Open Existing Project"
//  3. Navigate to: classgrid_platform/android/
//  4. Android Studio will auto-sync Gradle
//  5. Drop your google-services.json into android/app/
//  6. Click the green ▶ "Run" button
//  7. Your Classgrid app launches on your phone!
//
//  To build the Play Store APK:
//  Build → Generate Signed Bundle/APK → Follow the wizard
//
// ══════════════════════════════════════════════════════════

plugins {
    id("com.android.application") version "8.2.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.22" apply false
    id("com.google.gms.google-services") version "4.4.4" apply false
}
