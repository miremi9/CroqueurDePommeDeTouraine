export interface ArticleResponse {
  idArticle: string;           // UUID sous forme de chaîne
  idSection: number;           // Long côté Java → number en TS
  title: string;
  content: string;
  idAuthor?: string;            // UUID sous forme de chaîne
  authorName?: string;
  dateCreation: string;        // Date JSON (ISO) côté API, à parser si besoin
  changed?: boolean;
  supprimed?: boolean;
  idIllustrationDAOS?: string[]; // Liste de UUID sous forme de chaînes
}

export interface IllustrationResponse {
  idIllustration: string;
  fileName: string; 
}

export interface UserResponse {
  idUser: string;
  nom: string;
  roles: string[];
}

export interface SectionResponse {
  idSection: number;
  nom: string;
  path: string;
  idParent: number | null;
  supprimed: boolean | null;
  rolesCanRead: string[];
  rolesCanWrite: string[];
}

export interface SiteBodyResponse {
  titre: string;
  logo: string; // Chaîne base64
  basDePage: string;
  couleurPrincipale: string; // hexa de la couleur principale
  couleurSecondaire: string; // hexa de la couleur secondaire
}