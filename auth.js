// Authentication module using Passport and Google OAuth 2.0

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const fs = require('fs');
const path = require('path');

// Load admin users for a specific league
function loadAdminUsers(leagueID) {
   try {
      const filePath = path.join(__dirname, 'data', leagueID, 'adminusers.json');
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
   } catch (error) {
      console.error(`Error loading admin users for league ${leagueID}:`, error);
      return [];
   }
}

// Load super admin users
function loadSuperUsers() {
   try {
      const filePath = path.join(__dirname, 'superusers.json');
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
   } catch (error) {
      console.error('Error loading super users:', error);
      return [];
   }
}

// Check if email is a super admin
function isSuperAdmin(email) {
   const superUsers = loadSuperUsers();
   return superUsers.some(user => user.email.toLowerCase() === email.toLowerCase());
}

// Check if email is authorized for any league
function isAuthorizedAdmin(email, leagueID = null) {
   const config = require('./appconfig.js');

   // If checking specific league
   if (leagueID) {
      const adminUsers = loadAdminUsers(leagueID);
      return adminUsers.some(user => user.email.toLowerCase() === email.toLowerCase());
   }

   // Check across all leagues
   for (const league of config.leagueIDs) {
      const adminUsers = loadAdminUsers(league);
      if (adminUsers.some(user => user.email.toLowerCase() === email.toLowerCase())) {
         return true;
      }
   }

   return false;
}

// Get leagues that a user is authorized for
function getAuthorizedLeagues(email) {
   const config = require('./appconfig.js');
   const authorizedLeagues = [];

   for (const league of config.leagueIDs) {
      const adminUsers = loadAdminUsers(league);
      if (adminUsers.some(user => user.email.toLowerCase() === email.toLowerCase())) {
         authorizedLeagues.push(league);
      }
   }

   return authorizedLeagues;
}

// Initialize Passport
function initializePassport(app, authConfig) {
   // Configure Google OAuth Strategy
   passport.use(new GoogleStrategy({
      clientID: authConfig.GOOGLE_CLIENT_ID,
      clientSecret: authConfig.GOOGLE_CLIENT_SECRET,
      callbackURL: authConfig.GOOGLE_CALLBACK_URL
   },
   function(accessToken, refreshToken, profile, done) {
      // Extract user email from Google profile
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

      if (!email) {
         return done(null, false, { message: 'No email found in Google profile' });
      }

      // Check if user is authorized (either super admin or league admin)
      const isSuperUser = isSuperAdmin(email);
      const isLeagueAdmin = isAuthorizedAdmin(email);

      if (isSuperUser || isLeagueAdmin) {
         const user = {
            id: profile.id,
            email: email,
            displayName: profile.displayName,
            authorizedLeagues: getAuthorizedLeagues(email),
            isSuperAdmin: isSuperUser
         };
         return done(null, user);
      } else {
         return done(null, false, { message: 'Unauthorized email address' });
      }
   }));

   // Serialize user for the session
   passport.serializeUser(function(user, done) {
      done(null, user);
   });

   // Deserialize user from the session
   passport.deserializeUser(function(user, done) {
      done(null, user);
   });

   // Initialize passport
   app.use(passport.initialize());
   app.use(passport.session());
}

// Helper function to check if request is from iframe
function isIframeRequest(req) {
   // Check if request has X-Requested-With header (AJAX/Fetch requests)
   // or if the referer contains the admin page
   const referer = req.get('Referer') || '';
   return referer.includes('/admin/');
}

// Middleware to check if user is authenticated
function ensureAuthenticated(req, res, next) {
   if (req.isAuthenticated()) {
      return next();
   }

   // If request is from iframe, return error page instead of redirecting
   if (isIframeRequest(req)) {
      return res.status(401).sendFile(path.join(__dirname, 'html', 'auth_error.html'));
   }

   res.redirect('/auth/login');
}

// Middleware to check if user is authorized for specific league
function ensureAuthorizedForLeague(req, res, next) {
   if (!req.isAuthenticated()) {
      // If request is from iframe, return error page instead of redirecting
      if (isIframeRequest(req)) {
         return res.status(401).sendFile(path.join(__dirname, 'html', 'auth_error.html'));
      }
      return res.redirect('/auth/login');
   }

   const leagueID = req.params.leagueid ? req.params.leagueid.toUpperCase() : null;

   if (!leagueID) {
      return next();
   }

   // Check if user is authorized for this league
   if (req.user.authorizedLeagues.includes(leagueID)) {
      return next();
   }

   res.status(403).send('You are not authorized to access this league');
}

// Middleware to check if user is a super admin
function ensureSuperAdmin(req, res, next) {
   if (!req.isAuthenticated()) {
      return res.redirect('/auth/login');
   }

   if (req.user.isSuperAdmin) {
      return next();
   }

   res.status(403).send('You are not authorized to access super admin functions');
}

module.exports = {
   initializePassport,
   ensureAuthenticated,
   ensureAuthorizedForLeague,
   ensureSuperAdmin,
   isAuthorizedAdmin,
   isSuperAdmin,
   getAuthorizedLeagues,
   loadAdminUsers,
   loadSuperUsers
};
