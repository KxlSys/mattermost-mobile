# BokengiGp Mobile — Freeze 2026-10-28

Statut : **FROZEN / PAUSED**

Motif : publication différée, en attente du budget nécessaire aux comptes de distribution
(Apple Developer Program, Google Play Console).

## Projet

| Élément | Valeur |
|---|---|
| Dépôt | https://github.com/KxlSys/mattermost-mobile (fork de https://github.com/mattermost/mattermost-mobile) |
| Branche de référence | `rebrand/bokengigp` |
| Commit exact | `0db4985d42381a4126a267b2c17d4167d9b92f2e` |
| Tag | `bokengigp-mobile-freeze-2026-10-28` (annoté, pointe sur `0db4985d42381a4126a267b2c17d4167d9b92f2e`) |
| Date du freeze | 2026-10-28 |
| Base amont | `v2.45.1` (`35cf638d988fc96c5981f35d08401a430ce826af`) |
| Version / build | 2.45.1 / 832 |
| Branche de ce document | `docs/bokengigp-freeze-2026-10-28` (enfant direct de `0db4985`, documentation seule) |

Historique au-dessus de `v2.45.1` :

| Commit | Objet |
|---|---|
| `2536a84ad6b4c06a00b7a8c2cba17f029b1e3539` | fix(media): high-res gallery images, authenticated video streaming, and adaptive chat contentFit |
| `97b7afb3a5b5fb3281457b114754f2f853bbbe67` | fix(media): scope HD url strictly to useImageAttachments and optimize auth header freshness |
| `bc00526e60ce7d27d86d0c03cad18b426b4da915` | test(media): add explicit contract tests for P0.1 gallery/chat and P0.2 video authentication |
| `a6707de0f32f146958b8c6cf01209756ffd5fc81` | feat(branding): rebrand mobile app as BokengiGp |
| `697e2614ffd55f61121f5f04cd1a15b2e2f1b331` | fix(branding): remove remaining Mattermost splash visuals |
| `0db4985d42381a4126a267b2c17d4167d9b92f2e` | fix(branding): replace remaining Mattermost CallKit icon |

Branches associées (état au freeze, non modifiées) :

| Branche | Commit | Rôle |
|---|---|---|
| `rebrand/bokengigp` | `0db4985d42381a4126a267b2c17d4167d9b92f2e` | référence BokengiGp (média + branding) |
| `fix/mobile-media-rendering-p0-p2` | `bc00526e60ce7d27d86d0c03cad18b426b4da915` | correctifs média seuls |
| `ci/ios-unsigned-validation` | `f73630fbd30e847215b08fb619efaba40bef739e` | workflow IPA unsigned sur la branche média |
| `ci/ios-bokengigp-validation` | `b63ec51f2b4209d3fd358e163cde9e10edd1cdee` | workflow IPA unsigned sur `rebrand/bokengigp` |
| `main` | `39272432327c8ce7c8bf074f86db656ca9be4b20` | miroir amont, non modifié |

## Branding

- Nom visible : **BokengiGp** (Android `app_name`, iOS `CFBundleDisplayName`, extension de partage iOS).
- Source officielle du logo : marque vectorielle Bokengi Group `public/bokengi-bimi.svg` (blob `7fdc3e9`)
  du site Bokengi Group.
- Commit de rebranding : `a6707de` — icônes launcher iOS/Android, logos de splash, silhouette de
  notification Android, logos in-app (`logo.png`, `logo_white.png`, `icon.png`), chaînes en/fr,
  composant `BrandLogo` utilisé par l'écran À propos et `SystemAvatar`, `APP_NAME` par défaut
  `BokengiGp` dans les lanes unsigned. Les mentions de licence et d'attribution Mattermost sont conservées.
- Splash corrigé : `697e261` — fonds de splash unis `#FFFFFF` (clair) / `#090A0B` (sombre), mêmes noms,
  dimensions et formats.
