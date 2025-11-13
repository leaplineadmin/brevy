// Animation des vagues pour le template Waves
export function initWavesAnimation(canvasElement: HTMLCanvasElement | string, mainColor: string): (() => void) | undefined {
  // Garde SSR - ne pas exécuter côté serveur
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {}; // Return empty cleanup function
  }
  
  const canvas = typeof canvasElement === 'string' 
    ? document.getElementById(canvasElement) as HTMLCanvasElement | null
    : canvasElement;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  function resizeCanvas() {
    const header = canvas.parentElement;
    if (header && header.clientWidth > 0 && header.clientHeight > 0) {
      canvas.width = header.clientWidth;
      canvas.height = header.clientHeight;
    }
  }
  
  // Observer pour détecter les changements dans le DOM (fullscreen mode)
  const observer = new MutationObserver(() => {
    // Attendre que le DOM soit stable
    setTimeout(() => {
      resizeCanvas();
    }, 200);
  });
  
  // Observer les changements de classe sur le document
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['class'],
    subtree: true
  });
  
  // ResizeObserver pour surveiller spécifiquement le header
  const resizeObserver = new ResizeObserver(() => {
    setTimeout(resizeCanvas, 50);
  });
  
  if (canvas.parentElement) {
    resizeObserver.observe(canvas.parentElement);
  }
  
  window.addEventListener('resize', resizeCanvas);
  
  // Initialisation avec délais multiples pour s'assurer de la visibilité
  setTimeout(resizeCanvas, 100);
  setTimeout(resizeCanvas, 300);
  setTimeout(resizeCanvas, 500);
  resizeCanvas();
  
  const waveCount = 12;
  const maxCircleRadius = 1;
  const pointSpacing = 16;
  const waveSeparation = 24;
  const waveFrequency = 0.008;
  const waveAmplitude = 10;
  const lineOffset = 60;
  
  let time = 0;
  let animationId: number;
  
  function animate() {
    if (!canvas || !ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = mainColor;
    ctx.globalAlpha = 0.5;
    
    for (let i = 0; i < waveCount; i++) {
      const baseY = (canvas.height / 2) - (waveSeparation * waveCount / 2) + i * waveSeparation;
      const offsetX = i * lineOffset;
      
      for (let x = 0; x < canvas.width; x += pointSpacing) {
        const y = baseY + Math.sin((x + offsetX) * waveFrequency + time * 0.02) * waveAmplitude;
        ctx.beginPath();
        ctx.arc(x, y, maxCircleRadius, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
    
    ctx.globalAlpha = 1;
    time++;
    animationId = requestAnimationFrame(animate);
  }
  
  animate();
  
  // Retourner une fonction de nettoyage
  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    window.removeEventListener('resize', resizeCanvas);
    observer.disconnect();
    resizeObserver.disconnect();
  };
}

export function initStickySidebar(): (() => void) | undefined {
  
  // Attendre que React rende complètement
  setTimeout(() => {
    const sidebar = document.querySelector('.template-datalover .sidebar') as HTMLElement | null;
    const sidebarInner = document.querySelector('.template-datalover .sidebar-inner') as HTMLElement | null;
    
    
    if (!sidebar || !sidebarInner) {
      return;
    }
    
    function checkSticky() {
      // Vérifier mode desktop seulement
      if (window.innerWidth < 900) {
        sidebarInner.classList.remove('is-sticky');
        return;
      }
      
      const rect = sidebar.getBoundingClientRect();
      let shouldBeSticky = false;
      let stickyReason = '';
      
      // Détection pour fullscreen-preview
      const fullscreenContainer = document.querySelector('.fullscreen-preview') as HTMLElement | null;
      if (fullscreenContainer) {
        // En mode fullscreen, utiliser la détection viewport simple
        if (rect.top <= 20) {
          shouldBeSticky = true;
          stickyReason = `fullscreen viewport (rect.top: ${rect.top})`;
        }
      } else {
        // Détection pour normal-preview
        const normalPreviewContainer = document.querySelector('.normal-preview') as HTMLElement | null;
        if (normalPreviewContainer) {
          const normalPreviewRect = normalPreviewContainer.getBoundingClientRect();
          
          // Calculer la position relative dans le container de preview
          const sidebarTop = rect.top;
          const containerTop = normalPreviewRect.top;
          const relativePosition = sidebarTop - containerTop;
          
          
          // La sidebar doit être sticky quand elle atteint le haut du container de preview
          if (relativePosition <= 10 && containerTop >= 0) {
            shouldBeSticky = true;
            stickyReason = `preview container (relative: ${relativePosition})`;
          }
        } else {
          // Fallback - détection viewport classique
          if (rect.top <= 20) {
            shouldBeSticky = true;
            stickyReason = `viewport fallback (rect.top: ${rect.top})`;
          }
        }
      }
      
      if (shouldBeSticky) {
      }
      
      // Appliquer ou retirer la classe sticky
      if (shouldBeSticky) {
        if (!sidebarInner.classList.contains('is-sticky')) {
          sidebarInner.classList.add('is-sticky');
        }
      } else {
        if (sidebarInner.classList.contains('is-sticky')) {
          sidebarInner.classList.remove('is-sticky');
        }
      }
    }
    
    window.addEventListener('scroll', checkSticky);
    window.addEventListener('resize', checkSticky);
    
    // Écouter le scroll sur les containers de preview
    const normalPreviewContainer = document.querySelector('.normal-preview');
    const fullscreenContainer = document.querySelector('.fullscreen-preview');
    
    if (normalPreviewContainer) {
      normalPreviewContainer.addEventListener('scroll', checkSticky);
    }
    
    if (fullscreenContainer) {
      fullscreenContainer.addEventListener('scroll', checkSticky);
    }
    
    // Vérifications initiales avec délais
    checkSticky();
    setTimeout(checkSticky, 100);
    setTimeout(checkSticky, 500);
    
    
    return () => {
      window.removeEventListener('scroll', checkSticky);
      window.removeEventListener('resize', checkSticky);
      
      const normalPreview = document.querySelector('.normal-preview');
      const fullscreenPreview = document.querySelector('.fullscreen-preview');
      
      if (normalPreview) {
        normalPreview.removeEventListener('scroll', checkSticky);
      }
      if (fullscreenPreview) {
        fullscreenPreview.removeEventListener('scroll', checkSticky);
      }
      
      sidebarInner.classList.remove('is-sticky');
    };
    
  }, 500); // 500ms pour être sûr que React a rendu
  
  return undefined;
}