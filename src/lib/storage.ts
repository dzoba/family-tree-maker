import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadPersonPhoto(
  treeId: string,
  personId: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const storageRef = ref(storage, `trees/${treeId}/people/${personId}/photo.${ext}`);

  // Resize/compress before upload if needed
  const resized = await resizeImage(file, 400, 400);
  await uploadBytes(storageRef, resized, { contentType: file.type });
  return getDownloadURL(storageRef);
}

export async function deletePersonPhoto(
  treeId: string,
  personId: string
): Promise<void> {
  // Try common extensions
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    try {
      const storageRef = ref(storage, `trees/${treeId}/people/${personId}/photo.${ext}`);
      await deleteObject(storageRef);
      return;
    } catch {
      // File with this extension doesn't exist, try next
    }
  }
}

function resizeImage(file: File, maxWidth: number, maxHeight: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(blob || file),
        'image/jpeg',
        0.85
      );
    };

    img.src = objectUrl;
  });
}
