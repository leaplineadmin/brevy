# Dépannage : Sous-domaines username.brevy.me

## 🔍 Vérifications immédiates

### 1. Vérifier la propagation DNS

```bash
# Vérifier que le wildcard DNS fonctionne
dig test123.brevy.me

# Vérifier le CNAME wildcard
dig *.brevy.me CNAME

# Vérifier avec nslookup
nslookup test123.brevy.me
```

**Résultat attendu** : Le DNS devrait pointer vers `brevy.me` (CNAME) ou votre IP.

### 2. Vérifier la configuration Cloudflare

Dans Cloudflare Dashboard :
- [ ] L'enregistrement `*` (wildcard) existe dans DNS
- [ ] Le type est `CNAME` pointant vers `brevy.me`
- [ ] Le proxy est activé (cloud orange 🟠)
- [ ] SSL/TLS est en mode **Full** ou **Full (strict)**

### 3. Vérifier les logs backend

Vérifiez que votre backend reçoit bien les requêtes avec le bon Host header.

---

## ⏱️ Temps de propagation

- **Cloudflare** : Généralement 5-10 minutes
- **DNS global** : Peut prendre jusqu'à 24h (rare)
- **SSL wildcard** : Généré automatiquement, quelques minutes

**Conseil** : Attendez 10-15 minutes après la configuration, puis testez à nouveau.

---

## 🔧 Solutions aux problèmes courants

### Problème : ERR_NAME_NOT_RESOLVED

**Causes possibles** :
1. Propagation DNS pas encore terminée
2. Enregistrement wildcard mal configuré
3. Proxy Cloudflare désactivé

**Solutions** :

1. **Vérifier dans Cloudflare** :
   ```
   DNS > Records
   - Type: CNAME
   - Name: *
   - Target: brevy.me
   - Proxy: 🟠 Proxied (IMPORTANT!)
   ```

2. **Attendre la propagation** :
   ```bash
   # Tester toutes les 5 minutes
   dig test123.brevy.me
   ```

3. **Vider le cache DNS local** :
   ```bash
   # macOS
   sudo dscacheutil -flushcache
   sudo killall -HUP mDNSResponder
   
   # Windows
   ipconfig /flushdns
   
   # Linux
   sudo systemd-resolve --flush-caches
   ```

### Problème : SSL "Not Secure" ou erreur de certificat

**Solutions** :
1. Vérifier que le proxy Cloudflare est activé (cloud orange)
2. Aller dans SSL/TLS > Mode : **Full** ou **Full (strict)**
3. Attendre 5-10 minutes pour la génération du certificat wildcard

### Problème : Le sous-domaine se résout mais erreur 502/503

**Causes** :
- Le backend ne reçoit pas correctement les requêtes
- Le middleware ne détecte pas le sous-domaine

**Solutions** :

1. **Vérifier les headers reçus** :
   Ajoutez temporairement dans `server/index.ts` :
   ```typescript
   console.log('Host:', req.get('host'));
   console.log('X-Forwarded-Host:', req.get('x-forwarded-host'));
   console.log('X-Original-Host:', req.get('x-original-host'));
   ```

2. **Vérifier le middleware** :
   Le middleware dans `server/index.ts` devrait détecter :
   ```typescript
   if (host.includes('.brevy.me') && !host.startsWith('www.')) {
     detectedSubdomain = host.split('.')[0];
   }
   ```

3. **Tester avec curl** :
   ```bash
   curl -H "Host: test123.brevy.me" https://brevy.me
   ```

---

## ✅ Checklist de vérification

- [ ] Enregistrement DNS wildcard `*` créé dans Cloudflare
- [ ] Proxy Cloudflare activé (cloud orange)
- [ ] SSL/TLS en mode Full ou Full (strict)
- [ ] Attendu 10-15 minutes après configuration
- [ ] Testé avec `dig test123.brevy.me` (retourne une réponse)
- [ ] Vérifié les logs backend pour voir les headers reçus
- [ ] Testé avec un sous-domaine réel depuis le dashboard

---

## 🧪 Test rapide

1. **Créer un CV de test** dans votre dashboard
2. **Publier avec un sous-domaine** (ex: `test123`)
3. **Attendre 10-15 minutes**
4. **Tester** : `https://test123.brevy.me`

Si ça ne fonctionne toujours pas après 15 minutes :
- Vérifiez les logs backend
- Vérifiez la configuration Cloudflare
- Testez avec `dig` pour voir si le DNS se résout

---

## 📞 Support

Si le problème persiste après 30 minutes :
1. Vérifiez les logs backend (Render.com)
2. Vérifiez les logs Cloudflare (Analytics > Logs)
3. Testez avec différents sous-domaines
4. Vérifiez que votre backend accepte les requêtes avec différents Host headers

