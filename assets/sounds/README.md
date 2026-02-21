# KYC Alert Sound

Place a `kyc_alert.wav` file in this directory.

## Requirements

- **Format**: WAV (PCM, 16-bit, 44.1 kHz recommended)
- **Duration**: 1–3 seconds (short alert tone)
- **Volume**: Moderate — it will play at the system notification volume

## How it's used

The `expo-notifications` plugin copies this file into the Android app bundle
at build time (configured in `app.json` → `plugins` → `expo-notifications` → `sounds`).

The Android notification channel `kyc_notifications` (created in `services/push.service.ts`)
references it as `kyc_alert.wav`.

## Generating a placeholder

You can generate a simple tone with ffmpeg:

```bash
ffmpeg -f lavfi -i "sine=frequency=880:duration=1" -ar 44100 -ac 1 kyc_alert.wav
```

Or download a royalty-free notification sound and rename it to `kyc_alert.wav`.
