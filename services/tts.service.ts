// ============================================================
// Text-to-Speech Service
// Wraps expo-speech with sensible defaults for voice alerts.
// Used by push.service.ts when data.ttsMessage is present.
// ============================================================

import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

class TTSService {
  private _isSpeaking = false;

  /**
   * Speak the given text aloud.
   *
   * - Stops any in-progress speech first so messages don't overlap.
   * - Uses English voice with slightly slower rate for clarity.
   * - Works on both Android (TextToSpeech) and iOS (AVSpeechSynthesizer)
   *   via the expo-speech abstraction.
   */
  async speak(text: string): Promise<void> {
    if (!text?.trim()) return;

    try {
      // Stop any ongoing speech to avoid overlap
      if (this._isSpeaking) {
        await Speech.stop();
      }

      this._isSpeaking = true;

      Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: Platform.OS === 'ios' ? 0.5 : 0.9, // iOS rate scale is 0–1, Android is ~1.0 normal
        onDone: () => {
          this._isSpeaking = false;
        },
        onError: () => {
          this._isSpeaking = false;
        },
        onStopped: () => {
          this._isSpeaking = false;
        },
      });
    } catch (err) {
      this._isSpeaking = false;
      console.warn('[TTS] Speech error:', err);
    }
  }

  /** Stop any in-progress speech */
  stop(): void {
    try {
      Speech.stop();
      this._isSpeaking = false;
    } catch {}
  }

  /** Check if currently speaking */
  get isSpeaking(): boolean {
    return this._isSpeaking;
  }

  /** Check if TTS is available on this device */
  async isAvailable(): Promise<boolean> {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      return voices.length > 0;
    } catch {
      return false;
    }
  }
}

export const ttsService = new TTSService();
export default ttsService;
