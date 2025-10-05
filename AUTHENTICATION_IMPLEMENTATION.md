# Authentication Implementation Summary

## Overview

OAuth 2.0 authentication has been successfully implemented for the iRaceResults admin interface using Google OAuth and Passport.js.

## Implementation Details

### New Files Created

1. **auth.js** - Core authentication module
   - `initializePassport()` - Initializes Passport with Google OAuth strategy
   - `ensureAuthenticated()` - Middleware to require authentication
   - `ensureAuthorizedForLeague()` - Middleware to check league-specific authorization
   - `loadAdminUsers()` - Loads authorized users from JSON files
   - `isAuthorizedAdmin()` - Checks if email is authorized
   - `getAuthorizedLeagues()` - Returns leagues a user can access

2. **authRoutes.js** - Authentication routes
   - `GET /auth/login` - Login page
   - `GET /auth/google` - Initiates Google OAuth
   - `GET /auth/google/callback` - OAuth callback handler
   - `GET /auth/success` - Success page with authorized leagues
   - `GET /auth/logout` - Logout handler
   - `GET /auth/status` - API endpoint for auth status

3. **html/login.html** - Beautiful login page
   - Google sign-in button
   - Error message handling
   - Responsive design
   - Racing theme

4. **.env.example** - Environment variable template
   - Google OAuth credentials
   - Session secret
   - Callback URL

5. **AUTHENTICATION_SETUP.md** - Complete setup guide
   - Google OAuth configuration steps
   - Environment setup
   - Admin user configuration
   - Troubleshooting guide

6. **data/{leagueid}/adminusers.json** - Per-league authorization
   - Created for all existing leagues (BLANK, NXTGT3S6, NXTGT3S7, NXTGT3S8, NXTPROS5, NXTTCCS7, NXTTCCS8)
   - JSON array format with email and name fields

### Modified Files

1. **app.js**
   - Added dotenv for environment variables
   - Added express-session middleware
   - Initialized Passport authentication
   - Added `/auth` route handler
   - Configured authentication settings

2. **admin.js**
   - Added `auth` module import
   - Applied `ensureAuthenticated` middleware to all admin routes
   - Applied `ensureAuthorizedForLeague` middleware to league-specific routes
   - Routes now require both authentication and authorization

3. **package.json**
   - Added dependencies:
     - `express-session` - Session management
     - `passport` - Authentication middleware
     - `passport-google-oauth20` - Google OAuth strategy
     - `dotenv` - Environment variable management

4. **.gitignore**
   - Added `.env` to prevent committing secrets
   - Added `node_modules/` if not already present

5. **README.md**
   - Added authentication section
   - Quick start instructions
   - Link to detailed setup guide

## Security Features

1. **OAuth 2.0** - Industry-standard authentication protocol
2. **No password storage** - All authentication handled by Google
3. **Per-league authorization** - Granular access control
4. **Session management** - Secure session cookies with configurable expiry
5. **Email verification** - Only whitelisted emails can access admin
6. **HTTPS ready** - Cookie security flags for production

## Access Control

### Authentication Flow
```
User → /admin/{leagueid}
  ↓ (not authenticated)
/auth/login
  ↓ (click "Sign in with Google")
/auth/google
  ↓ (Google OAuth)
/auth/google/callback
  ↓ (check adminusers.json)
Authorized → /auth/success → /admin/{leagueid}
Unauthorized → /auth/login?error=unauthorized
```

### Authorization Levels
- **Unauthenticated**: Can access public routes (results, tables)
- **Authenticated**: Can access login success page
- **Authorized (per league)**: Can access specific league admin interfaces

### Per-League Authorization
Users are authorized independently for each league:
- User A can be admin of League 1
- User B can be admin of League 1 and League 2
- User C can be admin of all leagues

## Configuration Required

To use the authentication system, you must:

1. **Create Google OAuth 2.0 credentials**
   - Set up a project in Google Cloud Console
   - Create OAuth 2.0 Client ID
   - Configure authorized redirect URIs

2. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Add Google Client ID
   - Add Google Client Secret
   - Set callback URL
   - Set session secret

3. **Configure admin users**
   - Edit `/data/{leagueid}/adminusers.json` for each league
   - Add authorized user email addresses

## Testing Checklist

- [ ] Environment variables configured
- [ ] Google OAuth credentials created and valid
- [ ] Admin users added to `adminusers.json` files
- [ ] Server starts without errors
- [ ] `/auth/login` page loads
- [ ] Google OAuth flow completes
- [ ] Authorized user can access admin
- [ ] Unauthorized user is rejected
- [ ] User with access to League A cannot access League B
- [ ] Logout works correctly
- [ ] Session persists across requests
- [ ] Public routes still accessible without auth

## Known Limitations

1. **In-memory sessions** - Sessions stored in memory (use Redis/MongoDB for production scaling)
2. **Google only** - Currently only supports Google OAuth (can be extended to other providers)
3. **Manual user management** - Admin users managed via JSON files (could add UI for this)

## Future Enhancements

Possible improvements:
1. Add support for other OAuth providers (GitHub, Microsoft, etc.)
2. Create admin UI to manage authorized users
3. Add role-based permissions (super admin vs league admin)
4. Implement audit logging for admin actions
5. Add 2FA support
6. Session storage with Redis
7. Remember user's last accessed league

## Production Checklist

Before deploying to production:

- [ ] Change `SESSION_SECRET` to strong random value
- [ ] Set `cookie.secure: true` (requires HTTPS)
- [ ] Update callback URL to production domain
- [ ] Add production callback to Google OAuth config
- [ ] Use environment variables (not `.env` file)
- [ ] Implement session store (Redis/MongoDB)
- [ ] Review and update `adminusers.json` files
- [ ] Test authentication flow in production
- [ ] Monitor session/authentication logs
- [ ] Set up session cleanup/expiry policies

## Support

For setup help, see:
- [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md) - Detailed setup guide
- [Passport.js Documentation](http://www.passportjs.org/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)

## Branch Information

All authentication code is on the `authentication` branch. To merge to main:

```bash
git add .
git commit -m "Add OAuth 2.0 authentication for admin interface"
git checkout main
git merge authentication
```
