// Server route that proxies/searches Clerk users.
// Requires `CLERK_API_KEY` to be set in the environment (server-only key).
export async function GET(request: Request) {
  // small helper to return JSON using the standard Web `Response` (ExpoResponse is deprecated)
  const jsonResponse = (body: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json' },
      ...(init || {}),
    });

  // end helper
  try {
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get('q')?.toLowerCase() || '';

    if (!searchQuery) {
      return jsonResponse({ users: [] });
    }

    const CLERK_API_KEY = process.env.CLERK_API_KEY;
    if (!CLERK_API_KEY) {
      console.error('Missing CLERK_API_KEY');
      return jsonResponse({ users: [], error: 'Server misconfigured' }, { status: 500 });
    }

    // Clerk List Users endpoint (server-side). We fetch a reasonable page and filter server-side.
    // NOTE: For large orgs you should implement server-side filtering / pagination with Clerk query params.
    const clerkRes = await fetch('https://api.clerk.com/v1/users?limit=100', {
      headers: {
        Authorization: `Bearer ${CLERK_API_KEY}`,
        Accept: 'application/json',
      },
    });

    if (!clerkRes.ok) {
      const text = await clerkRes.text();
      console.error('Clerk API error', clerkRes.status, text);
      return jsonResponse({ users: [], error: 'Clerk API error' }, { status: 502 });
    }

    const payload = await clerkRes.json();
    // Clerk may return an array or an object. Normalize to array.
    const usersArray = Array.isArray(payload) ? payload : payload?.data ?? [];

    // Map Clerk user objects into a shape the frontend expects and filter by query
    const mapped = (usersArray || [])
      .map((u: any) => {
        const emails = (u.email_addresses || []).map((e: any) => e.email_address || e.email).filter(Boolean);
        const email = emails[0] ?? u.email ?? null;
        const firstName = u.first_name ?? u.firstName ?? null;
        const lastName = u.last_name ?? u.lastName ?? null;
        const imageUrl = u.profile_image_url ?? u.image_url ?? null;

        return {
          id: u.id,
          email,
          firstName,
          lastName,
          imageUrl,
        };
      })
      .filter((user: any) => {
        const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.toLowerCase();
        return (
          (user.email && user.email.toLowerCase().includes(searchQuery)) ||
          fullName.includes(searchQuery)
        );
      });

    return jsonResponse({ users: mapped });
  } catch (error) {
    console.error('Search API Error:', error);
    return jsonResponse({ error: 'Internal Server Error' }, { status: 500 });
  }
}