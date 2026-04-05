/**
 * Signup handler
 * Cloudflare Pages Function
 *
 * Receives email signups, validates, sends ntfy push notification
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
    let email, honeypot;

    if (contentType.includes('application/json')) {
      const json = await request.json();
      email    = json.email;
      honeypot = json.website;
    } else if (contentType.includes('form')) {
      const formData = await request.formData();
      email    = formData.get('email');
      honeypot = formData.get('website');
    } else {
      return new Response(JSON.stringify({ error: 'Invalid content type' }), { status: 400, headers });
    }

    if (honeypot) {
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    if (!email || !email.includes('@') || email.length < 5) {
      return new Response(JSON.stringify({ error: 'Valid email required' }), { status: 400, headers });
    }

    email = email.trim().toLowerCase().slice(0, 254);

    // Send ntfy push notification
    const ntfyTopic = env.NTFY_TOPIC;
    if (ntfyTopic) {
      try {
        await fetch(`https://ntfy.sh/${ntfyTopic}`, {
          method: 'POST',
          headers: {
            'Title': 'New signup — larsen.studio',
            'Priority': 'high',
            'Tags': 'tada',
            'Content-Type': 'text/plain',
          },
          body: email,
        });
      } catch (ntfyError) {
        console.error('ntfy error:', ntfyError);
      }
    }

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
