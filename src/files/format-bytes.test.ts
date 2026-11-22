import { formatBytes } from './format-bytes';

describe('formatBytes', () => {
  it('usa B, KB y MB con coma decimal', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(420 * 1024)).toBe('420 KB');
    expect(formatBytes(4.2 * 1024 * 1024)).toBe('4,2 MB');
  });
});
