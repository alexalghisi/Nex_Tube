export type GoogleProfile = {
    id: string;
    email: string;
    name: string;
    pictureUrl: string;
};

export type GoogleAuthPort = {
    signIn(): Promise<GoogleProfile>;
    signOut(): Promise<void>;
    restore(): Promise<GoogleProfile | null>;
};

export function profileFromUserInfo(body: {
    id?: string;
    email?: string;
    name?: string;
    picture?: string;
}): GoogleProfile {
    if (!body.id || !body.email) {
        throw new Error('Google profile is missing id or email');
    }
    return {
        id: body.id,
        email: body.email,
        name: body.name ?? body.email,
        pictureUrl: body.picture ?? '',
    };
}
