import { expect, test } from 'vitest';
import { imageLicense, plainCredit } from '../../scripts/lib/image-license.mjs';
const base = { descriptionurl: 'https://commons.wikimedia.org/wiki/File:Portrait.jpg', extmetadata: { Artist: { value: '<a href="https://commons.wikimedia.org/wiki/User:Photo">Élodie &amp; Marc</a>' }, LicenseShortName: { value: 'CC BY-SA 4.0' }, LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' }, Categories: { value: 'Portraits' } } };
test('image attribution is plain text and a matching free license stays attached to its source', () => {
  expect(plainCredit('<script>bad()</script><b>Auteur</b> &amp; &#233;')).toBe('Auteur & é');
  expect(imageLicense(base)).toMatchObject({ author: 'Élodie & Marc', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', sourcePage: base.descriptionurl });
});
test('unclear authorship, restrictive licenses and unresolved copyright notices are not imported', () => {
  const withMeta = (extra: object) => ({ ...base, extmetadata: { ...base.extmetadata, ...extra } });
  expect(imageLicense(withMeta({ Artist: { value: '' } }))).toBeNull();
  expect(imageLicense(withMeta({ LicenseShortName: { value: 'CC BY-NC 4.0' }, LicenseUrl: { value: 'https://creativecommons.org/licenses/by-nc/4.0/' } }))).toBeNull();
  expect(imageLicense(withMeta({ Categories: { value: 'Copyright violations' } }))).toBeNull();
  expect(imageLicense(withMeta({ LicenseShortName: { value: 'Public domain' }, License: { value: 'pd' }, Categories: { value: 'PD-author-FlickrPDM' } }))).toBeNull();
  expect(imageLicense({ ...base, descriptionurl: 'https://unrelated.example/image' })).toBeNull();
});
test('Commons license URLs without a final slash resolve to the same license', () => {
  expect(imageLicense({ ...base, extmetadata: { ...base.extmetadata, LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0' } } })).toMatchObject({ license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' });
});
