const TAG_TONE_COUNT = 6;

export const normalizeTag = (value: string): string =>
  value.trim().replace(/\s+/g, ' ').slice(0, 20);

export const getTagTone = (tag: string): number => {
  let hash = 0;
  for (let index = 0; index < tag.length; index += 1) {
    hash = (hash * 31 + tag.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) % TAG_TONE_COUNT;
};