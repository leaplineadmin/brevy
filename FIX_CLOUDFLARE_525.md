# 🔧 Fix Cloudflare Error 525 - SSL Handshake Failed

L'erreur 525 signifie que Cloudflare ne peut pas établir une connexion SSL avec votre serveur d'origine (backend).

## 🔍 Diagnostic

- ✅ DNS fonctionne (Cloudflare résout le domaine)
- ✅ Cloudflare fonctionne
- ❌ Connexion SSL entre Cloudflare et le backend échoue

## 🛠️ Solutions

### Solution 1 : Vérifier le mode SSL/TLS dans Cloudflare (LE PLUS IMPORTANT)

1. Allez dans Cloudflare Dashboard
2. Sélectionnez le domaine `brevy.me`
3. Allez dans **SSL/TLS** > **Overview**
4. Vérifiez le mode SSL :

   **Options possibles :**
   - ❌ **Off** : Ne fonctionnera pas
   - ❌ **Flexible** : Cloudflare → Visiteur en HTTPS, mais Cloudflare → Backend en HTTP (peut causer des problèmes)
   - ✅ **Full** : Cloudflare → Backend en HTTPS (certificat auto-signé accepté)
   - ✅ **Full (strict)** : Cloudflare → Backend en HTTPS (certificat valide requis)

5. **Changez le mode en "Full"** (recommandé pour commencer)
   - Si votre backend (Render.com) a un certificat SSL valide, utilisez "Full (strict)"
   - Si le certificat est auto-signé ou invalide, utilisez "Full"

### Solution 2 : Vérifier que Render.com accepte HTTPS

Render.com fournit automatiquement HTTPS pour tous les services. Vérifiez :

1. Votre service Render est bien déployé
2. L'URL Render est accessible en HTTPS : `https://cvfolio.onrender.com`
3. Le certificat SSL de Render est valide

### Solution 3 : Vérifier la configuration du backend

Assurez-vous que votre backend écoute bien sur le port HTTPS et accepte les connexions SSL.

### Solution 4 : Vérifier les Page Rules dans Cloudflare

1. Allez dans **Rules** > **Page Rules**
2. Vérifiez qu'il n'y a pas de règles qui bloquent les sous-domaines
3. Si nécessaire, créez une règle pour les sous-domaines :
   - **URL** : `*.brevy.me/*`
   - **Settings** : SSL: Full

## 🎯 Solution rapide (à essayer en premier)

1. **Cloudflare Dashboard** → `brevy.me` → **SSL/TLS** → **Overview**
2. Changez le mode de **Flexible** à **Full**
3. Attendez 1-2 minutes
4. Testez à nouveau `https://username.brevy.me`

## 📝 Configuration recommandée pour Render.com

Si vous utilisez Render.com comme backend :

- **Mode SSL/TLS** : **Full** (ou **Full (strict)** si Render a un certificat valide)
- **Always Use HTTPS** : Activé (dans SSL/TLS > Edge Certificates)
- **Minimum TLS Version** : TLS 1.2 (recommandé)

## 🔍 Vérification

Après avoir changé le mode SSL :

1. Attendez 1-2 minutes
2. Testez : `https://username.brevy.me`
3. Si ça ne fonctionne toujours pas, vérifiez les logs Render.com

## ⚠️ Note importante

Si vous utilisez **Full (strict)** et que ça ne fonctionne pas, passez temporairement à **Full** pour voir si c'est un problème de certificat.

---

**La cause la plus fréquente de l'erreur 525 est un mode SSL/TLS incorrect dans Cloudflare.**

