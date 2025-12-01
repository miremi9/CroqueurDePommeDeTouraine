# Routes Dynamiques

Ce système permet de charger des routes dynamiquement depuis un service API au démarrage de l'application.

## Fonctionnement

1. **RouteService** (`services/route.service.ts`) : Service qui récupère la liste des routes depuis votre API
2. **Routes Initializer** (`routes/routes.initializer.ts`) : Charge les routes au démarrage via `APP_INITIALIZER`
3. **App Config** : Configure l'initializer dans les providers de l'application

## Format des données attendues par l'API

Votre API doit retourner un tableau d'objets avec la structure suivante :

```typescript
[
  {
    path: 'ma-page',
    componentName: 'MaPageComponent' // Optionnel : nom du composant à charger
  },
  {
    path: 'autre-page',
    redirectTo: '/accueil' // Optionnel : redirection
  },
  {
    path: 'page-generique' // Utilise le composant générique si componentName n'est pas fourni
  },
  {
    path: 'page-custom',
    componentPath: '../pages/custom/custom.component', // Chemin personnalisé
    componentName: 'CustomComponent'
  }
]
```

## Configuration

### 1. Adapter le RouteService

Modifiez `services/route.service.ts` pour pointer vers votre endpoint API réel :

```typescript
getDynamicRoutes(): Observable<DynamicRouteData[]> {
  return this.http.get<DynamicRouteData[]>(`${this.apiUrl}/votre-endpoint-routes`);
}
```

### 2. Créer vos composants

Placez vos composants dans `src/app/pages/` avec la structure suivante :
- `pages/[nom-component]/[nom-component].component.ts`

Exemple : `pages/accueil/accueil.component.ts` avec un export `AccueilComponent`

### 3. Composant générique

Le composant `DynamicPageComponent` est utilisé pour les routes qui n'ont pas de composant spécifique.
Vous pouvez le personnaliser selon vos besoins.

## Avantages

- ✅ Routes chargées depuis l'API (CMS, base de données, etc.)
- ✅ Pas besoin de redéployer pour ajouter/modifier des routes
- ✅ Lazy loading automatique des composants
- ✅ Gestion d'erreur avec fallback vers routes par défaut

## Limitations

- Les routes sont chargées au démarrage (une seule fois)
- Pour ajouter des routes en runtime, utilisez `Router.resetConfig()` dans votre code

