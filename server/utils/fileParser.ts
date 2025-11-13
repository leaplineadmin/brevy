import fs from 'fs';
// No need for createRequire if we use dynamic import for ESM modules

// mammoth will be loaded via dynamic import in the Word branch to avoid CJS/ESM issues

/**
 * Extrait le texte d'un fichier PDF ou Word
 * @param {string} filePath - Chemin du fichier uploadé
 * @param {string} mimeType - Type MIME du fichier
 * @returns {Promise<string>} - Le texte extrait
 */
async function extractTextFromFile(filePath, mimeType) {
  try {
    
    if (mimeType === 'application/pdf') {
      // Extraction depuis PDF avec pdfjs-dist (import ESM legacy build dynamiquement)
      const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const data = new Uint8Array(fs.readFileSync(filePath));
      const pdf = await getDocument({ data, useWorker: false }).promise;
      
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      // Limitation de taille pour réduire la surface d'attaque
      const MAX_CV_LENGTH = 15000;
      if (fullText.length > MAX_CV_LENGTH) {
        console.warn(`⚠️ ALERTE : Le texte du CV dépasse la limite autorisée (${fullText.length} > ${MAX_CV_LENGTH}). Tronqué.`);
        return fullText.substring(0, MAX_CV_LENGTH);
      }
      return fullText;
      
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      // Extraction depuis Word via import ESM dynamique
      const mammothModule: any = await import('mammoth');
      const mammothLib = mammothModule && mammothModule.default ? mammothModule.default : mammothModule;
      if (!mammothLib || typeof mammothLib.extractRawText !== 'function') {
        throw new TypeError('mammoth.extractRawText is not available');
      }
      const result = await mammothLib.extractRawText({ path: filePath });
      const MAX_CV_LENGTH = 15000;
      if (result.value && result.value.length > MAX_CV_LENGTH) {
        console.warn(`⚠️ ALERTE : Le texte du CV dépasse la limite autorisée (${result.value.length} > ${MAX_CV_LENGTH}). Tronqué.`);
        return result.value.substring(0, MAX_CV_LENGTH);
      }
      return result.value;
      
    } else {
      throw new Error('Format de fichier non supporté. Utilisez PDF ou Word.');
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction du texte:', error);
    throw error;
  }
}

export { extractTextFromFile };
