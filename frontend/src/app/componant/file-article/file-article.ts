import { Component, Input, inject, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArticleResponse as ArticleModel, SectionResponse } from '../../model/article-response.model';
import { Article as ArticleComponent } from '../article/article';
import { AuthService } from '../../services/auth.service';
import { map } from 'rxjs';
import { ArticleCompose } from '../article-compose/article-compose';

@Component({
  selector: 'app-file-article',
  standalone: true,
  imports: [CommonModule, ArticleComponent, ArticleCompose],
  templateUrl: './file-article.html',
  styleUrls: ['./file-article.css'],
})
export class FileArticle {
  private auth = inject(AuthService);
  private _articles: ArticleModel[] = [];

  @Input() set articles(value: ArticleModel[]) {
    this._articles = Array.isArray(value) ? [...value] : [];
  }

  get articles(): ArticleModel[] {
    return this._articles;
  }

  @Input() idSection: number | null = null;
  @Input() section: SectionResponse | null = null;
  @Output() articleSaved = new EventEmitter<ArticleModel>();
  @Output() articleDeleted = new EventEmitter<string>();

  roles$ = this.auth.roles$;
  canWrite$ = this.roles$.pipe(
    map(userRoles => {
      const sectionRoles = this.section?.rolesCanWrite ?? [];

      // Si on a une section et des rôles d'écriture définis, on vérifie l'intersection
      if (this.section && sectionRoles.length > 0) {
        return sectionRoles.some(role => userRoles.includes(role));
      }

      // Fallback : ancien comportement (ADMIN ou EDITEUR) + idSection valide
      return (
        (userRoles.includes('ADMIN') || userRoles.includes('EDITEUR')) &&
        this.idSection !== null &&
        this.idSection !== -1
      );
    })
  );

  showCompose = false;
  editingArticle: ArticleModel | null = null;
  openCompose() { this.showCompose = true; }
  closeCompose() { this.showCompose = false; this.editingArticle = null; }

  openEdit(article: ArticleModel) {
    this.editingArticle = article;
    this.showCompose = true;
  }

  /**
   * Retourne les articles triés par date de création (les plus récents en premier)
   */
  get sortedArticles(): ArticleModel[] {
    return [...this._articles].sort((a, b) => {
      const dateA = new Date(a.dateCreation || 0).getTime();
      const dateB = new Date(b.dateCreation || 0).getTime();
      return dateB - dateA; // Tri décroissant (plus récent en premier)
    });
  }

  handleArticleSaved(article: ArticleModel) {
    const index = this._articles.findIndex(a => a.idArticle === article.idArticle);
    if (index !== -1) {
      this._articles = [
        ...this._articles.slice(0, index),
        article,
        ...this._articles.slice(index + 1),
      ];
    } else {
      this._articles = [article, ...this._articles];
    }
    this.articleSaved.emit(article);
  }

  handleArticleDeleted(articleId: string) {
    this._articles = this._articles.filter(article => article.idArticle !== articleId);
    this.articleDeleted.emit(articleId);
  }
}
