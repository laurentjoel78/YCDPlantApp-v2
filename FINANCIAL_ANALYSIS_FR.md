# YCD Farmer Guide - Document Financier Complet

## Analyse des coûts et risques pour le propriétaire du projet

**Date:** Janvier 2025  
**Taux de change:** 1 USD = 600 FCFA

---

## ⚠️ AVERTISSEMENT CRITIQUE - BASE DE DONNÉES NEON

**IMPORTANT:** Durant la phase de test avec très peu d'utilisateurs, la base de données Neon a débordé ses quotas gratuits, nécessitant la création d'un nouveau déploiement. Ceci est un risque majeur à surveiller.

### Pourquoi Neon peut déborder rapidement:

- **Facturation basée sur l'utilisation** (compute-hours), pas seulement le stockage
- Chaque requête à la base consomme des "compute units"
- Les connexions persistantes (WebSockets, polling) consomment en continu
- Le démarrage à froid (cold start) consomme des ressources à chaque réveil

### Recommandation:

- **Surveillez le dashboard Neon QUOTIDIENNEMENT pendant les tests**
- Prévoyez une migration vers un plan payant dès le lancement
- Budget recommandé: **10-25 USD/mois (6,000 - 15,000 FCFA)** pour la base de données seule

---

## 📊 RÉSUMÉ EXÉCUTIF

| Phase                           | Coût Mensuel USD | Coût Mensuel FCFA | Risque                |
| ------------------------------- | ---------------- | ----------------- | --------------------- |
| **Test/Développement**          | 0 - 10$          | 0 - 6,000         | ⚠️ Neon peut déborder |
| **Lancement (1-100 users)**     | 15 - 35$         | 9,000 - 21,000    | Moyen                 |
| **Croissance (100-1000 users)** | 50 - 100$        | 30,000 - 60,000   | Faible                |
| **Production (1000+ users)**    | 150 - 300$       | 90,000 - 180,000  | Faible                |

---

## 💰 DÉTAIL DES SERVICES ET COÛTS

### 1. HÉBERGEMENT BACKEND - Railway

| Plan              | Coût     | Limite                     | Statut                  |
| ----------------- | -------- | -------------------------- | ----------------------- |
| Starter (Gratuit) | 0$       | 500 heures/mois, 512MB RAM | ✅ Actuel               |
| Hobby             | 5$/mois  | Pas de limite horaire      | Recommandé au lancement |
| Pro               | 20$/mois | Ressources dédiées         | Pour production         |

**Note:** Railway facture 0.000231$/min au-delà du gratuit. Surveillez l'utilisation.

---

### 2. BASE DE DONNÉES - Neon PostgreSQL ⚠️ PRIORITÉ HAUTE

| Plan              | Stockage | Compute                | Coût     |
| ----------------- | -------- | ---------------------- | -------- |
| **Free (Actuel)** | 0.5 GB   | 100 compute-hours/mois | 0$       |
| Launch            | 10 GB    | 300 compute-hours      | 19$/mois |
| Scale             | 50 GB    | 750 compute-hours      | 69$/mois |

**⚠️ ATTENTION:**

- Votre utilisation actuelle: **8.97 MB / 500 MB** (stockage OK)
- Le problème est les **compute-hours**, pas le stockage
- Avec polling fréquent ou WebSockets actifs, vous pouvez épuiser 100 heures en quelques jours

**Action requise:** Migrer vers plan Launch (19$/mois = 11,400 FCFA) dès que l'app est en production.

---

### 3. INTELLIGENCE ARTIFICIELLE - Groq

| Service                  | Coût        | Limite Free Tier     |
| ------------------------ | ----------- | -------------------- |
| LLM (llama-3.1-8b)       | **GRATUIT** | 14,400 requêtes/jour |
| Voice (whisper-large-v3) | **GRATUIT** | 20 requêtes/minute   |

✅ **Aucun coût prévu** - Les limites gratuites sont très généreuses.

---

### 4. STOCKAGE D'IMAGES - Cloudinary

| Plan              | Stockage | Transformations | Coût     |
| ----------------- | -------- | --------------- | -------- |
| **Free (Actuel)** | 25 GB    | 25,000/mois     | 0$       |
| Plus              | 225 GB   | 225,000/mois    | 89$/mois |

✅ **Suffisant pour le démarrage** - Surveillez si beaucoup de photos de maladies sont uploadées.

---

### 5. SERVICE EMAIL - Brevo

| Plan              | Emails/jour | Coût     |
| ----------------- | ----------- | -------- |
| **Free (Actuel)** | 300/jour    | 0$       |
| Starter           | 5,000/jour  | 25$/mois |

