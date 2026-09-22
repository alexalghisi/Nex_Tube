import { describe, expect, it } from 'vitest';
import { profileFromUserInfo } from './types';

describe('profileFromUserInfo', () => {
    it('maps a Google userinfo payload', () => {
        expect(
            profileFromUserInfo({
                id: '99',
                email: 'alex@example.com',
                name: 'Alex',
                picture: 'https://img.example/a.png',
            })
        ).toEqual({
            id: '99',
            email: 'alex@example.com',
            name: 'Alex',
            pictureUrl: 'https://img.example/a.png',
        });
    });

    it('rejects a payload without an account id', () => {
        expect(() => profileFromUserInfo({ email: 'a@b.c' })).toThrow(
            'Google profile is missing id or email'
        );
    });
});
