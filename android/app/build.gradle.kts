plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.gms.google-services")  // Firebase
}

android {
    namespace = "com.classgrid.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.classgrid.app"
        minSdk = 24          // Android 7.0+ (covers 97% of devices)
        targetSdk = 34       // Android 14 (latest)
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    // ══════════════════════════════════════════════════════════
    //  3 ANDROID APPS FROM 1 CODEBASE (Build Flavors)
    // ══════════════════════════════════════════════════════════
    //
    //  Build → Generate Signed APK → Choose the flavor:
    //    "student"  → Classgrid (Student App)
    //    "faculty"  → Classgrid Faculty
    //    "admin"    → Classgrid Admin
    //
    //  Each app gets its own package name on the Play Store.
    //  Each app is LOCKED to its own login page.
    //  Students can NEVER see the Faculty login and vice versa.
    //
    // ══════════════════════════════════════════════════════════

    flavorDimensions += "role"

    productFlavors {
        // ── APP 1: Student App (com.classgrid.app) ──
        create("student") {
            dimension = "role"
            applicationId = "com.classgrid.app"
            resValue("string", "app_name", "Classgrid")
            buildConfigField("String", "BASE_URL", "\"https://app.classgrid.in/student/login\"")
            buildConfigField("String", "APP_ROLE", "\"student\"")
        }

        // ── APP 2: Faculty App (com.classgrid.faculty) ──
        create("faculty") {
            dimension = "role"
            applicationId = "com.classgrid.faculty"
            resValue("string", "app_name", "Classgrid Faculty")
            buildConfigField("String", "BASE_URL", "\"https://app.classgrid.in/faculty/login\"")
            buildConfigField("String", "APP_ROLE", "\"faculty\"")
        }

        // ── APP 3: Admin App (com.classgrid.admin) ──
        create("admin") {
            dimension = "role"
            applicationId = "com.classgrid.admin"
            resValue("string", "app_name", "Classgrid Admin")
            buildConfigField("String", "BASE_URL", "\"https://app.classgrid.in/admin/login\"")
            buildConfigField("String", "APP_ROLE", "\"admin\"")
        }
    }

    // ══════════════════════════════════════════════════════════
    //  BUILD TYPES
    // ══════════════════════════════════════════════════════════

    buildTypes {
        release {
            isMinifyEnabled = true       // Shrink APK size
            isShrinkResources = true     // Remove unused resources
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isMinifyEnabled = false
        }
    }

    buildFeatures {
        buildConfig = true   // Enables BuildConfig.BASE_URL and BuildConfig.APP_ROLE
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = "1.8"
    }
}

// ══════════════════════════════════════════════════════════
//  DEPENDENCIES
// ══════════════════════════════════════════════════════════

dependencies {
    // Core Android
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.activity:activity-ktx:1.8.2")

    // WebView enhancements
    implementation("androidx.webkit:webkit:1.10.0")

    // Biometric Authentication (Fingerprint / Face)
    implementation("androidx.biometric:biometric:1.1.0")

    // Google One Tap Native Sign-In (Instagram-style bottom sheet)
    implementation("androidx.credentials:credentials:1.3.0")
    implementation("androidx.credentials:credentials-play-services-auth:1.3.0")
    implementation("com.google.android.libraries.identity.googleid:googleid:1.1.1")

    // Kotlin Coroutines (for async Google Sign-In)
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // Firebase (Push Notifications)
    implementation(platform("com.google.firebase:firebase-bom:34.11.0"))
    implementation("com.google.firebase:firebase-messaging-ktx")
    implementation("com.google.firebase:firebase-analytics-ktx")

    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}
