import React from 'react';

// Fonction pour convertir du HTML en éléments React
export function renderHTMLContent(htmlString: string): React.ReactNode {
  if (!htmlString) return null;

  // Diviser le contenu en éléments selon les balises
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${htmlString}</div>`, 'text/html');
  const container = doc.querySelector('div');
  
  if (!container) return htmlString;

  return parseNode(container);
}

function parseNode(node: Node): React.ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    const tagName = element.tagName.toLowerCase();
    const children = Array.from(element.childNodes).map((child, index) => 
      parseNode(child)
    ).filter(child => child !== null && child !== '');

    const key = Math.random().toString(36).substr(2, 9);

    switch (tagName) {
      case 'strong':
      case 'b':
        return <strong key={key}>{children}</strong>;
      
      case 'em':
      case 'i':
        return <em key={key}>{children}</em>;
      
      case 'u':
        return <u key={key}>{children}</u>;
      
      case 'ul':
        return (
          <ul key={key} style={{ 
            listStyleType: 'disc', 
            margin: '0.1cm 0 0 0.5cm',
            padding: '0 0 0 0.5cm',
            listStylePosition: 'outside',
            display: 'block'
          }}>
            {children}
          </ul>
        );
      
      case 'ol':
        return (
          <ol key={key} style={{ 
            listStyleType: 'decimal', 
            margin: '0.1cm 0 0 0.5cm',
            padding: '0 0 0 0.5cm',
            listStylePosition: 'outside',
            display: 'block'
          }}>
            {children}
          </ol>
        );
      
      case 'li':
        return (
          <li key={key} style={{ 
            marginBottom: '0.05cm',
            lineHeight: '1.3',
            display: 'list-item'
          }}>
            {children}
          </li>
        );
      
      case 'br':
        return <br key={key} />;
      
      case 'p':
        return <p key={key}>{children}</p>;
      
      case 'div':
        return <div key={key}>{children}</div>;
      
      default:
        return <span key={key}>{children}</span>;
    }
  }

  return null;
}

// Version pour PDF : convertit les listes en paragraphes avec puces explicites
// html2pdf.js ne rend pas correctement les <ul><li>, donc on les convertit en <p> avec "• "
export function renderHTMLContentForPDF(htmlString: string): React.ReactNode {
  if (!htmlString) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${htmlString}</div>`, 'text/html');
  const container = doc.querySelector('div');
  
  if (!container) return htmlString;

  return parseNodeForPDF(container);
}

function parseNodeForPDF(node: Node): React.ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    const tagName = element.tagName.toLowerCase();
    const children = Array.from(element.childNodes).map((child, index) => 
      parseNodeForPDF(child)
    ).filter(child => child !== null && child !== '');

    const key = Math.random().toString(36).substr(2, 9);

    switch (tagName) {
      case 'strong':
      case 'b':
        return <strong key={key}>{children}</strong>;
      
      case 'em':
      case 'i':
        return <em key={key}>{children}</em>;
      
      case 'u':
        return <u key={key}>{children}</u>;
      
      case 'ul':
        // Pour PDF : convertir <ul> en div, et chaque <li> sera un <p> avec "• "
        return (
          <div key={key} style={{ 
            margin: '0.1cm 0 0 0.5cm',
            padding: '0'
          }}>
            {children}
          </div>
        );
      
      case 'ol':
        // Pour PDF : convertir <ol> en div, et chaque <li> sera un <p> avec numéro
        return (
          <div key={key} style={{ 
            margin: '0.1cm 0 0 0.5cm',
            padding: '0'
          }}>
            {children}
          </div>
        );
      
      case 'li':
        // Pour PDF : convertir <li> en <p> avec puce explicite "• "
        return (
          <p key={key} style={{ 
            margin: '0 0 0.05cm 0',
            lineHeight: '1.3',
            fontSize: '9.5pt',
            display: 'block'
          }}>
            {"• "}{children}
          </p>
        );
      
      case 'br':
        return <br key={key} />;
      
      case 'p':
        return <p key={key} style={{ margin: '0 0 0.05cm 0' }}>{children}</p>;
      
      case 'div':
        return <div key={key}>{children}</div>;
      
      default:
        return <span key={key}>{children}</span>;
    }
  }

  return null;
}

// Version simplifiée pour les cas où on veut juste supprimer les balises
export function stripHTMLTags(htmlString: string): string {
  if (!htmlString) return '';
  return htmlString.replace(/<[^>]*>/g, '');
}

