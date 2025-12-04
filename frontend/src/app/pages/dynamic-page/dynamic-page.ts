import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ArticleService } from '../../services/article.service';
import { ArticleResponse, SectionResponse } from '../../model/article-response.model';
import { FileArticle } from '../../componant/file-article/file-article';

@Component({
  selector: 'app-dynamic-page',
  imports: [FileArticle],
  templateUrl: './dynamic-page.html',
  styleUrl: './dynamic-page.css',
})
export class DynamicPage implements OnInit {
  routeData: SectionResponse | null = null;
  articleService = inject(ArticleService);
  articles: ArticleResponse[] = [];
  section: SectionResponse | null = null;
  error: string | null = null;
  loading: boolean = true;
  
  constructor(
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.routeData = this.route.snapshot.data['routeData'] as SectionResponse | null;
    this.section = this.routeData ?? null;
    const idSection = this.section?.idSection ?? -1;
    
    if (idSection !== -1) {
      this.loadArticles(idSection);
    } else {
      console.warn('Section non définie');
      this.loading = false;
    }
  }

  loadArticles(idSection: number) {
    this.error = null;
    this.loading = true;
    this.articleService.getArticlesBySection(idSection).subscribe({
      next: (articles: any) => {
        console.log('Articles reçus:', articles);
        // Créer une nouvelle référence d'array pour déclencher la détection de changement
        const newArticles = Array.isArray(articles) 
          ? [...articles] 
          : [...(articles?.articles || articles?.data || [])];
        
        this.articles = newArticles;
        this.loading = false;
        // Forcer la détection de changement pour s'assurer que le template se met à jour
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des articles:', err);
        this.error = 'Impossible de charger les articles';
        this.articles = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
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
