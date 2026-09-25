import { setAudioModeAsync } from 'expo-audio';

export async function armBackgroundAudio(): Promise<void> {
    await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
        allowsRecording: false,
        shouldRouteThroughEarpiece: false,
    });
}
