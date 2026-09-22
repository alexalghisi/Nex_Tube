import { describe, expect, it } from 'vitest';
import { formatDuration, formatViews, publishedDay } from './format';

describe('formatDuration', () => {
    it('prints m:ss under an hour', () => {
        expect(formatDuration(0)).toBe('0:00');
        expect(formatDuration(9)).toBe('0:09');
        expect(formatDuration(596)).toBe('9:56');
    });

    it('prints h:mm:ss from 3600 up', () => {
        expect(formatDuration(3600)).toBe('1:00:00');
        expect(formatDuration(3661)).toBe('1:01:01');
    });
});

describe('formatViews', () => {
    it('keeps small counts raw', () => {
        expect(formatViews(12)).toBe('12 views');
    });

    it('uses K and M without a locale', () => {
        expect(formatViews(4102)).toBe('4.1K views');
        expect(formatViews(18422031)).toBe('18.4M views');
        expect(formatViews(1000)).toBe('1K views');
        expect(formatViews(1_000_000)).toBe('1M views');
    });
});

describe('publishedDay', () => {
    it('takes the calendar day from an ISO stamp', () => {
        expect(publishedDay('2008-04-10T00:00:00.000Z')).toBe('2008-04-10');
    });
});
