// Fichier d'environnement pour la production
// En production, Nginx fait le proxy de /api/ vers http://backend:8080/
// Le préfixe /api est supprimé (comme en développement avec le proxy Angular)
// Donc on utilise une URL relative qui sera interceptée par Nginx
export const environment = {
  production: true,
  apiUrl: '/api'
};

