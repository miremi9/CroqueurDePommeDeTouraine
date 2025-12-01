import { Component, inject, Input, OnChanges, SimpleChanges, OnDestroy, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { ArticleResponse as ArticleModel } from '../../model/article-response.model';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { IllustrationService } from '../../services/illustration.service';
import { map, combineLatest } from 'rxjs';
import { ArticleResponse } from '../../model/article-response.model';
import { ArticleService } from '../../services/article.service';

@Component({
  selector: 'app-article',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './article.html',
  styleUrls: ['./article.css'],
})
export class Article implements OnChanges, OnDestroy {
  private auth = inject(AuthService);
  illustrationService = inject(IllustrationService);
  private articleService = inject(ArticleService);
  private cdr = inject(ChangeDetectorRef);
  
  private imageUrls: Map<string, string> = new Map();
  private illustrationMetadata: Map<string, { fileName: string; isImage: boolean; mimeType?: string }> = new Map();

  @Input() article: ArticleResponse = {
    title: '',
    content: '',
    idArticle: '',
    dateCreation: new Date().toISOString(),
    idAuthor: '',
    idSection: -1,
    authorName: '',
    changed: false,
    supprimed: false,
    idIllustrationDAOS: []
  };

  @Output() edit = new EventEmitter<ArticleResponse>();

  roles$ = this.auth.roles$;
  id$ = this.roles$.pipe(map(() => this.auth.getId()));
  isAdmin$ = combineLatest([this.roles$, this.id$]).pipe(
    map(([roles, id]) => roles.includes('ADMIN') || id === this.article.idAuthor)
  );

  ngOnChanges(changes: SimpleChanges): void {
    // Charger les images et métadonnées quand l'article change
    if (!this.article?.idIllustrationDAOS) {
      return;
    }

    this.article.idIllustrationDAOS.forEach(id => {
      if (!this.illustrationMetadata.has(id)) {
        this.loadIllustrationMetadata(id);
      } else {
        const metadata = this.illustrationMetadata.get(id);
        if (metadata?.isImage && !this.imageUrls.has(id)) {
          this.loadImage(id);
        }
      }
    });
  }

  loadIllustrationMetadata(id: string): void {
    this.illustrationService.getIllustration(id).subscribe({
      next: (illustration: any) => {
        // L'API peut retourner idIllustration ou uuid, on gère les deux cas
        const fileName = illustration.path || '';
        const isImage = this.isImageFile(fileName, illustration.mimeType);
        const mimeType = illustration.mimeType || undefined;
        this.illustrationMetadata.set(id, { fileName, isImage, mimeType });
        if (isImage && !this.imageUrls.has(id)) {
          this.loadImage(id);
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des métadonnées:', error);
        // Par défaut, considérer comme image si on ne peut pas charger les métadonnées
        this.illustrationMetadata.set(id, { fileName: '', isImage: true });
        this.cdr.detectChanges();
      }
    });
  }

  private loadImage(id: string): void {
    this.illustrationService.getImage(id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.imageUrls.set(id, url);
        this.cdr.detectChanges(); // Force la détection de changement pour mettre à jour le template
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'image:', error);
      }
    });
  }

  isImageFile(fileName: string, mimeType?: string | null): boolean {
    if (!fileName) return true; // Par défaut, considérer comme image si pas de nom
    const extension = fileName.toLowerCase().split('.').pop() || '';
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'];
    return imageExtensions.includes(extension);
  }

  isImage(id: string): boolean {
    const metadata = this.illustrationMetadata.get(id);
    return metadata?.isImage ?? true; // Par défaut, considérer comme image
  }

  getFileName(id: string): string {
    const metadata = this.illustrationMetadata.get(id);
    return metadata?.fileName || id;
  }

  downloadFile(id: string): void {
    const metadata = this.illustrationMetadata.get(id);
    const fileName = metadata?.fileName || `file-${id}`;
    const mimeType = metadata?.mimeType;

    this.illustrationService.getFile(id, fileName, mimeType).subscribe({
      next: (file) => {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name || fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Erreur lors du téléchargement du fichier:', error);
      }
    });
  }

  getImageUrl(id: string): string | undefined {
    return this.imageUrls.get(id);
  }

  ngOnDestroy(): void {
    // Libérer les URLs créées pour éviter les fuites mémoire
    this.imageUrls.forEach(url => URL.revokeObjectURL(url));
    this.imageUrls.clear();
    this.illustrationMetadata.clear();
  }

  editArticle() {
    this.edit.emit(this.article);
  }

  deleteArticle() {
    console.log('Supprimer l\'article');
  }

  removeIllustration(id: string): void {
    // Supprime immédiatement côté serveur puis met à jour l'article
    this.illustrationService.deleteIllustration(id).subscribe({
      next: () => {
        const updatedIds = (this.article.idIllustrationDAOS || []).filter(x => x !== id);
        this.article = { ...this.article, idIllustrationDAOS: updatedIds };
        // Nettoyer caches
        const url = this.imageUrls.get(id);
        if (url) {
          URL.revokeObjectURL(url);
          this.imageUrls.delete(id);
        }
        this.illustrationMetadata.delete(id);
        this.cdr.detectChanges();
        // Persister la mise à jour de l'article
        if (this.article.idArticle) {
          this.articleService.updateArticle(this.article.idArticle, this.article).subscribe({
            error: (e) => console.error('Échec de la mise à jour de l’article après suppression du fichier', e)
          });
        }
      },
      error: (e) => {
        console.error('Échec de la suppression du fichier', e);
      }
    });
  }
}

