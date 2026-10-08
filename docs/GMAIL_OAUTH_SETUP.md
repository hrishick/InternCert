# Gmail API OAuth 2.0 Integration Guide

InternCert uses the official Google Cloud Gmail API with OAuth 2.0 to securely dispatch certificates with PDF attachments.

> **Security Rule**: Never store or hardcode user Gmail passwords in plaintext.

---

## 1. Google Cloud Console Setup

1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project named `InternCert`.
3. Enable the **Gmail API** in APIs & Services.
4. Configure the **OAuth Consent Screen** (User Type: External/Internal, Scopes: `https://www.googleapis.com/auth/gmail.send`).
5. Create **OAuth 2.0 Client IDs** (Application Type: Web Application).
6. Authorized redirect URIs: `https://developers.google.com/oauthplayground` (or your domain).

---

## 2. Obtain Refresh Token via Google OAuth Playground

1. Open [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground).
2. In configuration (gear icon), select **Use your own OAuth credentials** and input your `Client ID` & `Client Secret`.
3. Select scope `https://www.googleapis.com/auth/gmail.send` and authorize APIs.
4. Click **Exchange authorization code for tokens** to get the `Refresh Token`.

---

## 3. Environment Variables Configuration

In `.env`:
```env
GMAIL_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="GOCSPX-your-client-secret"
GMAIL_REFRESH_TOKEN="1//04your-refresh-token"
GMAIL_USER="internships@interncert.org"
```

---

## 4. Development & Demo Fallback Mode

If Google Cloud keys are not provided during local development or evaluation, the built-in **High-Fidelity Email Simulator** automatically activates:
- Records all dispatched emails with timestamps to the `email_logs` table.
- Generates realistic delivery status and logs retryable SMTP error simulations.
- Provides 1-click **"Retry Email"** in the Admin Control Center.
