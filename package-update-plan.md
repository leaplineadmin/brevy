# Plan de mise à jour et d'optimisation des dépendances

## Dépendances lourdes identifiées (à optimiser avec code splitting)

1. **html2pdf.js** (0.10.3) - ~500KB - Utilisé uniquement pour l'export PDF
2. **jspdf** (via html2pdf) - ~200KB - Utilisé uniquement pour l'export PDF  
3. **framer-motion** (11.13.1) - ~300KB - Utilisé pour les animations
4. **@radix-ui/* ** - ~50KB chacun - Beaucoup de composants UI

## Dépendances obsolètes à mettre à jour

### Majeures (breaking changes possibles)
- @hookform/resolvers: 3.9.1 → 5.2.2
- @stripe/react-stripe-js: 3.9.0 → 5.2.0
- @stripe/stripe-js: 6.1.0 → 8.1.0
- react: 18.3.1 → 19.2.0
- react-dom: 18.3.1 → 19.2.0
- @types/react: 18.3.12 → 19.2.2
- @types/react-dom: 18.3.1 → 19.2.2
- tailwindcss: 3.4.14 → 4.1.16
- zod: 3.23.8 → 4.1.12

### Mineures (sécurisées)
- Tous les @radix-ui/* vers dernières versions
- @tanstack/react-query: 5.60.5 → 5.90.5
- lucide-react: 0.453.0 → 0.548.0
- framer-motion: 11.13.1 → 12.23.24

## Stratégie d'optimisation

1. **Code Splitting pour PDF** : Charger html2pdf.js et jspdf uniquement au clic
2. **Lazy Loading des pages** : React.lazy() pour toutes les pages
3. **Tree Shaking** : Optimiser les imports Radix UI
4. **Mise à jour progressive** : Commencer par les dépendances mineures
