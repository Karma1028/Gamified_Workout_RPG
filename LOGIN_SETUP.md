# HunterAscend - Google OAuth Setup & Login Troubleshooting

## Quick Start: Enable Google Sign-In

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Search for and enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add authorized redirect URIs:
   ```
   https://ouxznheawjryawmygikq.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback  (for local testing)
   ```
7. Copy your **Client ID** and **Client Secret**

### Step 2: Configure Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** → **Providers** → **Google**
4. Enable the Google provider
5. Paste your **Client ID** and **Client Secret**
6. Save

### Step 3: Test Login

1. Click "Sign in with Google" on the landing page
2. Complete the Google OAuth flow
3. You should be redirected to the onboarding page

## Troubleshooting

### Issue: "OAuth configuration error" or blank redirect

**Cause**: Redirect URI not configured in Google Cloud Console

**Fix**:
1. Go back to Google Cloud Console
2. Find your OAuth credential (Credentials → OAuth 2.0 Client IDs)
3. Add these URIs under "Authorized redirect URIs":
   - `https://ouxznheawjryawmygikq.supabase.co/auth/v1/callback`
   - `http://localhost:3000` (for local dev)
   - `http://localhost:3000/auth/callback` (for local dev)
4. Click Save
5. Wait 5 minutes for changes to propagate

### Issue: "Authentication error" message on sign-in page

**Cause**: Browser error handling auth callback

**Fix**:
1. Check browser console (F12 → Console tab)
2. Look for error messages about:
   - Missing `code` parameter
   - Redirect URI mismatch
3. Try opening the app in an incognito/private window (clears cache)
4. Check that cookies are enabled

### Issue: Page goes blank after clicking "Sign in with Google"

**Cause**: Google OAuth flow initiated but callback not handled

**Fix**:
1. Close the Google login popup if it appears
2. Refresh the page (F5)
3. Check browser console for JavaScript errors
4. Ensure Supabase credentials are correct in `.env`:
   ```
   VITE_SUPABASE_URL=https://ouxznheawjryawmygikq.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc... (full key)
   ```

### Issue: "Invalid redirect_uri" error from Google

**Cause**: Redirect URI in Google Console doesn't match app's redirect

**Fix**:
1. Verify exactly what URI the app is using:
   - Check `AuthContext.tsx` line 131: `redirectTo: ${window.location.origin}/auth/callback`
2. Add this exact URI to Google Cloud Console:
   - For production: `https://ouxznheawjryawmygikq.supabase.co/auth/v1/callback`
   - For localhost: `http://localhost:5173/auth/callback` (if using Vite)
3. Ensure no trailing slashes or extra parameters

### Issue: Can sign in, but get stuck on "Loading..." screen

**Cause**: User profile not created in database

**Fix**:
1. Check Supabase database (Tables → users)
2. Verify the `users` table exists and has RLS policies
3. Check browser console for errors
4. Try signing out and signing in again:
   - Clear localStorage: F12 → Application → Clear all
   - Sign in again

### Issue: After sign-in, app shows "Onboarding" but clicking buttons doesn't work

**Cause**: Database permission/RLS policy issue

**Fix**:
1. Go to Supabase Dashboard
2. Check the `onboarding_data` table RLS policies:
   - Should allow INSERT for authenticated users
3. Verify policies match these requirements:
   ```sql
   -- For INSERT
   CREATE POLICY "Users can insert own onboarding data"
   ON onboarding_data FOR INSERT
   TO authenticated
   WITH CHECK (auth.uid() = user_id);

   -- For UPDATE
   CREATE POLICY "Users can update own onboarding data"
   ON onboarding_data FOR UPDATE
   TO authenticated
   USING (auth.uid() = user_id)
   WITH CHECK (auth.uid() = user_id);
   ```
4. If policies don't exist, re-run the migration from `DEPLOYMENT.md`

## Testing Locally

### Setup Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start dev server**:
   ```bash
   npm run dev
   ```
   This typically runs on `http://localhost:5173`

3. **Add localhost to Google Console**:
   - Go to Google OAuth Credentials
   - Add: `http://localhost:5173/auth/callback`
   - Add: `http://localhost:5173`

4. **Test login**:
   - Click "Sign in with Google"
   - Authenticate with your Google account
   - Should redirect to onboarding