- CallKit corrigé : `0db4985` — `MMCallKitIcon` @1x/@2x/@3x (40/80/120 px, RGBA, template blanc)
  remplacé par la silhouette BokengiGp.
- Garde-fou : `test/branding.test.ts`.
- Inchangés : bundle IDs (`com.mattermost.rnbeta`), applicationId, App Groups
  (`group.com.mattermost.rnbeta`), keychain groups, schemes (`mattermost`, `mmauthbeta`), User-Agent,
  endpoints `/api/v4`.

## Media

- P0.1 : la galerie plein écran charge l'image originale HD ; l'URL HD est limitée à
  `useImageAttachments` (`app/hooks/files.ts`).
- P0.2 : lecture vidéo authentifiée — en-tête `Authorization` ajouté uniquement quand l'URL vidéo est
  same-origin avec le serveur (`shouldAttachServerAuthHeaders`, `getVideoSource` dans
  `app/screens/gallery/renderers/video/video_renderer.tsx`), avec rafraîchissement du jeton.
- Protection contre la fuite du header Bearer : aucun en-tête d'authentification envoyé vers une
  origine tierce.
- P2 : `contentFit` adaptatif des images dans le fil (`app/components/files/file.tsx`,
  `image_file.tsx`), pour éviter un recadrage inutile des images HD.
- Tests média : 49/49.
- TypeScript : 0 erreur.
- ESLint : 0 erreur.

## Android

Build : `fastlane android unsigned` avec `BETA_BUILD=true`, sur le commit `697e261`, signée avec la clé
**debug** (certificat `CN=QA Team, O=Mattermost Inc.`, SHA-256
`1431eedaa27b30fd846283f083e52a5fa40c0261e1a039a337a37174d699e750`), jamais une clé de production.
Entre `697e261` et `0db4985`, seuls les PNG CallKit iOS et `test/branding.test.ts` changent : le
contenu Android est identique au commit de référence.

Contrôles statiques : package `com.mattermost.rnbeta`, versionCode 832, versionName 2.45.1,
targetSdk 36, label `BokengiGp`, `apksigner verify` OK, `zipalign` OK.

Validation sur appareil réel (AWS Device Farm), résultats observés et rapportés par l'opérateur :

| Test | Résultat |
|---|---|
| Installation | OK |
| Lancement | OK |
| Connexion à https://chat.bokengi-group.com | OK |
| Affichage d'une image | OK |
| Ouverture plein écran | OK |
| Rendu réel de l'image | OK |
| Vidéo / lecture vidéo | **non validé** (non testé) |
| Notifications | **non validé** (non testé) |

## iOS

Build : workflow `build-ios-unsigned-validation` (branche `ci/ios-bokengigp-validation`), run
https://github.com/KxlSys/mattermost-mobile/actions/runs/40709385340 tentative 3, commit
`0db4985d42381a4126a267b2c17d4167d9b92f2e`, Xcode 26.6, non signée.

Inspection statique de l'IPA : `CFBundleDisplayName` BokengiGp, 2.45.1 (832), `com.mattermost.rnbeta`,
aucune signature ; icônes, splash clair/sombre, logos et icône CallKit identiques pixel pour pixel
aux sources du commit ; aucun visuel de branding Mattermost.

Validation sur appareil (AWS Device Farm, appareil iOS public), résultats rapportés par l'opérateur :

- IPA installée avec succès.
- Branding visible validé.
- Limitation observée : `App database not found.`
- Cause identifiée : la re-signature par AWS Public Device Farm supprime les entitlements / l'App Group
  nécessaires au stockage local iOS.
- **Ce résultat ne constitue PAS une validation fonctionnelle iOS complète.**
- Aucune modification de code n'a été faite pour contourner cette limitation.

## Artefacts

Les binaires ne sont pas versionnés dans Git. SHA-256 calculés sur les fichiers locaux le 2026-10-28.

