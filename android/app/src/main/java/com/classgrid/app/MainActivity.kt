package com.classgrid.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Intent
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Message
import android.view.View
import android.view.WindowManager
import android.webkit.*
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.concurrent.Executor

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║                   CLASSGRID MAIN ACTIVITY                    ║
 * ║                                                              ║
 * ║  This is the ONLY Activity in the entire Android app.        ║
 * ║  It loads the React+Vite SPA inside a full-screen WebView.   ║
 * ║  The React app handles ALL routing, auth, and UI.            ║
 * ║                                                              ║
 * ║  Native Features Provided:                                   ║
 * ║  1. Biometric Authentication (Fingerprint/Face)              ║
 * ║  2. File Upload (Camera + Gallery picker)                    ║
 * ║  3. Push Notification Channel Setup                          ║
 * ║  4. JavaScript Bridge (React ↔ Kotlin communication)        ║
 * ║  5. Deep Linking (classgrid.in URLs open inside app)         ║
 * ║  6. Google One Tap Native Sign-In (No external browser!)    ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

class MainActivity : AppCompatActivity() {

    // ══════════════════════════════════════════════════════════
    //  CONFIGURATION — Auto-set by Build Flavors!
    // ══════════════════════════════════════════════════════════
    //
    //  BuildConfig.BASE_URL →
    //    Student flavor: "https://app.classgrid.in/student/login"
    //    Faculty flavor: "https://app.classgrid.in/faculty/login"
    //    Admin flavor:   "https://app.classgrid.in/admin/login"
    //
    //  BuildConfig.APP_ROLE →
    //    "student", "faculty", or "admin"
    //
    // ══════════════════════════════════════════════════════════
    companion object {
        const val NOTIFICATION_CHANNEL_ID = "classgrid_notifications"
        const val NOTIFICATION_CHANNEL_NAME = "Classgrid Alerts"

        // These URLs belong to OTHER roles. The app will BLOCK navigation to them.
        val BLOCKED_LOGIN_PATHS = mapOf(
            "student" to listOf("/faculty/login", "/admin/login"),
            "faculty" to listOf("/student/login", "/admin/login"),
            "admin"   to listOf("/student/login", "/faculty/login")
        )
    }

    private lateinit var webView: WebView
    private lateinit var progressBar: android.widget.ProgressBar
    private lateinit var offlineLayout: android.widget.LinearLayout
    private lateinit var googleSignInHelper: GoogleSignInHelper
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private var cachedFcmToken: String? = null

