import { describe, it, expect } from 'vitest';
import { dfsXyConv } from '../../lib/sources/kma';

describe('KMA Grid Converter Test', () => {
  it('should convert lat/lng to correct KMA Grid nx/ny', () => {
    // 서울 기준 (37.5665, 126.9780) -> nx: 60, ny: 127
    const result = dfsXyConv(37.5665, 126.9780);

    expect(result.nx).toBe(60);
    expect(result.ny).toBe(127);
  });

  it('should convert Busan coordinates correctly', () => {
    // 부산 기준 (35.1796, 129.0756) -> nx: 98, ny: 76
    const result = dfsXyConv(35.1796, 129.0756);

    expect(result.nx).toBe(98);
    expect(result.ny).toBe(76);
  });
});
