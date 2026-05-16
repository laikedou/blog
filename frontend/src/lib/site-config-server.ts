export async function getSiteConfigServer() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  try {
    const res = await fetch(`${apiBase}/api/site-config`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error(`[site-config-server] fetch failed: ${res.status} ${res.statusText}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error('[site-config-server] fetch error:', err);
    return null;
  }
}
