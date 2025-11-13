# Tutoriel : Configuration des sous-domaines dynamiques avec Cloudflare

Ce guide vous explique comment configurer Cloudflare pour permettre l'utilisation de sous-domaines dynamiques comme `username.brevy.me` pour les CV publiés.

## 📋 Prérequis

- Un compte Cloudflare avec le domaine `brevy.me` configuré
- Accès au DNS de Cloudflare
- Votre application backend déployée (ex: Render.com)

## 🎯 Objectif

Permettre à n'importe quel sous-domaine `*.brevy.me` de pointer vers votre application, afin que `username.brevy.me` fonctionne automatiquement.

---

## Étape 1 : Configuration DNS dans Cloudflare

### 1.1 Accéder à la configuration DNS

1. Connectez-vous à votre compte [Cloudflare](https://dash.cloudflare.com)
2. Sélectionnez le domaine `brevy.me`
3. Allez dans l'onglet **DNS** > **Records**

### 1.2 Créer un enregistrement Wildcard (A ou CNAME)

Vous avez deux options selon votre configuration :

#### Option A : Utiliser un CNAME (Recommandé si vous utilisez un CDN/proxy)

1. Cliquez sur **Add record**
2. Configurez :
   - **Type** : `CNAME`
   - **Name** : `*` (astérisque = wildcard pour tous les sous-domaines)
   - **Target** : `brevy.me` (ou votre domaine principal)
   - **Proxy status** : 🟠 **Proxied** (orange cloud) - **IMPORTANT pour SSL automatique**
   - **TTL** : Auto
3. Cliquez sur **Save**

#### Option B : Utiliser un A Record (Si vous avez une IP fixe)

1. Cliquez sur **Add record**
2. Configurez :
   - **Type** : `A`
   - **Name** : `*`
   - **IPv4 address** : L'IP de votre serveur backend (ex: IP de Render.com)
   - **Proxy status** : 🟠 **Proxied** (orange cloud)
   - **TTL** : Auto
3. Cliquez sur **Save**

### 1.3 Vérifier la configuration

Vous devriez voir un enregistrement comme :
```
Type: CNAME (ou A)
Name: *
Content: brevy.me (ou votre IP)
Proxy: Proxied (orange cloud)
```

---

## Étape 2 : Configuration SSL/TLS

### 2.1 Activer SSL automatique

1. Dans Cloudflare, allez dans **SSL/TLS**
2. Assurez-vous que le mode est sur **Full** ou **Full (strict)**
3. Activez **Always Use HTTPS** (optionnel mais recommandé)

### 2.2 Certificat Wildcard

Cloudflare génère automatiquement un certificat SSL wildcard pour `*.brevy.me` quand vous utilisez le proxy. Aucune action supplémentaire n'est nécessaire.

---

## Étape 3 : Configuration du Backend (Render.com)

### 3.1 Vérifier les Headers

Votre application doit être capable de détecter le sous-domaine depuis les headers HTTP. Cloudflare envoie automatiquement :

- `Host: username.brevy.me`
- `X-Forwarded-Host: username.brevy.me`
- `CF-Connecting-IP: [IP réelle]`

### 3.2 Vérifier le middleware existant

Votre code dans `server/index.ts` détecte déjà les sous-domaines :

```typescript
const originalHost = req.get('x-forwarded-host') || req.get('x-original-host') || req.get('host') || '';
```

Cela devrait fonctionner automatiquement avec Cloudflare.

---

## Étape 4 : Modifier le code pour utiliser les sous-domaines

Une fois Cloudflare configuré, vous pouvez modifier le code pour revenir aux sous-domaines.

### 4.1 Modifier `server/routes.ts`

Remplacez les URLs `/shared/username` par `username.brevy.me` :

```typescript
// Dans /api/publish-cv
return res.json({ 
  success: true, 
  subdomain: finalSubdomain,
  shareUrl: `https://${finalSubdomain}.brevy.me`,  // ← Modifier ici
  // ...
});

// Dans /api/publish-cv-custom
return res.json({
  shareUrl: `https://${cleanedSubdomain}.brevy.me`,  // ← Modifier ici
  url: `https://${cleanedSubdomain}.brevy.me`  // ← Modifier ici
});
```

### 4.2 Modifier les composants frontend

**`client/src/components/dashboard/publish-button.tsx`** :

```typescript
const copyUrl = async () => {
  const url = `https://${subdomain}.brevy.me`;  // ← Modifier
  // ...
};

