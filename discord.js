// discord.js
// Simple Discord Webhook sender

// requires node-fetch 
// (can be installed with npm i node-fetch)

// Note: node-fetch v3+ is ESM only, so we use dynamic import
let fetch;

// for security, store your webhook URL in an environment variable
// const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL; // store in .env!

//for testing, you can paste your webhook URL here:
const WEBHOOK_URL = "https://discord.com/api/webhooks/1426319240822128734/E4AUg--UMCEoFSkN7WtGxdgBUiRdx-D-9oY7VMT9td7G61vI1ezkNmY7EXPoRTk_QsPm";

async function sendWebhookMessage(content) {
  // Lazy load fetch on first use (node-fetch v3 is ESM)
  if (!fetch) {
    const nodeFetch = await import('node-fetch');
    fetch = nodeFetch.default;
  }

  const res = await fetch(WEBHOOK_URL, {
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