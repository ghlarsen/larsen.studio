/**
 * CartGoals Beta Signup Handler
 * Cloudflare Pages Function
 *
 * Receives form submissions, validates, sends to Slack
 */

export async function onRequestPost({ request, env }) {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://larsen.studio',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    // Parse form data or JSON
    const contentType = request.headers.get('content-type') || '';
    let email, honeypot;

    if (contentType.includes('application/json')) {
      const json = await request.json();
      email = json.email;
      honeypot = json.website; // honeypot field
    } else if (contentType.includes('form')) {
      const formData = await request.formData();
      email = formData.get('email');
      honeypot = formData.get('website'); // honeypot field
    } else {
      return new Response(JSON.stringify({ error: 'Invalid content type' }), {
        status: 400, headers
      });
    }

    // Honeypot check (bots fill this hidden field)
    if (honeypot) {
      // Pretend success but don't process
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    // Validate email
    if (!email || !email.includes('@') || email.length < 5) {
      return new Response(JSON.stringify({ error: 'Valid email required' }), {
        status: 400, headers
      });
    }

    // Clean inputs
    email = email.trim().toLowerCase().slice(0, 254);

    // Get Slack webhook URL from environment
    const slackWebhook = env.SLACK_WEBHOOK_URL;

    if (!slackWebhook) {
      console.error('SLACK_WEBHOOK_URL not configured');
      // Still return success to user, log error server-side
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    // Format Slack message
    const slackMessage = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🎉 New CartGoals Beta Signup!',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Email:*\n${email}`
            },
            {
              type: 'mrkdwn',
              text: `*Source:*\nlarsen.studio`
            }
          ]
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Submitted: ${new Date().toISOString()}`
            }
          ]
        }
      ]
    };

    // Send to Slack
    const slackResponse = await fetch(slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage)
    });

    if (!slackResponse.ok) {
      console.error('Slack webhook failed:', await slackResponse.text());
    }

    // Success response
    return new Response(JSON.stringify({
      success: true,
      message: "You're on the list! We'll be in touch soon."
    }), { status: 200, headers });

  } catch (error) {
    console.error('Signup error:', error);
    return new Response(JSON.stringify({
      error: 'Something went wrong. Please try again.'
    }), { status: 500, headers });
  }
}

// Handle preflight CORS requests
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://larsen.studio',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  });
}
