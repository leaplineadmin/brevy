export function validateAndSanitizeCvData(data: any, originalCvText: string, ipAddress?: string) {
  if (!data) {
    throw new Error("Données invalides reçues de l'IA.");
  }

  // 1. Vérifier le flag de sécurité de l'IA
  if (data.securityFlag?.isSuspicious) {
    console.error(`🚨 ALERTE SÉCURITÉ : L'IA a détecté un CV suspect. IP: ${ipAddress || 'N/A'}. Raison : ${data.securityFlag.reason}`);
    throw new Error("Le contenu du CV est jugé suspect.");
  }

  // 2. Détection de mots-clés suspects dans la sortie JSON
  // On garde uniquement les mots-clés vraiment suspects liés aux injections de code
  // On retire les mots professionnels courants comme "system", "admin", "database" qui peuvent apparaître légitimement dans un CV
  const suspiciousKeywords = ['ignore', 'instruction', 'password', 'credit card', '<script>', 'eval(', 'javascript:', 'onerror=', 'onload='];
  const jsonDataString = JSON.stringify(data).toLowerCase();
  for (const keyword of suspiciousKeywords) {
    if (jsonDataString.includes(keyword)) {
      console.error(`🚨 ALERTE SÉCURITÉ : Tentative d'injection potentielle bloquée. IP: ${ipAddress || 'N/A'}. Mot-clé: "${keyword}".`);
      throw new Error("Le résultat de l'analyse contient du contenu potentiellement dangereux.");
    }
  }

  // 3. Validation de format (exemples)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.personalInfo?.email && !emailRegex.test(data.personalInfo.email)) {
    console.warn(`Validation : Email invalide "${data.personalInfo.email}" remplacé par null.`);
    data.personalInfo.email = null;
  }

  // 4. Validation de plausibilité (longueur)
  if (data.personalInfo?.firstName?.length > 50) {
    console.warn(`Validation : Prénom anormalement long, remplacé par null.`);
    data.personalInfo.firstName = null;
  }

  // 5. Cross-validation (présence dans le texte source)
  if (data.personalInfo?.lastName && !originalCvText.toLowerCase().includes(String(data.personalInfo.lastName).toLowerCase())) {
    console.warn(`Validation : Le nom "${data.personalInfo.lastName}" n'apparaît pas dans le texte original.`);
  }

  // Nettoyage du flag de sécurité avant retour
  if (data.securityFlag) {
    delete data.securityFlag;
  }

  return data;
}