### Simulating Without Google OAuth (Development)

To test the app without configuring Google OAuth:

1. Open browser console (F12)
2. Paste this code to create a fake session:
   ```javascript
   localStorage.setItem('sb-ouxznheawjryawmygikq-auth-token', JSON.stringify({
     access_token: 'fake_token',
     user: {
       id: 'test-user-123',
       email: 'test@example.com',
       user_metadata: { name: 'Test User' }
     }
   }));
   location.reload();
   ```
3. Refresh the page
4. You should see the login screen with a test session

**Note**: This only works locally for testing. Real Google OAuth is needed for production.

## Error Messages & Meanings

| Error | Meaning | Fix |
|-------|---------|-----|
| "redirect_uri_mismatch" | URI doesn't match Google config | Add correct URI to Google Console |
| "invalid_client" | Client ID/Secret incorrect | Check Supabase OAuth settings |
| "access_denied" | User declined Google permission | Try again, check scopes |
| "server_error" | Supabase issue | Check Supabase status page |
| "state_mismatch" | CSRF protection triggered | Refresh page, try in incognito |

## Checking if Configuration is Correct

### 1. Verify Supabase Setup

```bash
# Check environment variables
cat .env | grep VITE_SUPABASE
```

Output should show:
```
VITE_SUPABASE_URL=https://ouxznheawjryawmygikq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 2. Test Supabase Connection

In browser console:
```javascript
import { supabase } from './lib/supabase';
supabase.auth.getSession().then(console.log);
```

Should show session info or null.

### 3. Check Google OAuth Provider

In Supabase Dashboard:
1. Go to **Authentication** → **Providers**
2. Click **Google**
3. Verify:
   - Status shows "Enabled"
   - Client ID is filled in
   - Client Secret is filled in

### 4. Verify Redirect URI

In Google Cloud Console:
1. Go to **APIs & Services** → **Credentials**
2. Click your OAuth credential (Web application)
3. Under "Authorized redirect URIs", verify:
   ```
   https://ouxznheawjryawmygikq.supabase.co/auth/v1/callback
   http://localhost:5173/auth/callback  (if testing locally)
   ```

## Common Setup Mistakes

❌ **Wrong Redirect URI Format**
```
WRONG: https://supabase.co/callback
RIGHT: https://ouxznheawjryawmygikq.supabase.co/auth/v1/callback
```

❌ **Forgot to Enable Google Provider**
```
Make sure the toggle in Supabase is ON
```

❌ **Copy-pasted API keys incorrectly**
```
Both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be complete
```

❌ **Testing on different domain than configured**
```
If you configure http://localhost:5173, don't test on http://127.0.0.1:5173
```

## Advanced: Google Drive Integration (Optional)

To also enable Google Drive spreadsheet creation:

1. In Google Cloud Console, add this scope to your OAuth:
   ```
   https://www.googleapis.com/auth/drive.file
   ```

2. In Supabase, edit the Google provider and add:
   ```json
   {
     "scopes": ["openid", "profile", "email", "https://www.googleapis.com/auth/drive.file"]
   }
   ```

3. Users will be asked for Drive permission during sign-in

## Still Having Issues?

### 1. Check Browser Console
- F12 → Console tab
- Look for red error messages
- Screenshot or copy full error text

### 2. Check Supabase Logs
- Supabase Dashboard → Authentication → Logs
- Look for failed auth attempts
- Check error codes

### 3. Check Google Cloud Logs
- Google Cloud Console → Logging
- Search for OAuth errors
- Check consent screen configuration

### 4. Enable Debug Mode
In `AuthContext.tsx`, line 30, change:
```typescript
console.error('Error signing in:', error);
```
to:
```typescript
console.error('Full error object:', error);
console.table(error);  // Shows error as table in console
```

Then reload and try signing in again.

## Getting Help

For issues, check:
1. [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
2. [Google OAuth Docs](https://developers.google.com/identity/protocols/oauth2)
3. Browser console error messages
4. Supabase Dashboard → Authentication → Logs

---

**Last Updated**: October 2025
**Status**: ✅ Login system fixed and tested
**Next**: After OAuth configured, users can sign in and proceed to onboarding
