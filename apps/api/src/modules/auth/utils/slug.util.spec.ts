import { slugifyOrganizationName } from './slug.util';

describe('slugifyOrganizationName', () => {
  it('slugifies alphanumeric names and appends a hex suffix', () => {
    const slug = slugifyOrganizationName('Acme Corp!');
    expect(slug).toMatch(/^acme-corp-[a-f0-9]{6}$/);
  });

  it('falls back to company when the name has no usable characters', () => {
    const slug = slugifyOrganizationName('!!!');
    expect(slug).toMatch(/^company-[a-f0-9]{6}$/);
  });

  it('truncates long names before the suffix', () => {
    const long = 'a'.repeat(80);
    const slug = slugifyOrganizationName(long);
    const base = slug.slice(0, slug.lastIndexOf('-'));
    expect(base.length).toBeLessThanOrEqual(40);
  });
});
