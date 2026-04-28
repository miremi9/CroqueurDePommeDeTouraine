import { Component, inject, Input, OnChanges, SimpleChanges, OnDestroy, ChangeDetectorRef, Output, EventEmitter, ViewEncapsulation, SecurityContext } from '@angular/core';
import { ArticleResponse as ArticleModel } from '../../model/article-response.model';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { IllustrationService } from '../../services/illustration.service';
import { map, combineLatest, catchError, of, tap } from 'rxjs';
import { ArticleResponse } from '../../model/article-response.model';
import { ArticleService } from '../../services/article.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-article',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './article.html',
  styleUrls: ['./article.css'],
  encapsulation: ViewEncapsulation.None,
})
export class Article implements OnChanges, OnDestroy {
  private auth = inject(AuthService);
  illustrationService = inject(IllustrationService);
  private articleService = inject(ArticleService);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);
  private static readonly iframePlaceholderPrefix = '[[IFRAME_PLACEHOLDER_';
  
  private imageUrls: Map<string, string> = new Map();
  private illustrationMetadata: Map<string, { fileName: string; isImage: boolean; mimeType?: string }> = new Map();
  private renderedContent: SafeHtml = this.sanitizer.bypassSecurityTrustHtml('');
  private imageIds: string[] = [];
  private fileIds: string[] = [];

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

  @Input() index: number = 0;

  @Output() edit = new EventEmitter<ArticleResponse>();
  @Output() deleted = new EventEmitter<string>();

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

    this.refreshDerivedContent();
  }

  loadIllustrationMetadata(id: string): void {
    this.illustrationService.getIllustration(id).subscribe({
      next: (illustration: any) => {
        // L'API peut retourner idIllustration ou uuid, on gère les deux cas
        const fileName = illustration.path || '';
        const isImage = this.isImageFile(fileName, illustration.mimeType);
        const mimeType = illustration.mimeType || undefined;
        this.illustrationMetadata.set(id, { fileName, isImage, mimeType });
        this.refreshIllustrationIds();
        if (isImage && !this.imageUrls.has(id)) {
          this.loadImage(id);
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des métadonnées:', error);
        // Par défaut, considérer comme image si on ne peut pas charger les métadonnées
        this.illustrationMetadata.set(id, { fileName: '', isImage: true });
        this.refreshIllustrationIds();
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
    this.articleService.deleteArticle(this.article.idArticle).pipe(
      tap((message) => {
        console.log('Article supprimé', message);
        window.alert(message || 'Article supprimé avec succès.');
        if (this.article.idArticle) {
          this.deleted.emit(this.article.idArticle);
        }
      }),
      catchError((e) => {
        console.error('Échec de la suppression de l\'article', e);
        window.alert('Impossible de supprimer l\'article.');
        return of(null);
      })
    ).subscribe();
  }

  getImageIds(): string[] {
    return this.imageIds;
  }

  getFileIds(): string[] {
    return this.fileIds;
  }

  isEvenIndex(): boolean {
    return this.index % 2 === 0;
  }

  getRenderedContent(): SafeHtml {
    return this.renderedContent;
  }

  private sanitizeContentWithSafeIframes(rawContent: string): string {
    const container = document.createElement('div');
    container.innerHTML = rawContent;

    const safeIframes: string[] = [];
    const iframeNodes = Array.from(container.querySelectorAll('iframe'));

    iframeNodes.forEach((iframe) => {
      const safeIframe = this.buildSafeIframe(iframe);
      if (safeIframe) {
        const placeholder = document.createTextNode(
          `${Article.iframePlaceholderPrefix}${safeIframes.length}]]`
        );
        safeIframes.push(safeIframe);
        iframe.replaceWith(placeholder);
        return;
      }

      iframe.remove();
    });

    const sanitizedWithoutIframes =
      this.sanitizer.sanitize(SecurityContext.HTML, container.innerHTML) || '';

    return this.restoreIframePlaceholders(sanitizedWithoutIframes, safeIframes);
  }

  private buildSafeIframe(iframe: HTMLIFrameElement): string | null {
    const src = iframe.getAttribute('src')?.trim() || '';
    if (!src) {
      return null;
    }

    try {
      const parsedUrl = new URL(src, window.location.origin);
      if (parsedUrl.protocol !== 'https:') {
        return null;
      }
    } catch {
      return null;
    }

    const escapedSrc = this.escapeAttribute(src);
    const width = this.escapeAttribute(iframe.getAttribute('width') || '560');
    const height = this.escapeAttribute(iframe.getAttribute('height') || '315');
    const title = this.escapeAttribute(iframe.getAttribute('title') || 'iframe');
    const loading = this.escapeAttribute(iframe.getAttribute('loading') || 'lazy');
    const referrerPolicy = this.escapeAttribute(
      iframe.getAttribute('referrerpolicy') || 'strict-origin-when-cross-origin'
    );
    const allow = this.escapeAttribute(
      iframe.getAttribute('allow') ||
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
    );
    const sandbox = this.escapeAttribute(
      iframe.getAttribute('sandbox') ||
        'allow-scripts allow-same-origin allow-presentation allow-popups'
    );
    const allowFullscreen = iframe.hasAttribute('allowfullscreen') ? ' allowfullscreen' : '';

    return `<iframe src="${escapedSrc}" width="${width}" height="${height}" title="${title}" loading="${loading}" referrerpolicy="${referrerPolicy}" allow="${allow}" sandbox="${sandbox}"${allowFullscreen}></iframe>`;
  }

  private restoreIframePlaceholders(sanitizedHtml: string, safeIframes: string[]): string {
    let html = sanitizedHtml;
    safeIframes.forEach((iframe, index) => {
      const placeholder = `${Article.iframePlaceholderPrefix}${index}]]`;
      html = html.replace(placeholder, iframe);
    });
    return html;
  }

  private escapeAttribute(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private refreshDerivedContent(): void {
    const rawContent = this.article?.content || '';
    const contentWithSafeIframes = this.sanitizeContentWithSafeIframes(rawContent);
    this.renderedContent = this.sanitizer.bypassSecurityTrustHtml(contentWithSafeIframes);
    this.refreshIllustrationIds();
  }

  private refreshIllustrationIds(): void {
    const ids = this.article?.idIllustrationDAOS || [];
    this.imageIds = ids.filter(id => this.isImage(id));
    this.fileIds = ids.filter(id => !this.isImage(id));
  }

  removeIllustration(id: string): void {
    // Supprime immédiatement côté serveur puis met à jour l'article
    this.illustrationService.deleteIllustration(id).subscribe({
      next: () => {
        const updatedIds = (this.article.idIllustrationDAOS || []).filter(x => x !== id);
        this.article = { ...this.article, idIllustrationDAOS: updatedIds };
        this.refreshDerivedContent();
        // Nettoyer caches
        const url = this.imageUrls.get(id);
        if (url) {
          URL.revokeObjectURL(url);
          this.imageUrls.delete(id);
        }
        this.illustrationMetadata.delete(id);
        this.refreshIllustrationIds();
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

