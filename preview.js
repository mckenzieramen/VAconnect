/* VA CONNECT live website preview proxy for Cloudflare Pages Functions.
 * Only hosts that exist in the VA CONNECT directory are permitted.
 * This removes framing headers from the proxied response so sites that
 * explicitly block iframe embedding can still be viewed inside Preview.
 */
const ALLOWED_HOSTS = new Set([
  '20four7va.com','247virtualassistants.com','360vma.com','5starvas.com','apply.personatalent.com','aristosourcing.com','asksunday.com','assistworld.com','ataraxismgmt.com','belaysolutions.com','boldly.com','careers.emapta.com','contra.com','crdle.com','crewbloom.com','docva.com','edgevirtualassistant.com','elitevirtualassist.com','execviva.com','filtaglobal.com','flexa.careers','foundersarm.com','freeeup.com','getmagic.com','gocarpathian.com','hellorache.com','helpsquad.com','hirelatam.com','hirewinning.com','inboxdone.com','invedus.com','iworker.co','jobs.athena.com','jobs.cloudstaff.com','latamcent.com','maado.co','medva.com','momtovirtualassistant.com','mymountainmover.com','mytasker.com','myvirtudesk.com','octhopus.com','okayrelax.com','outsourced.ph','outsourceddoers.com','outsourcey.com','penbrothers.com','peppervirtualassistant.com','remote.co','remotecoworker.com','remoteok.com','remotive.com','revaglobal.com','rocketstation.com','smart-pa.com','smartvirtualassistants.com','somewhere.com','stealthagents.com','taskbullet.com','taskflova.com','thereistalent.com','thevirtualgurus.com','trypineapple.com','valatam.com','vavavirtual.com','virtalent.com','virtualcoworker.com','virtualstaff.ph','virtualwizards.io','vitalisva.com','vlbpo.com','wellfound.com','weworkremotely.com','wingassistant.com','withdouble.com','woodbows.com','www.bruntwork.co','www.cherryassistant.com','www.delegated.com','www.fancyhands.com','www.fiverr.com','www.flexjobs.com','www.futureworkplaces.fi','www.growthassistant.ph','www.hirehangar.com','www.hireinsouth.com','www.hireoverseas.com','www.klarecon.com','www.myoutdesk.com','www.onlinejobs.ph','www.onlinevateam.com','www.outsourceaccelerator.com','www.peachtreeva.com','www.pearltalent.com','www.prialto.com','www.remotelatinos.com','www.staffvirtual.com','www.summitvasolutions.com','www.supportninja.com','www.taskeasegroup.com','www.taskus.com','www.timeetc.com','www.toptal.com','www.trycoconut.com','www.uassistme.com','www.uplers.com','www.upwork.com','www.vaplatinum.com.au','www.virtual-assists.com','www.virtualassistusa.com','www.virtuallatinos.com','www.virtualvocations.com','www.wishup.co','www.workana.com','www.workingnomads.com','www.zirtual.com'
]);

function isAllowed(url) {
  const h = url.hostname.toLowerCase();
  return [...ALLOWED_HOSTS].some(allowed => h === allowed || h.endsWith('.' + allowed));
}

function absolutize(value, base) {
  try { return new URL(value, base).toString(); } catch { return null; }
}

function rewriteHtml(html, baseUrl, proxyBase) {
  // Strip response-level framing/security meta tags that would otherwise
  // recreate the original site's iframe restriction inside the proxy.
  html = html.replace(/<meta[^>]+http-equiv=["'](?:content-security-policy|x-frame-options)["'][^>]*>/gi, '');
  html = html.replace(/<meta[^>]+content=["'][^"']*["'][^>]+http-equiv=["'](?:content-security-policy|x-frame-options)["'][^>]*>/gi, '');

  const proxy = (raw) => {
    const v = raw.trim().replace(/^['"]|['"]$/g, '');
    if (!v || v.startsWith('#') || /^(data:|javascript:|mailto:|tel:|blob:)/i.test(v)) return raw;
    const absolute = absolutize(v, baseUrl);
    if (!absolute) return raw;
    const u = new URL(absolute);
    if (!isAllowed(u)) return raw;
    return `${proxyBase}?url=${encodeURIComponent(absolute)}`;
  };

  // Keep navigation links pointing to the real site, but proxy resource URLs
  // so CSS/images/scripts that are needed for the live preview load in-frame.
  html = html.replace(/\b(src|poster)=(['"])([^'"]+)\2/gi, (m, attr, q, value) => `${attr}=${q}${proxy(value)}${q}`);
  html = html.replace(/\bhref=(['"])([^'"]+)\1/gi, (m, q, value) => {
    if (/^(?:mailto:|tel:|javascript:|#)/i.test(value.trim())) return m;
    const absolute = absolutize(value, baseUrl);
    if (!absolute) return m;
    const u = new URL(absolute);
    // Stylesheets/preloads/icons are resources; ordinary anchors stay real.
    const isResource = /rel=["'][^"']*(?:stylesheet|preload|icon|manifest|modulepreload)[^"']*["']/i.test(m);
    return isResource && isAllowed(u) ? `href=${q}${proxy(value)}${q}` : m;
  });
  html = html.replace(/<base[^>]*>/gi, '');
  html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${baseUrl}">`);
  html = html.replace(/<form([^>]+action=)(['"])([^'"]+)\2/gi, (m, prefix, q, value) => {
    const absolute = absolutize(value, baseUrl); if (!absolute) return m;
    return `${prefix}${q}${absolute}${q}`;
  });
  return html;
}

async function fetchTarget(url, request) {
  let current = new URL(url);
  for (let i = 0; i < 4; i++) {
    if (!isAllowed(current)) return new Response('Preview target is outside the VA CONNECT directory allowlist.', {status: 403});
    const upstream = await fetch(current.toString(), {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0 (VA CONNECT preview)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': request.headers.get('Accept-Language') || 'en-US,en;q=0.9'
      }
    });
    if (upstream.status >= 300 && upstream.status < 400) {
      const location = upstream.headers.get('Location');
      if (!location) return upstream;
      current = new URL(location, current);
      continue;
    }
    return new Response(upstream.body, {status: upstream.status, headers: new Headers(upstream.headers)});
  }
  return new Response('Too many redirects while loading preview.', {status: 508});
}

export async function onRequestGet({request}) {
  const requestUrl = new URL(request.url);
  const raw = requestUrl.searchParams.get('url');
  if (!raw) return new Response('Missing preview URL.', {status: 400});
  let target;
  try { target = new URL(raw); } catch { return new Response('Invalid preview URL.', {status: 400}); }
  if (target.protocol !== 'https:' || !isAllowed(target)) return new Response('Preview target is not allowed.', {status: 403});

  const upstream = await fetchTarget(target.toString(), request);
  const headers = new Headers(upstream.headers);
  headers.delete('content-security-policy');
  headers.delete('content-security-policy-report-only');
  headers.delete('x-frame-options');
  headers.delete('cross-origin-opener-policy');
  headers.delete('cross-origin-embedder-policy');
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.set('Cache-Control', 'public, max-age=300');

  const contentType = headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    const html = await upstream.text();
    const proxyBase = `${requestUrl.origin}/preview`;
    const rewritten = rewriteHtml(html, target.toString(), proxyBase);
    headers.set('content-type', 'text/html; charset=UTF-8');
    return new Response(rewritten, {status: upstream.status, headers});
  }
  return new Response(upstream.body, {status: upstream.status, headers});
}
