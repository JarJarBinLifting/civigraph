export function plainCredit(html) {
  const entities = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', copy: '©', ndash: '–', mdash: '—' };
  return String(html ?? '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<[^>]+>/g, ' ')
    .replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (original, code) => {
      if (code.startsWith('#')) { const point = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1)); return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : ''; }
      return entities[code] ?? original;
    }).replace(/\s+/g, ' ').trim();
}
export function imageLicense(info) {
  const metadata = info?.extmetadata;
  if (!metadata) return null;
  const value = key => plainCredit(metadata[key]?.value);
  const author = value('Artist'), license = value('LicenseShortName');
  if (!author || author.length > 1000 || /copyright violations|deletion requests|missing permission|no permission|flickrpdm/i.test(value('Categories'))) return null;
  let sourcePage;
  try { const url = new URL(info.descriptionurl); if (url.protocol !== 'https:' || url.hostname !== 'commons.wikimedia.org' || !url.pathname.startsWith('/wiki/File:')) return null; sourcePage = url.href; } catch { return null; }
  let licenseUrl = value('LicenseUrl').replace(/^http:/, 'https:');
  if (/^CC BY(?:-SA)? /i.test(license)) {
    try {
      const url = new URL(licenseUrl);
      if (!url.pathname.endsWith('/')) url.pathname += '/';
      const expected = /^CC BY-SA /i.test(license) ? 'by-sa' : 'by';
      if (url.protocol !== 'https:' || url.hostname !== 'creativecommons.org' || !new RegExp(`^/licenses/${expected}/(?:1\\.0|2\\.0|2\\.5|3\\.0|4\\.0)/(?:[a-z]{2}/)?$`).test(url.pathname) || url.search || url.hash) return null;
      licenseUrl = url.href;
    } catch { return null; }
  } else if (/^CC0(?: 1\.0)?$/i.test(license)) licenseUrl = 'https://creativecommons.org/publicdomain/zero/1.0/';
  else if (license === 'Public domain' && value('Copyrighted').toLowerCase() === 'false' && /^pd/i.test(value('License'))) licenseUrl = `${sourcePage}#Licensing`;
  else return null;
  const attribution = value('Attribution'), credit = value('Credit');
  if (attribution.length > 1000 || credit.length > 1000) return null;
  return { author, attribution, credit, license: license === 'Public domain' ? 'Domaine public (Commons)' : license, licenseUrl, sourcePage, restrictions: value('Restrictions'), takenAt: value('DateTimeOriginal') };
}
