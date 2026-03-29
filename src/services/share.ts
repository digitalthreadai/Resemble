import { Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import type { View } from 'react-native';

/**
 * Capture a View as a high-res PNG and share it.
 * On web, triggers a download instead.
 */
export async function shareResults(viewRef: RefObject<View>): Promise<void> {
  if (!viewRef.current) return;

  let uri: string;

  try {
    uri = await captureRef(viewRef, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });
  } catch {
    // Retry once after a short delay (layout may not be committed yet)
    await new Promise(resolve => setTimeout(resolve, 100));
    try {
      uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
    } catch {
      // Capture failed twice — bail out
      return;
    }
  }

  if (Platform.OS === 'web') {
    // Web: download the image
    try {
      const link = document.createElement('a');
      link.href = uri;
      link.download = `resemble-results-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // Web download failed
    }
    return;
  }

  // Native: share via system sheet
  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) return;
    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: 'Share Resemble Results',
    });
  } catch {
    // Share cancelled or failed — ignore
  }
}
