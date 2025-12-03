import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArticleResponse as ArticleModel } from '../../model/article-response.model';
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
  @Input() articles: ArticleModel[] = [];
  @Input() idSection: number | null = null;

  roles$ = this.auth.roles$;
  canWrite$ = this.roles$.pipe(
    map(roles => (roles.includes('ADMIN') || roles.includes('EDITEUR')) && (this.idSection !== null && this.idSection !== -1))
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
    return [...this.articles].sort((a, b) => {
      const dateA = new Date(a.dateCreation || 0).getTime();
      const dateB = new Date(b.dateCreation || 0).getTime();
      return dateB - dateA; // Tri décroissant (plus récent en premier)
    });
  }
}