✅ **Suffisant** sauf si vous envoyez des newsletters de masse.

---

### 6. API MÉTÉO - WeatherAPI

| Plan              | Requêtes | Coût |
| ----------------- | -------- | ---- |
| **Free (Actuel)** | 1M/mois  | 0$   |

✅ **Largement suffisant** pour des milliers d'utilisateurs.

---

### 7. BUILDS MOBILE - Expo EAS

| Plan       | Builds          | Coût     |
| ---------- | --------------- | -------- |
| **Free**   | 30 builds/mois  | 0$       |
| Production | 300 builds/mois | 99$/mois |

✅ **Suffisant pour le démarrage** - Ne fait pas des builds tous les jours.

---

## 📅 PROJECTION DES COÛTS PAR PHASE

### Phase 1: Test et Développement (Maintenant)

```
Coût cible: 0 FCFA/mois
Risque: ÉLEVÉ (Neon peut déborder)

Services:
- Railway: GRATUIT
- Neon: GRATUIT (⚠️ SURVEILLER)
- Groq: GRATUIT
- Cloudinary: GRATUIT
- Brevo: GRATUIT
- Weather: GRATUIT

TOTAL: 0 FCFA (mais prévoir 12,000 FCFA de réserve pour Neon)
```

### Phase 2: Lancement (1-100 utilisateurs)

```
Coût estimé: 15,000 - 25,000 FCFA/mois

Services:
- Railway Hobby: 5$ = 3,000 FCFA
- Neon Launch: 19$ = 11,400 FCFA ⬅️ NÉCESSAIRE
- Groq: GRATUIT
- Cloudinary: GRATUIT
- Brevo: GRATUIT
- Weather: GRATUIT

TOTAL: 24$ = ~14,400 FCFA/mois
```

### Phase 3: Croissance (100-1000 utilisateurs)

```
Coût estimé: 40,000 - 70,000 FCFA/mois

Services:
- Railway Pro: 20$ = 12,000 FCFA
- Neon Scale: 69$ = 41,400 FCFA
- Groq: GRATUIT
- Cloudinary: Possible upgrade
- Brevo: Possible upgrade

TOTAL: ~90$ = ~54,000 FCFA/mois
```

### Phase 4: Production à grande échelle (1000+ utilisateurs)

```
Coût estimé: 150,000 - 250,000 FCFA/mois

- Infrastructure dédiée nécessaire
- Possibilité de négocier des tarifs entreprise
- Considérer un hébergement local au Cameroun
```

---

## 🚨 RISQUES ET MITIGATION

### Risque 1: Débordement Neon (ÉLEVÉ)

- **Impact:** App inaccessible, perte de données potentielle
- **Mitigation:** Surveiller quotidiennement, prévoir budget de 19$/mois
- **Action immédiate:** Configurer des alertes email sur Neon dashboard

### Risque 2: Épuisement Railway gratuit (MOYEN)

- **Impact:** App down après 500 heures
- **Mitigation:** Passer au plan Hobby (5$/mois) dès les premiers vrais utilisateurs

### Risque 3: Cloudinary quota (FAIBLE)

- **Impact:** Impossible d'uploader de nouvelles images
- **Mitigation:** Compresser les images côté client, nettoyer les images inutilisées

---

## ✅ RECOMMANDATIONS FINALES

### Pour le propriétaire du projet:

1. **IMMÉDIAT (0 FCFA):**
   - [ ] Créer un compte Neon et configurer des alertes d'utilisation
   - [ ] Surveiller le dashboard Neon CHAQUE JOUR pendant les tests
   - [ ] Ne pas lancer de tests de charge sans monitoring

2. **AU LANCEMENT (15,000 FCFA/mois minimum):**
   - [ ] Upgrader Neon vers Launch (19$/mois)
   - [ ] Upgrader Railway vers Hobby (5$/mois)
   - [ ] Total: ~24$/mois = 14,400 FCFA/mois

3. **BUDGET ANNUEL RECOMMANDÉ:**
   - Année 1 (test + lancement): **200,000 - 400,000 FCFA**
   - Année 2 (croissance): **600,000 - 1,000,000 FCFA**

---

## 📞 CONTACTS SUPPORT

- **Railway:** support@railway.app
- **Neon:** support@neon.tech
- **Groq:** console.groq.com
- **Cloudinary:** support.cloudinary.com
- **Brevo:** contact@brevo.com

---

_Document généré le: Janvier 2025_
_Pour toute question, contacter l'équipe de développement_
