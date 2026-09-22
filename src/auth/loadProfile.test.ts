import { describe, expect, it } from 'vitest';
import { loadGoogleProfile } from './loadProfile';

describe('loadGoogleProfile', () => {
    it('reads userinfo with the bearer token', async () => {
        const profile = await loadGoogleProfile('tok-1', async (input, init) => {
            expect(String(input)).toBe('https://www.googleapis.com/oauth2/v2/userinfo');
            expect((init?.headers as { Authorization: string }).Authorization).toBe(
                'Bearer tok-1'
            );
            return new Response(
                JSON.stringify({
                    id: '1',
                    email: 'a@b.c',
                    name: 'A',
                    picture: '',
                }),
                { status: 200 }
            );
        });
        expect(profile.email).toBe('a@b.c');
    });

    it('throws when Google rejects the token', async () => {
        await expect(
            loadGoogleProfile('bad', async () => new Response('no', { status: 401 }))
        ).rejects.toThrow('Google userinfo failed (401)');
    });
});
