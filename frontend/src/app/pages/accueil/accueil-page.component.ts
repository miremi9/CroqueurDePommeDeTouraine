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
}