const openCV = () => {
  const url = `https://${subdomain}.brevy.me`;  // ← Modifier
  window.open(url, '_blank');
};
```

**`client/src/components/dashboard/share-modal.tsx`** :

```typescript
const url = data.shareUrl || `https://${subdomain}.brevy.me`;  // ← Modifier
```

**`client/src/lib/pdf-generator-text.ts`** :

```typescript
const cvUrl = `https://${subdomain}.brevy.me`;  // ← Modifier
```

### 4.3 Mettre à jour les affichages

**`client/src/components/dashboard/publish-button.tsx`** :

```typescript
<Input 
  value={`${subdomain}.brevy.me`}  // ← Modifier
  // ...
/>
```

**`client/src/components/dashboard/share-modal.tsx`** :

```typescript
<div className="px-3 py-2 bg-gray-50 border-l text-sm text-gray-600 rounded-r-md">
  .brevy.me  // ← Modifier
</div>
```

---

## Étape 5 : Tester la configuration

### 5.1 Test DNS

```bash
# Tester que le wildcard fonctionne
dig any-test.brevy.me
# Devrait retourner l'IP de votre serveur ou le CNAME

# Tester un sous-domaine spécifique
dig username.brevy.me
```

### 5.2 Test depuis le navigateur

1. Créez un CV et publiez-le avec un sous-domaine (ex: `test123`)
2. Accédez à `https://test123.brevy.me`
3. Vérifiez que :
   - Le SSL fonctionne (cadenas vert)
   - La page du CV s'affiche correctement
   - Pas d'erreur DNS

### 5.3 Vérifier les logs

Dans votre backend, vérifiez que le middleware détecte bien le sous-domaine :

```typescript
console.log('Host:', req.get('host'));
console.log('X-Forwarded-Host:', req.get('x-forwarded-host'));
```

---

## 🔧 Dépannage

### Problème : "Ce site est inaccessible" ou erreur DNS

**Solutions** :
1. Vérifiez que l'enregistrement wildcard `*` existe dans Cloudflare DNS
2. Attendez 5-10 minutes pour la propagation DNS
3. Vérifiez que le proxy est activé (cloud orange)
4. Testez avec `dig` ou `nslookup`

### Problème : Erreur SSL "Not Secure"

**Solutions** :
1. Vérifiez que le proxy Cloudflare est activé (cloud orange)
2. Allez dans SSL/TLS > Mode : **Full** ou **Full (strict)**
3. Attendez quelques minutes pour la génération du certificat

### Problème : Le sous-domaine ne redirige pas vers le bon CV

**Solutions** :
1. Vérifiez les logs backend pour voir quel host est reçu
2. Vérifiez que le middleware dans `server/index.ts` détecte bien le sous-domaine
3. Testez avec `curl -H "Host: username.brevy.me" https://brevy.me`

### Problème : Erreur 502 Bad Gateway

**Solutions** :
1. Vérifiez que votre backend est accessible
2. Vérifiez les règles de Page Rules dans Cloudflare
3. Vérifiez que votre backend accepte les requêtes avec différents Host headers

---

## 📝 Notes importantes

1. **Propagation DNS** : Les changements DNS peuvent prendre jusqu'à 24h, mais généralement 5-10 minutes avec Cloudflare
2. **Limite de sous-domaines** : Cloudflare ne limite pas le nombre de sous-domaines avec un wildcard
3. **SSL automatique** : Cloudflare génère automatiquement des certificats SSL pour tous les sous-domaines
4. **Performance** : Le proxy Cloudflare peut améliorer les performances grâce au CDN

---

## 🚀 Alternative : Configuration avec Page Rules (Optionnel)

Si vous avez besoin de règles spécifiques pour certains sous-domaines :

1. Allez dans **Rules** > **Page Rules**
2. Créez une règle :
   - **URL** : `*username.brevy.me/*`
   - **Settings** : Configurez selon vos besoins

---

## ✅ Checklist finale

- [ ] Enregistrement DNS wildcard `*` créé dans Cloudflare
- [ ] Proxy Cloudflare activé (cloud orange)
- [ ] SSL/TLS en mode Full ou Full (strict)
- [ ] Code backend modifié pour utiliser `username.brevy.me`
- [ ] Code frontend modifié pour générer les bonnes URLs
- [ ] Test réussi avec un sous-domaine de test
- [ ] SSL fonctionne sur le sous-domaine de test

---

## 📚 Ressources

- [Documentation Cloudflare DNS](https://developers.cloudflare.com/dns/)
- [Documentation Cloudflare SSL](https://developers.cloudflare.com/ssl/)
- [Wildcard DNS avec Cloudflare](https://developers.cloudflare.com/dns/manage-dns-records/reference/wildcard-dns-records/)

---

**Une fois la configuration Cloudflare terminée, vous pouvez modifier le code pour revenir aux sous-domaines `username.brevy.me` au lieu de `/shared/username`.**

