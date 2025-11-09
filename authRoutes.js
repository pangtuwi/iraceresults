// Authentication routes

const express = require('express');
const passport = require('passport');
const router = express.Router();
const path = require('path');

// Login page
router.get('/login', function(req, res) {
   if (req.isAuthenticated()) {
      res.redirect('/auth/success');
   } else {
      res.sendFile(path.join(__dirname, '/html/login.html'));
   }
});

// Google OAuth initiation
router.get('/google',
   passport.authenticate('google', {
      scope: ['profile', 'email']
   })
);

// Google OAuth callback
router.get('/google/callback',
   passport.authenticate('google', {
      failureRedirect: '/auth/login?error=unauthorized'
   }),
   function(req, res) {
      // Successful authentication
      res.redirect('/auth/success');
   }
);

// Success page - shows authorized leagues
router.get('/success', function(req, res) {
   if (!req.isAuthenticated()) {
      return res.redirect('/auth/login');
   }

   const leagues = req.user.authorizedLeagues;
   const isSuperAdmin = req.user.isSuperAdmin;
   let leagueLinks = '';

   // Add super admin link if user is super admin
   if (isSuperAdmin) {
      leagueLinks += `<div style="margin: 10px 0;"><a href="/superadmin/" style="color: #fff; text-decoration: none; font-size: 18px; background: #ff6b00; padding: 10px 20px; display: inline-block; border-radius: 5px;">Super Admin</a></div>`;
   }

   leagues.forEach(league => {
      leagueLinks += `<div style="margin: 10px 0;"><a href="/admin/${league}/" style="color: #fff; text-decoration: none; font-size: 18px; background: #4CAF50; padding: 10px 20px; display: inline-block; border-radius: 5px;">${league} Admin</a></div>`;
   });

   res.send(`
      <!DOCTYPE html>
      <html>
      <head>
         <meta charset="utf-8">
         <title>Authentication Success</title>
         <style>
            body {
               font-family: Arial, sans-serif;
               background-color: #1a1a1a;
               color: #fff;
               display: flex;
               justify-content: center;
               align-items: center;
               min-height: 100vh;
               margin: 0;
            }
            .container {
               text-align: center;
               padding: 40px;
               background-color: #2a2a2a;
               border-radius: 10px;
               box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            }
            h1 {
               color: #4CAF50;
               margin-bottom: 20px;
            }
            .logout-link {
               margin-top: 30px;
            }
            .logout-link a {
               color: #ff6b6b;
               text-decoration: none;
            }
         </style>
      </head>
      <body>
         <div class="container">
            <h1>Authentication Successful</h1>
            <p>Welcome, ${req.user.displayName}!</p>
            <p>Email: ${req.user.email}</p>
            <h2>Authorized Leagues:</h2>
            ${leagueLinks}
            <div class="logout-link">
               <a href="/auth/logout">Logout</a>
            </div>
         </div>
      </body>
      </html>
   `);
});

// Logout
router.get('/logout', function(req, res) {
   req.logout(function(err) {
      if (err) {
         console.error('Logout error:', err);
      }
      res.redirect('/auth/login');
   });
});

// Check auth status (for API calls)
router.get('/status', function(req, res) {
   if (req.isAuthenticated()) {
      res.json({
         authenticated: true,
         user: {
            email: req.user.email,
            displayName: req.user.displayName,
            authorizedLeagues: req.user.authorizedLeagues,
            isSuperAdmin: req.user.isSuperAdmin || false
         }
      });
   } else {
      res.json({ authenticated: false });
   }
});

module.exports = router;
