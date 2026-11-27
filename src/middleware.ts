import { defineMiddleware } from 'astro:middleware';

// Only the owner can open /admin pages (except the login page itself).
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
  if (!isAdminPage || pathname === '/admin/login' || context.isPrerendered) return next();

  const { hasSession } = await import('./lib/admin/auth');
  if (!(await hasSession(context.cookies))) {
    return context.redirect(`/admin/login?next=${encodeURIComponent(pathname + context.url.search)}`);
  }
  const response = await next();
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('X-Frame-Options', 'DENY');
  return response;
});
