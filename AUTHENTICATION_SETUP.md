# Authentication Setup Guide

This guide explains how to set up OAuth 2.0 authentication for the iRaceResults admin interface.

## Overview

The authentication system uses Google OAuth 2.0 to secure the admin portion of the application. Only users with email addresses listed in the league's `adminusers.json` file can access admin features.

## Features

- **Google OAuth 2.0** authentication
- **Per-league authorization** - users can be authorized for specific leagues
- **No registration page** - authorization is controlled via JSON files
- **Session-based** authentication with 24-hour cookie lifetime
- **Only admin routes protected** - public results pages remain accessible

## Setup Instructions

### 1. Create Google OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Configure the consent screen if prompted
   - Application type: "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/auth/google/callback` (for development)
     - `https://yourdomain.com/auth/google/callback` (for production)
   - Click "Create"
   - Copy the Client ID and Client Secret

### 2. Configure Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
SESSION_SECRET=change_this_to_a_random_secret_string
```

**Important:** Never commit the `.env` file to version control!

### 3. Install Dependencies

If not already installed, install the authentication packages:

```bash
npm install express-session passport passport-google-oauth20
```

### 4. Configure Authorized Admin Users

For each league, edit the `/data/{LEAGUEID}/adminusers.json` file:

```json
[
   {
      "email": "admin1@example.com",
      "name": "Admin User 1"
   },
   {
      "email": "admin2@example.com",
      "name": "Admin User 2"
   }
]
```

**Note:** Email addresses are case-insensitive.

### 5. Load Environment Variables (Optional)

To automatically load environment variables from `.env`, install dotenv:

```bash
npm install dotenv
```

Then add to the top of `app.js`:

```javascript
require('dotenv').config();
```

## File Structure

```
/data/
  /{LEAGUEID}/
    adminusers.json     # Authorized admin emails for each league
/html/
  login.html            # Login page
/auth.js                # Authentication middleware and helpers
/authRoutes.js          # Authentication routes (login, callback, logout)
/app.js                 # Updated with session and passport initialization
/admin.js               # Updated with authentication middleware
```

## Authentication Flow

1. User navigates to `/admin/{leagueid}`
2. If not authenticated, redirected to `/auth/login`
3. User clicks "Sign in with Google"
4. Google OAuth flow completes
5. Email is checked against `adminusers.json` for that league
6. If authorized, user is logged in and redirected
7. If unauthorized, shown error message

## Routes

### Public Routes
- `/auth/login` - Login page
- `/auth/google` - Initiates Google OAuth
- `/auth/google/callback` - OAuth callback (handled by Google)
- `/auth/logout` - Logout
- `/auth/status` - Check authentication status (API)
- `/auth/success` - Success page showing authorized leagues

### Protected Routes
- `/admin/*` - All admin routes require authentication

## Security Notes

1. **Session Secret**: Change `SESSION_SECRET` to a strong random string in production
2. **HTTPS**: Set `cookie.secure: true` in production when using HTTPS
3. **Authorized Redirect URIs**: Only add trusted domains to Google OAuth config
4. **Email Verification**: Always use the email from the OAuth provider
5. **File Permissions**: Ensure `adminusers.json` files have appropriate permissions

## Per-League Authorization

Users are authorized on a per-league basis:

- A user can be admin of one or multiple leagues
- Add their email to each league's `adminusers.json` file
- The system automatically determines which leagues they can access
- Attempting to access unauthorized leagues returns a 403 error

## Troubleshooting

### "Unauthorized email address" error
- Check that the user's email exists in the league's `adminusers.json`
- Verify email spelling (case-insensitive)
- Ensure JSON file is valid

### Redirect URI mismatch
- Verify the callback URL in `.env` matches Google Console settings
- Include the full URL including protocol and port

### Session not persisting
- Check that session secret is set
- Verify cookie settings
- Clear browser cookies and try again

## Testing

To test the authentication system:

1. Start the server: `node app.js`
2. Navigate to `http://localhost:3000/auth/login`
3. Sign in with a Google account
4. Verify authorization works/fails appropriately

## Production Deployment

For production:

1. Use environment variables (not `.env` file)
2. Set `SESSION_SECRET` to a strong random value
3. Enable `secure: true` for cookies (requires HTTPS)
4. Update `GOOGLE_CALLBACK_URL` to production domain
5. Add production callback URL to Google OAuth settings
6. Consider using a session store (Redis, MongoDB) instead of memory store

## Support

For issues or questions, check:
- Google OAuth 2.0 documentation
- Passport.js documentation
- Project README
