// protestMonitor.js
// Background service to monitor protestable rounds and send Discord notifications

const leaguedata = require('./leaguedata.js');
const discord = require('./discord.js');
const config = require('./appconfig.js');

// Track protest state for each league
// Map structure: leagueID => { hasProtests: boolean, roundNumbers: Set }
const protestState = new Map();

// Monitoring interval in milliseconds (60 seconds)
const CHECK_INTERVAL = 60 * 1000;

let monitoringInterval = null;

/**
 * Check a single league for protestable rounds and send notifications if needed
 */
async function checkLeagueProtests(leagueID) {
   try {
      // Skip if league doesn't exist in cache
      if (!leaguedata.cache[leagueID]) {
         return;
      }

      const leagueConfig = leaguedata.cache[leagueID].config;

      // Only monitor Active leagues (status = 1)
      if (leagueConfig.league_status !== 1) {
         return;
      }

      // Skip if no protest webhook configured
      if (!leagueConfig.DISCORD_PROTEST_WEBHOOK_URL || leagueConfig.DISCORD_PROTEST_WEBHOOK_URL.trim() === '') {
         return;
      }

      // Get current protestable rounds
      const protestableRounds = leaguedata.getProtestableRounds(leagueID);
      const hasProtests = protestableRounds.length > 0;

      // Get previous state
      const previousState = protestState.get(leagueID) || { hasProtests: false, roundNumbers: new Set() };

      // Check for new protestable rounds (transition from 0 to 1+ rounds)
      if (hasProtests && !previousState.hasProtests) {
         // New protest window opened - send notification
         await sendProtestNotification(leagueID, protestableRounds, leagueConfig);

         // Update state to prevent repeat notifications
         const currentRoundNumbers = new Set(protestableRounds.map(r => r.round_no));
         protestState.set(leagueID, {
            hasProtests: true,
            roundNumbers: currentRoundNumbers
         });
      } else if (hasProtests) {
         // Check for newly opened rounds (rounds not in previous state)
         const currentRoundNumbers = new Set(protestableRounds.map(r => r.round_no));
         const newRounds = protestableRounds.filter(r => !previousState.roundNumbers.has(r.round_no));

         if (newRounds.length > 0) {
            // New rounds became protestable - send notification for new rounds only
            await sendProtestNotification(leagueID, newRounds, leagueConfig);
         }

         // Update state with current round numbers
         protestState.set(leagueID, {
            hasProtests: true,
            roundNumbers: currentRoundNumbers
         });
      } else {
         // No protests - reset state
         protestState.set(leagueID, {
            hasProtests: false,
            roundNumbers: new Set()
         });
      }

   } catch (error) {
      console.error(`Error checking protests for league ${leagueID}:`, error);
   }
}

/**
 * Send Discord notification for newly opened protest windows
 */
async function sendProtestNotification(leagueID, rounds, leagueConfig) {
   try {
      const leagueName = leagueConfig.league_name || leagueID;
      const webhookURL = leagueConfig.DISCORD_PROTEST_WEBHOOK_URL;

      // Build message for each round
      const roundMessages = rounds.map(round => {
      //determine time now
      const now = Date.now();   
   
         return `**Round ${round.round_no}:** ${round.track_name}\n` +
               `Protest window opened at ${new Date(now).toLocaleString()}` +
                ` and closes after  ${leagueConfig.protest_open_for_hrs} hours`;
      }).join('\n\n');

      // Build protest URL
      const protestURL = `${config.baseURL}/${leagueID}/protest`;

      const message = `🚨 **PROTEST WINDOW OPEN** 🚨\n\n` +
                     `**League:** ${leagueName}\n` +
                     roundMessages +
                     `\n\n**Submit Protest:** ${protestURL}`;

      await discord.sendWebhookMessage(webhookURL, message);
      console.log(`Protest notification sent for ${leagueName} - ${rounds.length} round(s)`);

   } catch (error) {
      console.error(`Error sending protest notification for league ${leagueID}:`, error);
   }
}

/**
 * Check all leagues for protestable rounds
 */
async function checkAllLeagues() {
   console.log('Checking leagues for protestable rounds...');
   try {
      // Iterate through all configured leagues
      for (const leagueID of config.leagueIDs) {
         await checkLeagueProtests(leagueID);
      }
   } catch (error) {
      console.error('Error in checkAllLeagues:', error);
   }
}

/**
 * Start the protest monitoring service
 */
function startMonitoring() {
   if (monitoringInterval) {
      console.log('Protest monitor is already running');
      return;
   }

   console.log('Starting protest monitor - checking every 60 seconds');

   // Run initial check
   checkAllLeagues();

   // Set up recurring checks
   monitoringInterval = setInterval(checkAllLeagues, CHECK_INTERVAL);
}

/**
 * Stop the protest monitoring service
 */
function stopMonitoring() {
   if (monitoringInterval) {
      clearInterval(monitoringInterval);
      monitoringInterval = null;
      console.log('Protest monitor stopped');
   }
}

module.exports = {
   startMonitoring,
   stopMonitoring,
   checkAllLeagues // Export for testing
};