// Fonction pour générer le HTML d'un template pour l'export PDF
export function renderTemplateToHTML(templateId: string, cvData: any, mainColor: string): string {
  // Fonction pour nettoyer le HTML et convertir les spans stylés en texte brut
  const cleanHTML = (html: string) => {
    if (!html) return '';
    
    // Créer un élément temporaire pour parser le HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Extraire seulement le texte brut, sans balises
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // Normaliser les espaces
    return textContent.replace(/\s+/g, ' ').trim();
  };

  // Extraire les informations personnelles
  const personalInfo = cvData.personalInfo || {};
  const fullName = `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim();
  const jobTitle = personalInfo.jobTitle || personalInfo.position || '';
  // Gérer la localisation avec format correct (Ville, Pays)
  let location = '';
  if (personalInfo.city && personalInfo.country) {
    location = `${personalInfo.city}, ${personalInfo.country}`;
  } else if (personalInfo.city) {
    location = personalInfo.city;
  } else if (personalInfo.country) {
    location = personalInfo.country;
  }
  const summary = cleanHTML(personalInfo.summary || '');
  
  // Extraire les expériences
  const experiences = (cvData.experience || []).map((exp: any) => ({
    ...exp,
    summary: cleanHTML(exp.summary || exp.description || '')
  }));
  
  // Extraire l'éducation
  const educations = (cvData.education || []).map((edu: any) => ({
    ...edu,
    description: cleanHTML(edu.description || '')
  }));
  
  // Extraire les outils/compétences - vérifier toutes les sources possibles
  const tools = cvData.tools || cvData.skills || [];
  
  // Générer le HTML selon le template
  return `
    <div class="template-${templateId}" style="--mainColor: ${mainColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.4; color: #333;">
      <div class="cv-content" style="padding: 40px; max-width: 210mm;">
        <!-- En-tête -->
        <div class="cv-header" style="margin-bottom: 30px; border-bottom: 2px solid ${mainColor}; padding-bottom: 20px;">
          <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: ${mainColor};">${fullName}</h1>
          ${jobTitle ? `<h2 style="margin: 8px 0 0 0; font-size: 18px; font-weight: normal; color: #666;">${jobTitle}</h2>` : ''}
          ${location ? `<p style="margin: 4px 0 0 0; color: #666;">${location}</p>` : ''}
          ${personalInfo.email ? `<p style="margin: 4px 0 0 0; color: #666;">${personalInfo.email}</p>` : ''}
          ${personalInfo.phone ? `<p style="margin: 4px 0 0 0; color: #666;">${personalInfo.phone}</p>` : ''}
        </div>
        
        <!-- Profil -->
        ${summary ? `
        <div class="cv-section" style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; font-size: 20px; font-weight: bold; color: ${mainColor}; border-bottom: 1px solid #eee; padding-bottom: 5px;">PROFIL</h3>
          <p style="margin: 0; text-align: justify;">${summary}</p>
        </div>
        ` : ''}
        
        <!-- Expérience -->
        ${experiences.length > 0 ? `
        <div class="cv-section" style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; font-size: 20px; font-weight: bold; color: ${mainColor}; border-bottom: 1px solid #eee; padding-bottom: 5px;">EXPÉRIENCE PROFESSIONNELLE</h3>
          ${experiences.map((exp: any) => `
            <div class="experience-item" style="margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px;">
                <h4 style="margin: 0; font-weight: bold; color: #333;">${exp.position || ''}</h4>
                <span style="font-size: 14px; color: #666;">${exp.from || ''} - ${exp.to || ''}</span>
              </div>
              <p style="margin: 0 0 8px 0; font-weight: 500; color: ${mainColor};">${exp.company || ''}</p>
              ${exp.location ? `<p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${exp.location}</p>` : ''}
              ${exp.summary ? `<p style="margin: 0; text-align: justify;">${exp.summary}</p>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        <!-- Formation -->
        ${educations.length > 0 ? `
        <div class="cv-section" style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; font-size: 20px; font-weight: bold; color: ${mainColor}; border-bottom: 1px solid #eee; padding-bottom: 5px;">FORMATION</h3>
          ${educations.map((edu: any) => `
            <div class="education-item" style="margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px;">
                <h4 style="margin: 0; font-weight: bold; color: #333;">${edu.diploma || edu.degree || ''}</h4>
                <span style="font-size: 14px; color: #666;">${edu.from || ''} - ${edu.to || ''}</span>
              </div>
              <p style="margin: 0 0 8px 0; font-weight: 500; color: ${mainColor};">${edu.school || ''}</p>
              ${edu.location ? `<p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${edu.location}</p>` : ''}
              ${edu.description ? `<p style="margin: 0; text-align: justify;">${edu.description}</p>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        <!-- Outils/Compétences -->
        ${tools.length > 0 ? `
        <div class="cv-section" style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; font-size: 20px; font-weight: bold; color: ${mainColor}; border-bottom: 1px solid #eee; padding-bottom: 5px;">OUTILS & COMPÉTENCES</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${tools.map((tool: any) => `
              <span style="background: ${mainColor}20; color: ${mainColor}; padding: 4px 12px; border-radius: 4px; font-size: 14px;">${typeof tool === 'string' ? tool : tool.name || ''}</span>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>
    </div>
  `;
}