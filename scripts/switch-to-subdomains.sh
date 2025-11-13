#!/bin/bash

# Script pour basculer de /shared/username vers username.brevy.me
# À utiliser APRÈS avoir configuré Cloudflare avec wildcard DNS

echo "🔄 Basculement vers les sous-domaines username.brevy.me..."
echo ""
echo "⚠️  ATTENTION: Assurez-vous d'avoir configuré Cloudflare avec un wildcard DNS (*.brevy.me)"
echo "   Voir CLOUDFLARE_SUBDOMAIN_SETUP.md pour les instructions"
echo ""
read -p "Continuer? (y/n) " -n 1 -r
echo ""
if [[ ! $REPO =~ ^[Yy]$ ]]
then
    exit 1
fi

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Modification des fichiers...${NC}"

# 1. server/routes.ts
echo "📝 Modifying server/routes.ts..."
sed -i.bak 's|shareUrl: `${baseUrl}/shared/${finalSubdomain}`|shareUrl: `https://${finalSubdomain}.brevy.me`|g' server/routes.ts
sed -i.bak 's|shareUrl: `${baseUrl}/shared/${cleanedSubdomain}`|shareUrl: `https://${cleanedSubdomain}.brevy.me`|g' server/routes.ts
sed -i.bak 's|url: `${baseUrl}/shared/${cleanedSubdomain}`|url: `https://${cleanedSubdomain}.brevy.me`|g' server/routes.ts
sed -i.bak 's|Lien : ${baseUrl}/shared/${finalSubdomain}|Lien : https://${finalSubdomain}.brevy.me|g' server/routes.ts
sed -i.bak 's|available at ${baseUrl}/shared/${cleanedSubdomain}|available at https://${cleanedSubdomain}.brevy.me|g' server/routes.ts

# 2. client/src/components/dashboard/publish-button.tsx
echo "📝 Modifying publish-button.tsx..."
sed -i.bak 's|const url = `${baseUrl}/shared/${subdomain}`|const url = `https://${subdomain}.brevy.me`|g' client/src/components/dashboard/publish-button.tsx
sed -i.bak 's|: `/shared/${subdomain}`|: `https://${subdomain}.brevy.me`|g' client/src/components/dashboard/publish-button.tsx
sed -i.bak 's|value={`brevy.me/shared/${subdomain}`}|value={`${subdomain}.brevy.me`}|g' client/src/components/dashboard/publish-button.tsx

# 3. client/src/components/dashboard/share-modal.tsx
echo "📝 Modifying share-modal.tsx..."
sed -i.bak 's|const url = data.shareUrl || `${baseUrl}/shared/${subdomain}`|const url = data.shareUrl || `https://${subdomain}.brevy.me`|g' client/src/components/dashboard/share-modal.tsx
sed -i.bak 's|/shared/|.brevy.me|g' client/src/components/dashboard/share-modal.tsx

# 4. client/src/lib/pdf-generator-text.ts
echo "📝 Modifying pdf-generator-text.ts..."
sed -i.bak 's|const cvUrl = `${baseUrl}/shared/${subdomain}`|const cvUrl = `https://${subdomain}.brevy.me`|g' client/src/lib/pdf-generator-text.ts

# 5. client/src/components/dashboard/subdomain-conflict-modal.tsx
echo "📝 Modifying subdomain-conflict-modal.tsx..."
sed -i.bak 's|brevy.me/shared/{suggestedSubdomain}|${suggestedSubdomain}.brevy.me|g' client/src/components/dashboard/subdomain-conflict-modal.tsx

# 6. client/src/pages/blog-article-2.tsx
echo "📝 Modifying blog-article-2.tsx..."
sed -i.bak 's|brevy.me/shared/votre-nom|votre-nom.brevy.me|g' client/src/pages/blog-article-2.tsx
sed -i.bak 's|brevy.me/shared/your-name|your-name.brevy.me|g' client/src/pages/blog-article-2.tsx

# Nettoyer les fichiers de backup
echo "🧹 Cleaning backup files..."
find . -name "*.bak" -type f -delete

echo ""
echo -e "${GREEN}✅ Basculement terminé!${NC}"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Vérifiez les modifications avec: git diff"
echo "2. Testez localement"
echo "3. Commit et push: git add -A && git commit -m 'Switch to subdomain.brevy.me URLs' && git push"
echo ""
echo "⚠️  N'oubliez pas de configurer Cloudflare DNS avec wildcard (*) avant de déployer!"

