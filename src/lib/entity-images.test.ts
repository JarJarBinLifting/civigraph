import { expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import images from '../data/entity-images.json';
import expansionImages from '../data/expansion-images.json';
import { loadDataset } from './dataset';
test('every retained image is a local, intact file attributed to a canonical corpus entity', () => {
  const data = loadDataset();
  const entities = new Map(data.entities.map(entity => [entity.id, entity]));
  expect(new Set(images.images.map(image => image.entityId)).size).toBe(images.images.length);
  for (const image of [...images.images, ...expansionImages.images]) {
    expect(entities.has(image.entityId)).toBe(true);
    expect(image.src).toMatch(/^\/images\/entities\/Q\d+-[a-f0-9]{12}\.(jpg|png|webp)$/);
    expect(image.author.length).toBeGreaterThan(0);
    expect(image.sourcePage).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    expect(image.licenseUrl).toMatch(/^https:\/\/(creativecommons\.org|commons\.wikimedia\.org)\//);
    expect(createHash('sha256').update(readFileSync(`public${image.src}`)).digest('hex')).toBe(image.sha256);
  }
  expect(entities.get('Q3052772')).toHaveProperty('image.src', images.images.find(image => image.entityId === 'Q3052772')?.src);
});
