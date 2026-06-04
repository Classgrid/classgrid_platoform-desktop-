package com.classgrid.app

import android.content.Context
import android.util.Log
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.exceptions.GetCredentialException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║           GOOGLE ONE TAP NATIVE SIGN-IN HELPER              ║
 * ║                                                              ║
 * ║  This provides the Instagram-style native Google account     ║
 * ║  picker that slides up from the bottom of the screen.        ║
 * ║  NO external browser is opened. Everything stays inside      ║
 * ║  the Classgrid app.                                          ║
 * ║                                                              ║
 * ║  Flow:                                                       ║
 * ║  1. React calls window.AndroidBridge.signInWithGoogle()      ║
 * ║  2. Native bottom sheet appears with Google accounts         ║
 * ║  3. Student taps their account                               ║
 * ║  4. We get the ID Token                                      ║
 * ║  5. We send the token back to React via JS event             ║
 * ║  6. React sends token to our Node.js backend for auth        ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

class GoogleSignInHelper(private val context: Context) {

    companion object {
        private const val TAG = "ClassgridGoogleAuth"

        // ══════════════════════════════════════════════════════
        //  🔧 IMPORTANT: Replace this with YOUR Google OAuth
        //     Web Client ID from Google Cloud Console.
        //
        //  Go to: https://console.cloud.google.com/
        //  → APIs & Services → Credentials
        //  → Find "Web client (auto created by Google)"
        //  → Copy the Client ID
        //
        //  It looks like: "123456789-abc.apps.googleusercontent.com"
        // ══════════════════════════════════════════════════════
        const val GOOGLE_WEB_CLIENT_ID = "YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com"
    }

    private val credentialManager = CredentialManager.create(context)

    /**
     * Launches the native Google One Tap sign-in bottom sheet.
     *
     * @param onSuccess Called with the Google ID Token when sign-in succeeds.
     *                  The token is sent to our Node.js backend for verification.
     * @param onError   Called with the error message if sign-in fails.
     */
    suspend fun signIn(
        onSuccess: (idToken: String, email: String, displayName: String, profilePicUrl: String?) -> Unit,
        onError: (errorMessage: String) -> Unit
    ) {
        try {
            // Build the Google Sign-In request
            val googleIdOption = GetGoogleIdOption.Builder()
                .setFilterByAuthorizedAccounts(false)  // Show ALL Google accounts on device
                .setServerClientId(GOOGLE_WEB_CLIENT_ID)
                .setAutoSelectEnabled(true)  // Auto-select if only 1 account
                .build()

            val request = GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build()

            // Show the native bottom sheet
            val result: GetCredentialResponse = credentialManager.getCredential(
                request = request,
                context = context as android.app.Activity
            )

            // Extract the Google credential
            handleSignInResult(result, onSuccess, onError)

        } catch (e: GetCredentialException) {
            Log.e(TAG, "Google Sign-In failed", e)
            onError(e.message ?: "Google Sign-In failed. Please try again.")
        }
    }

    /**
     * Processes the credential response and extracts user info.
     */
    private fun handleSignInResult(
        response: GetCredentialResponse,
        onSuccess: (idToken: String, email: String, displayName: String, profilePicUrl: String?) -> Unit,
        onError: (errorMessage: String) -> Unit
    ) {
        when (val credential = response.credential) {
            is CustomCredential -> {
                if (credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                    val googleCredential = GoogleIdTokenCredential.createFrom(credential.data)

                    val idToken = googleCredential.idToken
                    val email = googleCredential.id
                    val displayName = googleCredential.displayName ?: ""
                    val profilePicUrl = googleCredential.profilePictureUri?.toString()

                    Log.d(TAG, "Google Sign-In success: $email")

                    onSuccess(idToken, email, displayName, profilePicUrl)
                } else {
                    onError("Unexpected credential type: ${credential.type}")
                }
            }
            else -> {
                onError("Unexpected credential format")
            }
        }
    }
}