    // File picker launcher (for uploading assignments, PDFs, profile pics)
    private val filePickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val data = result.data
            val results = when {
                data?.clipData != null -> {
                    // Multiple files selected
                    Array(data.clipData!!.itemCount) { i ->
                        data.clipData!!.getItemAt(i).uri
                    }
                }
                data?.data != null -> arrayOf(data.data!!)
                else -> null
            }
            fileUploadCallback?.onReceiveValue(results)
        } else {
            fileUploadCallback?.onReceiveValue(null)
        }
        fileUploadCallback = null
    }

    // ══════════════════════════════════════════════════════════
    //  LIFECYCLE
    // ══════════════════════════════════════════════════════════

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Make app truly full-screen (edge-to-edge, like Instagram)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = android.graphics.Color.TRANSPARENT
        window.navigationBarColor = android.graphics.Color.TRANSPARENT

        // Keep the screen awake during live classes
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Initialize Google One Tap Sign-In
        googleSignInHelper = GoogleSignInHelper(this)

        // Create the notification channel (required for Android 8+)
        createNotificationChannel()

        // Request notification permission on Android 13+
        requestNotificationPermission()

        // Fetch FCM Token on Boot so React can read it
        com.google.firebase.messaging.FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                cachedFcmToken = task.result
                Log.d("ClassgridFCM", "Fetched Token: $cachedFcmToken")
            }
        }

        // ── Build the WebView ──
        webView = WebView(this).apply {
            // Enable all the features React needs
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true          // localStorage for JWT tokens
            settings.databaseEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false  // Autoplay for video lectures
            settings.allowFileAccess = true
            settings.allowContentAccess = true
            settings.useWideViewPort = true
            settings.loadWithOverviewMode = true
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            settings.setSupportMultipleWindows(false)
            settings.javaScriptCanOpenWindowsAutomatically = true

            // User Agent: Append app type so React knows which role this app is
            settings.userAgentString = "${settings.userAgentString} ClassgridApp/1.0 ClassgridRole/${BuildConfig.APP_ROLE}"

            // ── JavaScript Bridge ──
            // React can call: window.AndroidBridge.showBiometricPrompt()
            addJavascriptInterface(ClassgridBridge(), "AndroidBridge")

            // ── WebView Client (handles navigation) ──
            webViewClient = object : WebViewClient() {

                override fun shouldOverrideUrlLoading(
                    view: WebView?,
                    request: WebResourceRequest?
                ): Boolean {
                    val url = request?.url.toString()

                    // ══════════════════════════════════════════
                    //  ROLE LOCKING: Block cross-role navigation
                    // ══════════════════════════════════════════
                    //  If this is the Student app, NEVER allow
                    //  navigation to /faculty/login or /admin/login.
                    //  Redirect back to this app's own login page.
                    // ══════════════════════════════════════════
                    val blockedPaths = BLOCKED_LOGIN_PATHS[BuildConfig.APP_ROLE] ?: emptyList()
                    for (blocked in blockedPaths) {
                        if (url.contains(blocked)) {
                            // BLOCK! Force back to this app's own login
                            view?.loadUrl(BuildConfig.BASE_URL)
                            return true
                        }
                    }

                    // If it's a Classgrid URL, load inside WebView
                    if (url.contains("classgrid.in")) {
                        return false
                    }

                    // If it's Zoom, Google Meet, or Razorpay → open in external browser
                    if (url.contains("zoom.us") ||
                        url.contains("meet.google.com") ||
                        url.contains("razorpay.com")
                    ) {
                        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                        return true
                    }

                    return false
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    progressBar.visibility = View.GONE
                    // Inject CSS to hide any browser-specific scrollbars
                    view?.evaluateJavascript(
                        "document.body.style.overscrollBehavior='none';", null
                    )
                }

                override fun onReceivedError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    error: WebResourceError?
                ) {
                    super.onReceivedError(view, request, error)
                    if (request?.isForMainFrame == true) {
                        progressBar.visibility = View.GONE
                        webView.visibility = View.GONE
                        offlineLayout.visibility = View.VISIBLE
                    }
                }
            }

            // ── WebChrome Client (handles file uploads, alerts) ──
            webChromeClient = object : WebChromeClient() {

                // Handle <input type="file"> for assignment uploads
                override fun onShowFileChooser(
                    webView: WebView?,
                    callback: ValueCallback<Array<Uri>>?,
                    params: FileChooserParams?
                ): Boolean {
                    fileUploadCallback?.onReceiveValue(null)
                    fileUploadCallback = callback

                    val intent = params?.createIntent()
                    if (intent != null) {
                        filePickerLauncher.launch(intent)
                    }
                    return true
                }

                // Handle JavaScript alert() dialogs
                override fun onJsAlert(
                    view: WebView?,
                    url: String?,
                    message: String?,
                    result: JsResult?
                ): Boolean {
                    Toast.makeText(this@MainActivity, message, Toast.LENGTH_SHORT).show()
                    result?.confirm()
                    return true
                }
            }

            // (URL loading is now handled explicitly at the bottom of onCreate)

        }

        // ── Programmatic UI Setup (No XML needed) ──
        val rootView = android.widget.RelativeLayout(this)
        rootView.layoutParams = android.widget.RelativeLayout.LayoutParams(
            android.view.ViewGroup.LayoutParams.MATCH_PARENT,
            android.view.ViewGroup.LayoutParams.MATCH_PARENT
        )

        // Progress Bar (Loading indicator)
        progressBar = android.widget.ProgressBar(this).apply {
            layoutParams = android.widget.RelativeLayout.LayoutParams(
                android.view.ViewGroup.LayoutParams.WRAP_CONTENT,
                android.view.ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { addRule(android.widget.RelativeLayout.CENTER_IN_PARENT) }
        }

        // Offline Screen (Hidden by default)
        offlineLayout = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER
            layoutParams = android.widget.RelativeLayout.LayoutParams(
                android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                android.view.ViewGroup.LayoutParams.MATCH_PARENT
            )
            visibility = View.GONE
            setBackgroundColor(android.graphics.Color.WHITE)

            val errorText = android.widget.TextView(this@MainActivity).apply {
                text = "No Internet Connection\n\nPlease check your network and try again."
                textSize = 18f
                textAlignment = View.TEXT_ALIGNMENT_CENTER
                setTextColor(android.graphics.Color.BLACK)
                setPadding(40, 0, 40, 40)
            }
            val retryButton = android.widget.Button(this@MainActivity).apply {
                text = "Retry Connection"
                setOnClickListener {
                    if (isNetworkAvailable()) {
                        visibility = View.GONE
                        progressBar.visibility = View.VISIBLE
                        webView.visibility = View.VISIBLE
                        if (webView.url.isNullOrEmpty()) {
                            webView.loadUrl(BuildConfig.BASE_URL)
                        } else {
                            webView.reload()
                        }
                    } else {
                        Toast.makeText(this@MainActivity, "Still no connection...", Toast.LENGTH_SHORT).show()
                    }
                }
            }
            addView(errorText)
            addView(retryButton)
        }

        // Assemble Complete Layout
        rootView.addView(webView)
        rootView.addView(offlineLayout)
        rootView.addView(progressBar)

        setContentView(rootView)

        // ── Connect or Show Offline UI ──
        if (isNetworkAvailable()) {
            webView.loadUrl(BuildConfig.BASE_URL)
        } else {
            progressBar.visibility = View.GONE
            webView.visibility = View.GONE
            offlineLayout.visibility = View.VISIBLE
        }
    }

    // ══════════════════════════════════════════════════════════
    //  BACK BUTTON — Let React Router handle navigation
    // ══════════════════════════════════════════════════════════

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    // ══════════════════════════════════════════════════════════
    //  DEEP LINKING — Handle classgrid.in URLs
    // ══════════════════════════════════════════════════════════

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.data?.let { uri ->
            webView.loadUrl(uri.toString())
        }
    }

    // ══════════════════════════════════════════════════════════
    //  NOTIFICATION CHANNEL (Required for Android 8+)
    // ══════════════════════════════════════════════════════════

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                NOTIFICATION_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Assignment deadlines, class reminders, and announcements"
                enableVibration(true)
                setShowBadge(true)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this, Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                    1001
                )
            }
        }
    }

    // ══════════════════════════════════════════════════════════
    //  JAVASCRIPT BRIDGE — React ↔ Kotlin Communication
    // ══════════════════════════════════════════════════════════
    //
    //  From React, call these functions:
    //    window.AndroidBridge.showBiometricPrompt()
    //    window.AndroidBridge.signInWithGoogle()
    //    window.AndroidBridge.getAppRole()       ← "student" / "faculty" / "admin"
    //    window.AndroidBridge.getAppVersion()
    //    window.AndroidBridge.isNativeApp()
    //    window.AndroidBridge.vibrate()
    //    window.AndroidBridge.getFCMToken()      ← Returns the push notification token
    //
    // ══════════════════════════════════════════════════════════

    inner class ClassgridBridge {

        @JavascriptInterface
        fun getFCMToken(): String {
            return cachedFcmToken ?: ""
        }

        @JavascriptInterface
        fun isNativeApp(): Boolean {
            return true  // React can check: if (window.AndroidBridge?.isNativeApp())
        }

        @JavascriptInterface
        fun getAppRole(): String {
            return BuildConfig.APP_ROLE  // Returns "student", "faculty", or "admin"
        }

        @JavascriptInterface
        fun getAppVersion(): String {
            return "1.0.0"
        }

        @JavascriptInterface
        fun vibrate() {
            val vibrator = getSystemService(android.os.Vibrator::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(
                    android.os.VibrationEffect.createOneShot(50, android.os.VibrationEffect.DEFAULT_AMPLITUDE)
                )
            }
        }

        @JavascriptInterface
        fun showBiometricPrompt() {
            runOnUiThread {
                val executor: Executor = ContextCompat.getMainExecutor(this@MainActivity)

                val biometricPrompt = BiometricPrompt(
                    this@MainActivity,
                    executor,
                    object : BiometricPrompt.AuthenticationCallback() {
                        override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                            super.onAuthenticationSucceeded(result)
                            // Tell React that biometric login was successful
                            webView.evaluateJavascript(
                                "window.dispatchEvent(new CustomEvent('biometricSuccess'))",
                                null
                            )
                        }

                        override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                            super.onAuthenticationError(errorCode, errString)
                            webView.evaluateJavascript(
                                "window.dispatchEvent(new CustomEvent('biometricError', {detail: '$errString'}))",
                                null
                            )
                        }

                        override fun onAuthenticationFailed() {
                            super.onAuthenticationFailed()
                            Toast.makeText(
                                this@MainActivity,
                                "Fingerprint not recognized",
                                Toast.LENGTH_SHORT
                            ).show()
                        }
                    }
                )

                val promptInfo = BiometricPrompt.PromptInfo.Builder()
                    .setTitle("Classgrid Login")
                    .setSubtitle("Use your fingerprint to sign in")
                    .setNegativeButtonText("Use Password")
                    .build()

                biometricPrompt.authenticate(promptInfo)
            }
        }

        // ══════════════════════════════════════════════════════
        //  GOOGLE ONE TAP — Native Sign-In (No browser!)
        // ══════════════════════════════════════════════════════
        //
        //  From React, call:
        //    window.AndroidBridge.signInWithGoogle()
        //
        //  React listens for the result:
        //    window.addEventListener('googleSignInSuccess', (e) => {
        //      const { idToken, email, name, photo } = e.detail;
        //      // Send idToken to your Node.js backend for verification
        //    });
        //
        // ══════════════════════════════════════════════════════

        @JavascriptInterface
        fun signInWithGoogle() {
            CoroutineScope(Dispatchers.Main).launch {
                googleSignInHelper.signIn(
                    onSuccess = { idToken, email, displayName, profilePicUrl ->
                        // Send the Google credential back to React
                        val safeEmail = email.replace("'", "\\'")
                        val safeName = displayName.replace("'", "\\'")
                        val safePhoto = (profilePicUrl ?: "").replace("'", "\\'")

                        webView.evaluateJavascript("""
                            window.dispatchEvent(new CustomEvent('googleSignInSuccess', {
                                detail: {
                                    idToken: '$idToken',
                                    email: '$safeEmail',
                                    name: '$safeName',
                                    photo: '$safePhoto'
                                }
                            }))
                        """.trimIndent(), null)
                    },
                    onError = { errorMessage ->
                        val safeError = errorMessage.replace("'", "\\'")
                        webView.evaluateJavascript("""
                            window.dispatchEvent(new CustomEvent('googleSignInError', {
                                detail: '$safeError'
                            }))
                        """.trimIndent(), null)
                    }
                )
            }
        }
    }

    // ══════════════════════════════════════════════════════════
    //  NETWORK HELPER
    // ══════════════════════════════════════════════════════════

    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = getSystemService(android.content.Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val network = connectivityManager.activeNetwork ?: return false
            val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
            return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        } else {
            @Suppress("DEPRECATION")
            val networkInfo = connectivityManager.activeNetworkInfo ?: return false
            @Suppress("DEPRECATION")
            return networkInfo.isConnected
        }
    }
}
