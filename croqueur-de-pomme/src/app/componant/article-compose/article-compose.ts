import { Component, EventEmitter, inject, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IllustrationService } from '../../services/illustration.service';
import { ArticleService } from '../../services/article.service';
import { AuthService } from '../../services/auth.service';
import { ArticleResponse } from '../../model/article-response.model';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-article-compose',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './article-compose.html',
  styleUrls: ['./article-compose.css'],
})
export class ArticleCompose implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() submitArticle = new EventEmitter<any>();

  @Input() idSection: number | null = null;
  @Input() article: ArticleResponse | null = null;
  title = '';
  content = '';
  selectedFiles: File[] = [];
  existingIllustrations: { uuid: string; fileName: string }[] = [];
  illustrationService = inject(IllustrationService);
  articleService = inject(ArticleService);
  authService = inject(AuthService);

  ngOnInit(): void {
    if (this.article) {
      this.title = this.article.title;
      this.content = this.article.content;
      const illustrationIds = [...(this.article.idIllustrationDAOS || [])];
      if (illustrationIds.length) {
        forkJoin(
          illustrationIds.map(uuid =>
            this.illustrationService.getIllustration(uuid).pipe(
              map(illustration => ({
                uuid,
                fileName: illustration?.fileName || uuid
              })),
              catchError(() => of({ uuid, fileName: uuid }))
            )
          )
        ).subscribe({
          next: illustrations => {
            this.existingIllustrations = illustrations;
          },
          error: e => console.error('Impossible de charger les métadonnées des fichiers', e)
        });
      }
      // Si on ouvre en édition sans idSection fourni, utiliser celui de l'article
      if (this.idSection == null || this.idSection === -1) {
        this.idSection = this.article.idSection ?? -1;
      }
    }
  }

  onBackdropClick() {
    this.close.emit();
  }

  onSubmit() {
    console.log('onSubmit', this.title, this.content, this.selectedFiles);
    this.uploadIllustrations().pipe(
      switchMap((newIllustrations: string[]) => {
        const idAuthor = this.authService.getId();
        const authorName = this.authService.getUsername();
        
        if (!idAuthor || !authorName) {
          throw new Error('Utilisateur non authentifié');
        }

        const allIllustrations = [...this.existingIllustrations.map(i => i.uuid), ...newIllustrations];

        const articleData: Partial<ArticleResponse> = {
          title: this.title,
          content: this.content,
          idIllustrationDAOS: allIllustrations,
          idAuthor: this.article?.idAuthor ?? idAuthor,
          idSection: this.idSection ?? -1,
          authorName: this.article?.authorName ?? authorName,
          changed: false,
          supprimed: false
        };

        if (this.article?.idArticle) {
          return this.articleService.updateArticle(this.article.idArticle, { ...(this.article as ArticleResponse), ...(articleData as ArticleResponse) });
        } else {
          return this.articleService.createArticle(articleData as ArticleResponse);
        }
      })
    ).subscribe({
      next: (savedArticle) => {
        console.log('Article sauvegardé:', savedArticle);
        this.submitArticle.emit(savedArticle);
        this.close.emit();
      },
      error: (error) => {
        console.error('Erreur lors de la sauvegarde de l\'article:', error);
      }
    });
  }

  uploadIllustrations(): Observable<string[]> {
    if (!this.selectedFiles.length) {
      return of([]);
    }
    const uploads = this.selectedFiles.map(file =>
      this.illustrationService.createIllustration(file).pipe(
        map((illustration: any) => illustration.idIllustration as string)
      )
    );
    return forkJoin(uploads);
  }
  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const newFiles = input.files ? Array.from(input.files) : [];
    
    // Ajouter les nouveaux fichiers à la liste existante
    // Éviter les doublons en vérifiant le nom et la taille
    for (const newFile of newFiles) {
      const isDuplicate = this.selectedFiles.some(
        existingFile => existingFile.name === newFile.name && existingFile.size === newFile.size
      );
      if (!isDuplicate) {
        this.selectedFiles.push(newFile);
      }
    }
    
    // Réinitialiser l'input pour permettre de sélectionner le même fichier à nouveau
    input.value = '';
  }

  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  removeExisting(uuid: string): void {
    this.illustrationService.deleteIllustration(uuid).subscribe({
      next: () => {
        this.existingIllustrations = this.existingIllustrations.filter(x => x.uuid !== uuid);
      },
      error: (e) => console.error('Échec de suppression de l’illustration', e)
    });
  }
}


