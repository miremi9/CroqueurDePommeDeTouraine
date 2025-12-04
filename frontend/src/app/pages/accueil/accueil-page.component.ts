import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileArticle } from '../../componant/file-article/file-article';
import { ArticleResponse } from '../../model/article-response.model';
import { ArticleService } from '../../services/article.service';

/**
 * Composant pour la page d'accueil
 */
@Component({
  selector: 'app-accueil-page',
  standalone: true,
  imports: [CommonModule, FileArticle],
  templateUrl: './accueil-page.component.html',
  styleUrl: './accueil-page.component.css'
})
export class AccueilPageComponent {
  articleService = inject(ArticleService);
  articles: ArticleResponse[] = [];

  constructor(private cdr: ChangeDetectorRef) {
    this.articleService.getRecentArticles(3).subscribe((articles) => {
      console.log('Articles recents reçus:', articles);
      this.articles = articles;
      this.cdr.detectChanges();
    });
  }

  onArticleSaved(article: ArticleResponse) {
    const existingIndex = this.articles.findIndex(a => a.idArticle === article.idArticle);
    if (existingIndex !== -1) {
      const updated = [...this.articles];
      updated[existingIndex] = article;
      this.articles = updated;
    } else {
      this.articles = [article, ...this.articles];
    }
    this.cdr.detectChanges();
  }

  onArticleDeleted(articleId: string) {
    this.articles = this.articles.filter(article => article.idArticle !== articleId);
    this.cdr.detectChanges();
  }
}