| Fichier | Taille (octets) | SHA-256 | Commit source | Type |
|---|---|---|---|---|
| `BokengiGp-697e261-debugsigned.apk` | 245847241 | `a0ff57efcd288b2fe615c8d381677a1052d6868a68f1409a71265e2c42c99673` | `697e261` | Android, debug-signed (installable) |
| `BokengiGp-697e261-unsigned.apk` | 245692902 | `0846719d0102e7c2aeb4cdfc294e0f1c5f3fdf23927d0490aafa25d08b14418c` | `697e261` | Android, unsigned |
| `mattermost-ios-unsigned-0db4985d42381a4126a267b2c17d4167d9b92f2e.zip` | 78745368 | `d8908c3c3e4b9615a8ac73bb2f390bd1f8fb067ec144785ac6944b68ee1fa1b2` | `0db4985` | artefact GitHub Actions (contient les 4 fichiers ci-dessous) |
| `Mattermost-unsigned.ipa` | 40182564 | `04da15bbdff1e227a8c42b26aeb0a0372edf8cf31bc2d873f22e0a665273cb4c` | `0db4985` | iOS, unsigned |
| `Mattermost-unsigned-sideload.ipa` | 40188404 | `f4037ca46e2aaff137908ab73ff9cdbec89dabec852305944e662f9722ac4b06` | `0db4985` | iOS, unsigned, structure `Payload/` (sideload) |
| `SHA256SUMS.txt` | 189 | `f31dbef78f61f8d88928ac137fcca68d84868ab2b77cf263290c2f20ec28c200` | `0db4985` | sommes des IPA |
| `build-info.txt` | 444 | `4ec77970044af7718faf6f3bfb9f32238c940c573641e9216daa2b09bf682b87` | `0db4985` | toolchain et métadonnées du build |

Emplacements au freeze : PC de développement `C:\Users\Kalel DAMBA\Downloads\BokengiGp\` (tous) ; les
APK aussi sur l'hôte de build `builds/` du workspace ; l'artefact GitHub Actions expire selon la
rétention du dépôt. Sauvegarde distante prévue : GitHub Release du tag
`bokengigp-mobile-freeze-2026-10-28`.

## Distribution future

iOS : Apple Developer Program → build iOS signée → TestFlight → validation → App Store.

Android : Google Play Console → build release → publication.

## À reprendre

- Apple Developer Program nécessaire pour TestFlight / App Store.
- Google Play Console nécessaire pour la distribution publique Android (et une clé de signature
  release, qui n'existe pas encore : les APK actuels sont signés debug).
- App Store Connect n'était pas encore activé.
- AWS Public Device Farm iOS ne convient pas pour tester la fonctionnalité complète, à cause de la
  re-signature AWS.
- Un appareil iOS privé AWS serait une alternative technique, mais n'est pas requis pour reprendre le
  projet.
- Ne pas supprimer les App Groups existants pour contourner AWS.
- Conserver les entitlements iOS actuels.
- Tests terrain encore à faire : vidéo et notifications (Android et iOS), SSO, CallKit, extension de
  partage (iOS, sur build correctement signée).
- Polish textuel optionnel : les `NS*UsageDescription` de `ios/Mattermost/Info.plist` contiennent encore
  « Mattermost » (texte des demandes d'autorisation iOS, aucun visuel).
- Le workflow `ci/ios-bokengigp-validation` a `source_sha` par défaut sur `697e261` : saisir le SHA
  voulu à chaque lancement.

### Procédure de reprise

```sh
git clone https://github.com/KxlSys/mattermost-mobile.git
cd mattermost-mobile
git fetch origin --tags
git switch -c resume/bokengigp bokengigp-mobile-freeze-2026-10-28
git rev-parse HEAD   # doit afficher 0db4985d42381a4126a267b2c17d4167d9b92f2e
npm ci
npx jest test/branding.test.ts
```

Builds de validation : Android `BETA_BUILD=true bundle exec fastlane android unsigned` ;
iOS via le workflow `build-ios-unsigned-validation` de `ci/ios-bokengigp-validation` avec
`source_sha` = le commit à construire. Vérifier les artefacts avec les SHA-256 ci-dessus.
