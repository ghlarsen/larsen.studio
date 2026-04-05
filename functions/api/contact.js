/**
 * Contact form handler
 * Cloudflare Pages Function
 *
 * Receives contact form submissions, validates, sends ntfy push notification
 */

export async function onRequestPost({ request, env }) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://larsen.studio',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const contentType = request.headers.get('content-type') || '';
    let name, email, message, honeypot;

    if (contentType.includes('application/json')) {
      const json = await request.json();
      name     = json.name;
      email    = json.email;
      message  = json.message;
      honeypot = json.website;
    } else if (contentType.includes('form')) {
      const formData = await request.formData();
      name     = formData.get('name');
      email    = formData.get('email');
      message  = formData.get('message');
      honeypot = formData.get('website');
    } else {
      return new Response(JSON.stringify({ error: 'Invalid content type' }), { status: 400, headers });
    }

    // Honeypot — bots fill this hidden field
    if (honeypot) {
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    // Validate
    if (!email || !email.includes('@') || email.length < 5) {
      return new Response(JSON.stringify({ error: 'Valid email required' }), { status: 400, headers });
    }
    if (!message || message.trim().length < 5) {
      return new Response(JSON.stringify({ error: 'Message required' }), { status: 400, headers });
    }

    // Sanitise
    name    = (name    || 'Anonymous').trim().slice(0, 100);
    email   = email.trim().toLowerCase().slice(0, 254);
    message = message.trim().slice(0, 2000);

    // Send ntfy push notification
    const ntfyTopic = env.NTFY_TOPIC;
    if (ntfyTopic) {
      try {
        await fetch(`https://ntfy.sh/${ntfyTopic}`, {
          method: 'POST',
          headers: {
            'Title': `Message from ${name}`,
            'Priority': 'high',
            'Tags': 'envelope',
            'Content-Type': 'text/plain',
          },
          body: `${email}\n\n${message}`,
        });
      } catch (ntfyError) {
        console.error('ntfy error:', ntfyError);
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });

  } catch (error) {
    console.error('Contact error:', error);
    return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), { status: 500, headers });
  }
}

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
