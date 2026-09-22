import { profileFromUserInfo, type GoogleProfile } from './types';

export async function loadGoogleProfile(
    token: string,
    fetchImpl: typeof fetch
): Promise<GoogleProfile> {
    const res = await fetchImpl('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        throw new Error(`Google userinfo failed (${res.status})`);
    }
    return profileFromUserInfo(await res.json());
}
