# Système de Codes Médias - L'Auberge Boischatel

## Vue d'ensemble

Ce système permet de gérer tous les médias (images, modèles 3D, vidéos) du site via des **codes standardisés**. Chaque emplacement sur le site a un code unique.

## Codes par Section

### Hero (Accueil)
| Code | Description | Fichier actuel | Status |
|------|-------------|----------------|--------|
| **H1** | Image de fond principale | `facade-golden-hour.jpg` | ✅ |

### Mission
| Code | Description | Fichier actuel | Status |
|------|-------------|----------------|--------|
| **M1** | Logo 3D interactif | `logo-3d.glb` | ✅ |

### À Propos
| Code | Description | Fichier actuel | Status |
|------|-------------|----------------|--------|
| **A1** | Photo équipe principale | `equipe-designer.jpg` | ✅ |
| **A2** | Photo équipe 2 | - | ⏳ |
| **A3** | Photo équipe 3 | - | ⏳ |

### Sécurité
| Code | Description | Fichier actuel | Status |
|------|-------------|----------------|--------|
| **S1** | Certification RPA | (icône) | 📌 |
| **S2** | Système incendie | (icône) | 📌 |
| **S3** | Surveillance 24/7 | (icône) | 📌 |
| **S4** | Personnel qualifié | (icône) | 📌 |

### Chambres
| Code | Description | Fichier actuel | Status |
|------|-------------|----------------|--------|
| **C1** | Chambre standard | `chambre.png` | ✅ |
| **C2** | Chambre supérieure | - | ⏳ |
| **C3** | Suite | - | ⏳ |

### Activités
| Code | Description | Fichier actuel | Status |
|------|-------------|----------------|--------|
| **AC1** | Activités physiques | (icône) | 📌 |
| **AC2** | Activités culturelles | (icône) | 📌 |
| **AC3** | Activités sociales | (icône) | 📌 |
| **AC4** | Jardinage | (icône) | 📌 |
| **AC5** | Musique et arts | (icône) | 📌 |
| **AC6** | Sorties | (icône) | 📌 |

### Visite 3D
| Code | Description | Fichier actuel | Status |
|------|-------------|----------------|--------|
| **V1** | Modèle 3D Polycam | `auberge-3d.glb` | ✅ |
| **V2** | Version iOS (USDZ) | - | ⏳ |

### Repas
| Code | Description | Fichier actuel | Status |
|------|-------------|----------------|--------|
| **R1** | Salle à manger | `salle-manger.png` | ✅ |
| **R2** | Menu / Chef | - | ⏳ |
| **R3** | Cuisine | - | ⏳ |

### Services
| Code | Description | Fichier actuel | Status |
|------|-------------|----------------|--------|
| **SV1** | Services de soins | (icône) | 📌 |
| **SV2** | Services quotidiens | (icône) | 📌 |
| **SV3** | Services loisirs | (icône) | 📌 |

### Contact
| Code | Description | Fichier actuel | Status |
|------|-------------|----------------|--------|
| **CT1** | Carte Google Maps | (embed) | 📌 |

### Footer
| Code | Description | Fichier actuel | Status |
|------|-------------|----------------|--------|
| **F1** | Logo | `logo.png` | ✅ |

### Galerie (G1-G20)
| Code | Description | Fichier actuel | Status |
|------|-------------|----------------|--------|
| **G1** | Façade | `facade.jpg` | ✅ |
| **G2** | Jardin | `jardin.jpg` | ✅ |
| **G3** | Vue nocturne | `vue-nocturne.jpg` | ✅ |
| **G4** | Galerie | `galerie.jpg` | ✅ |
| **G5-G20** | Photos additionnelles | - | ⏳ |

### Extérieurs (EXT1-EXT5)
| Code | Description | Fichier actuel | Status |
|------|-------------|----------------|--------|
| **EXT1** | Façade 4K | `facade-golden-hour-4k.jpg` | ✅ |
| **EXT2** | Jardins | `jardin.jpg` | ✅ |
| **EXT3** | Terrasse | - | ⏳ |
| **EXT4** | Stationnement | - | ⏳ |
| **EXT5** | Vue aérienne | - | ⏳ |

---

## Légende

- ✅ = Disponible
- ⏳ = À ajouter
- 📌 = Utilise une icône (photo optionnelle)

---

## Comment ajouter une photo

1. **Déposer le fichier** dans `/public/static/images/`
2. **Informer Claude Code** avec le format:
   ```
   "J'ai [nom-fichier.jpg] pour [CODE]"
   ```
   Exemple: *"J'ai cuisine-chef.jpg pour R2"*

3. Claude Code va:
   - Mettre à jour `src/config/media.ts`
   - Vérifier les références dans les composants
   - Proposer un diff avant/après

---

## Fichiers de configuration

- **Mapping principal**: `src/config/media.ts`
- **Composant utilitaire**: `src/components/MediaByCode.tsx`
- **Documentation**: `src/config/MEDIA_CODES.md` (ce fichier)
