import { Component, EventEmitter, inject, Output, Input, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
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
export class ArticleCompose implements OnInit, AfterViewInit {
  @Output() close = new EventEmitter<void>();
  @Output() submitArticle = new EventEmitter<any>();

  @Input() idSection: number | null = null;
  @Input() article: ArticleResponse | null = null;
  @ViewChild('contentEditor', { static: false }) contentEditor?: ElementRef<HTMLDivElement>;

  private isSyncingContent = false;
  private savedSelection: Range | null = null;
  
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

  // Erreur de publication
  showErrorModal = false;
  errorMessage = '';
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

  ngAfterViewInit(): void {
    this.syncEditorFromContent();
  }

  syncContentFromEditor(): void {
    if (this.isSyncingContent || !this.contentEditor) return;
    this.isSyncingContent = true;
    this.content = this.contentEditor.nativeElement.innerHTML;
    this.isSyncingContent = false;
  }

  onHtmlSourceChange(): void {
    if (this.isSyncingContent || !this.contentEditor) return;
    this.isSyncingContent = true;
    this.contentEditor.nativeElement.innerHTML = this.content;
    this.isSyncingContent = false;
  }

  private syncEditorFromContent(): void {
    if (this.isSyncingContent || !this.contentEditor) return;
    this.isSyncingContent = true;
    this.contentEditor.nativeElement.innerHTML = this.content;
    this.isSyncingContent = false;
  }

  private focusContentEditor(): void {
    this.contentEditor?.nativeElement.focus();
  }

  private getSelectedText(): string {
    return window.getSelection()?.toString() ?? '';
  }

  private saveSelection(): void {
    const editor = this.contentEditor?.nativeElement;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) {
      this.savedSelection = null;
      return;
    }
    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      this.savedSelection = range.cloneRange();
    } else {
      this.savedSelection = null;
    }
  }

  private restoreSelection(): void {
    if (!this.savedSelection) return;
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(this.savedSelection);
  }

  private insertHtmlAtCursor(html: string): void {
    const editor = this.contentEditor?.nativeElement;
    if (!editor) return;
    editor.focus();
    this.restoreSelection();
    document.execCommand('insertHTML', false, html);
    this.savedSelection = null;
    this.syncContentFromEditor();
  }

  onBackdropClick() {
    this.close.emit();
  }

  onSubmit() {
    this.syncContentFromEditor();
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
        this.showPublishError(error);
      }
    });
  }

  showPublishError(error: unknown): void {
    this.errorMessage = this.extractErrorMessage(error);
    this.showErrorModal = true;
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
    this.errorMessage = '';
  }

  private extractErrorMessage(error: unknown): string {
    const defaultMsg = 'Impossible de publier l\'article.';

    if (error instanceof Error && !(error instanceof HttpErrorResponse)) {
      return error.message || defaultMsg;
    }

    const httpError = error as HttpErrorResponse;
    const body = httpError?.error;

    if (typeof body === 'string' && body.trim()) {
      return body;
    }

    if (body && typeof body === 'object') {
      const record = body as Record<string, unknown>;
      if (typeof record['message'] === 'string' && record['message'].trim()) {
        return record['message'];
      }
      if (typeof record['error'] === 'string' && record['error'].trim()) {
        return record['error'];
      }
      const parts = Object.entries(record)
        .map(([key, value]) => {
          if (typeof value === 'string') {
            return value.trim() ? `${key} ${value}` : key;
          }
          return `${key} ${String(value)}`;
        })
        .filter(part => part.trim());
      if (parts.length) {
        return parts.join('\n');
      }
    }

    if (httpError?.status === 400) {
      return 'Requête incorrecte (400). Vérifiez le titre, le contenu et les champs obligatoires.';
    }

    if (httpError?.message) {
      return httpError.message;
    }

    return defaultMsg;
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
    this.saveSelection();
    this.linkText = this.getSelectedText();
    this.linkUrl = '';
    this.showLinkModal = true;
  }

  closeLinkModal(): void {
    this.showLinkModal = false;
    this.linkText = '';
    this.linkUrl = '';
  }

  insertFormatting(tag: 'strong' | 'em' | 'u'): void {
    const command = tag === 'strong' ? 'bold' : tag === 'em' ? 'italic' : 'underline';
    this.focusContentEditor();
    document.execCommand(command, false);
    this.syncContentFromEditor();
  }

  insertLink(): void {
    if (!this.linkUrl.trim()) {
      return;
    }

    const selectedText = this.getSelectedText();
    const linkText = this.linkText.trim() || selectedText || this.linkUrl;
    const linkHtml = `<a href="${this.escapeHtml(this.linkUrl)}">${this.escapeHtml(linkText)}</a>`;
    this.insertHtmlAtCursor(linkHtml);
    this.closeLinkModal();
  }

  // Méthodes pour insérer un tableau
  openTableModal(): void {
    this.saveSelection();
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

    let tableHtml = '<table>\n';
    tableHtml += '  <thead>\n    <tr>\n';
    for (let col = 0; col < this.tableCols; col++) {
      const headerContent = this.tableCells[0]?.[col] || `Colonne ${col + 1}`;
      tableHtml += `      <th>${this.escapeHtml(headerContent)}</th>\n`;
    }
    tableHtml += '    </tr>\n  </thead>\n';
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

    this.insertHtmlAtCursor(tableHtml);
    this.closeTableModal();
  }

  escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}