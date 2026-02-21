// ============================================================
// Cross-platform FormData file helper
//
// React Native native:  FormData accepts { uri, name, type }
// Web (Expo Web):       FormData needs a real Blob / File object
//
// This utility normalises the difference so the same call site
// works on both platforms.
// ============================================================

import { Platform } from 'react-native';

/**
 * Append a file to a FormData instance in a cross-platform way.
 *
 * @param formData  - The FormData to append to
 * @param fieldName - The form field name (e.g. `'file'`)
 * @param fileUri   - Local file URI (e.g. `file:///…`, `data:…`, blob URL)
 * @param fileName  - File name including extension
 * @param mimeType  - MIME type (e.g. `'image/jpeg'`)
 */
export async function appendFile(
  formData: FormData,
  fieldName: string,
  fileUri: string,
  fileName: string,
  mimeType: string,
): Promise<void> {
  if (Platform.OS === 'web') {
    // On the web, { uri, name, type } is just a plain object that
    // becomes "[object Object]".  We must convert the URI to a real
    // Blob/File so the browser serialises the binary data correctly.
    const response = await fetch(fileUri);
    const blob = await response.blob();
    const file = new File([blob], fileName, { type: mimeType });
    formData.append(fieldName, file);
  } else {
    // React Native's XHR polyfill knows how to read the file from
    // the URI when it sees this shape.
    formData.append(fieldName, {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as any);
  }
}
