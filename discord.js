// discord.js
// Simple Discord Webhook sender

//const { config } = require('dotenv');

// requires node-fetch 
// (can be installed with npm i node-fetch)
// Note: node-fetch v3+ is ESM only, so we use dynamic import
let fetch;

// for security, store your webhook URL in an environment variable
//const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL; // store in .env!
//const DISCORD_WEBHOOK_URL = config.DISCORD_WEBHOOK_URL

//for testing, you can paste your webhook URL here:
// DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/1426975873055068271/x2HP3qQposhQfOHFwSFJ4RC9z4PVvLs2Y-bEXFLBsCGZnQobquIM_bh0CLroSahAf2Lb

async function sendWebhookMessage(DISCORD_WEBHOOK_URL,content) {
  console.log("Sending Discord webhook message to URL:", DISCORD_WEBHOOK_URL, "with content:", content);
  // Lazy load fetch on first use (node-fetch v3 is ESM)
  if (!fetch) {
    const nodeFetch = await import('node-fetch');
    fetch = nodeFetch.default;
  }

  const res = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }) // you can also send embeds, username, avatar_url
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord webhook error ${res.status}: ${text}`);
  }
}

// example usage
//sendWebhookMessage("Hello from Node! ✅").catch(console.error);

exports.sendWebhookMessage = sendWebhookMessage;