import { Component, EventEmitter, inject, Output, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
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
  @ViewChild('contentTextarea', { static: false }) contentTextarea?: ElementRef<HTMLTextAreaElement>;
  
  title = '';
  content = '';
  selectedFiles: File[] = [];
  existingIllustrations: { uuid: string; fileName: string }[] = [];
  illustrationService = inject(IllustrationService);
  articleService = inject(ArticleService);
  authService = inject(AuthService);
  
  // État du modal de lien
  showLinkModal = false;
  linkText = '';
  linkUrl = '';
  
  // État du modal de tableau
  showTableModal = false;
  tableRows = 2;
  tableCols = 2;
  tableCells: string[][] = []; // Tableau 2D pour stocker le contenu de chaque cellule

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
      error: (e) => console.error('Échec de suppression de l\'illustration', e)
    });
  }

  // Méthodes pour insérer un lien hypertexte
  openLinkModal(): void {
    const textarea = this.contentTextarea?.nativeElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      // Récupérer le texte sélectionné
      this.linkText = this.content.substring(start, end) || '';
    }
    this.linkUrl = '';
    this.showLinkModal = true;
  }

  closeLinkModal(): void {
    this.showLinkModal = false;
    this.linkText = '';
    this.linkUrl = '';
  }

  insertLink(): void {
    if (!this.linkUrl.trim()) {
      return;
    }
    
    const textarea = this.contentTextarea?.nativeElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = this.content.substring(start, end);
    
    // Utiliser le texte saisi ou le texte sélectionné, ou l'URL comme fallback
    const linkText = this.linkText.trim() || selectedText || this.linkUrl;
    const linkHtml = `<a href="${this.linkUrl}">${linkText}</a>`;
    
    // Insérer le lien à la position du curseur ou remplacer le texte sélectionné
    const before = this.content.substring(0, start);
    const after = this.content.substring(end);
    this.content = before + linkHtml + after;
    
    // Repositionner le curseur après l'insertion
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + linkHtml.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
    
    this.closeLinkModal();
  }

  // Méthodes pour insérer un tableau
  openTableModal(): void {
    this.tableRows = 2;
    this.tableCols = 2;
    this.initializeTableCells();
    this.showTableModal = true;
  }

  closeTableModal(): void {
    this.showTableModal = false;
    this.tableRows = 2;
    this.tableCols = 2;
    this.tableCells = [];
  }

  initializeTableCells(): void {
    // Initialiser le tableau 2D avec des chaînes vides
    this.tableCells = [];
    for (let row = 0; row < this.tableRows; row++) {
      this.tableCells[row] = [];
      for (let col = 0; col < this.tableCols; col++) {
        this.tableCells[row][col] = '';
      }
    }
  }

  onTableSizeChange(): void {
    // Réinitialiser le tableau quand la taille change
    const oldRows = this.tableCells.length;
    const oldCols = this.tableCells[0]?.length || 0;
    
    // Créer un nouveau tableau avec la nouvelle taille
    const newCells: string[][] = [];
    for (let row = 0; row < this.tableRows; row++) {
      newCells[row] = [];
      for (let col = 0; col < this.tableCols; col++) {
        // Conserver les valeurs existantes si elles existent
        if (row < oldRows && col < oldCols) {
          newCells[row][col] = this.tableCells[row][col];
        } else {
          newCells[row][col] = '';
        }
      }
    }
    this.tableCells = newCells;
  }

  getCellId(row: number, col: number): string {
    return `cell-${row}-${col}`;
  }

  getTableRowsArray(): number[] {
    return Array.from({ length: this.tableRows - 1 }, (_, i) => i + 1);
  }

  getTableColsArray(): number[] {
    return Array.from({ length: this.tableCols }, (_, i) => i);
  }

  insertTable(): void {
    if (this.tableRows < 1 || this.tableCols < 1) {
      return;
    }
    
    const textarea = this.contentTextarea?.nativeElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Générer le HTML du tableau avec le contenu des cellules
    let tableHtml = '<table>\n';
    
    // En-tête du tableau (première ligne en <th>)
    tableHtml += '  <thead>\n    <tr>\n';
    for (let col = 0; col < this.tableCols; col++) {
      const headerContent = this.tableCells[0]?.[col] || `Colonne ${col + 1}`;
      tableHtml += `      <th>${this.escapeHtml(headerContent)}</th>\n`;
    }
    tableHtml += '    </tr>\n  </thead>\n';
    
    // Corps du tableau (les autres lignes en <td>)
    tableHtml += '  <tbody>\n';
    for (let row = 1; row < this.tableRows; row++) {
      tableHtml += '    <tr>\n';
      for (let col = 0; col < this.tableCols; col++) {
        const cellContent = this.tableCells[row]?.[col] || '';
        tableHtml += `      <td>${this.escapeHtml(cellContent)}</td>\n`;
      }
      tableHtml += '    </tr>\n';
    }
    tableHtml += '  </tbody>\n</table>';
    
    // Insérer le tableau à la position du curseur ou remplacer le texte sélectionné
    const before = this.content.substring(0, start);
    const after = this.content.substring(end);
    this.content = before + tableHtml + after;
    
    // Repositionner le curseur après l'insertion
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + tableHtml.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
    
    this.closeTableModal();
  }

  escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
