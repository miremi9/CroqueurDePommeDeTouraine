import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouteService } from '../../services/route.service';
import { SectionResponse } from '../../model/article-response.model';
import { Roles } from '../../model/roles';


@Component({
  selector: 'app-admin-edit-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-edit-section.component.html',
  styleUrl: './admin-edit-section.component.css'
})
export class AdminEditSectionComponent {
  sections: SectionResponse[] = [];
  displayedSections: SectionResponse[] = [];
  loading = false;
  error: string | null = null;
  roleKeys: string[] = Object.values(Roles);
  savingIds = new Set<SectionResponse['idSection']>();
  cdr: ChangeDetectorRef;
  filterText: string = '';
  newSectionNom: string = '';
  newSectionPath: string = '';
  newSectionParentId: number | null = null;
  newSectionRoles = new Set<string>([Roles.ADMIN]); // ADMIN toujours présent par défaut
  creating = false;

  constructor(private routeService: RouteService) {
    this.cdr = inject(ChangeDetectorRef);
    this.loadSections();
  }

  private loadSections(): void {
    this.loading = true;
    this.error = null;
    this.routeService.getDynamicRoutes().subscribe({
      next: (sections) => {
        console.log(sections);
        this.sections = sections || [];
        // S'assurer que ADMIN est toujours présent dans les rôles de chaque section
        this.sections.forEach(section => {
          if (!section.roles || !Array.isArray(section.roles)) {
            section.roles = [];
          }
          if (!section.roles.includes(Roles.ADMIN)) {
            section.roles.push(Roles.ADMIN);
          }
        });
        this.updateDisplayedSections();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Impossible de charger les sections.';
        console.error(err);
      }
    });
  }

  hasRole(section: SectionResponse, role: string): boolean {
    return Array.isArray(section.roles) && section.roles.includes(role);
  }

  onToggle(section: SectionResponse, role: string, checked: boolean): void {
    // Ne pas permettre de décocher ADMIN
    if (role === Roles.ADMIN && !checked) {
      return;
    }

    const current = new Set(section.roles || []);
    if (checked) {
      current.add(role);
    } else {
      current.delete(role);
    }
    
    // S'assurer que ADMIN est toujours présent
    if (!current.has(Roles.ADMIN)) {
      current.add(Roles.ADMIN);
    }
    
    section.roles = Array.from(current);
  }

  save(section: SectionResponse): void {
    this.savingIds.add(section.idSection);
    
    // Vérifier si la section est parent (a des enfants)
    const isParent = this.isSectionParent(section.idSection);
    
    // Si la section est parent, elle ne peut pas avoir de parent
    if (isParent && section.idParent !== null) {
      this.error = 'Une section parent ne peut pas avoir de parent.';
      this.savingIds.delete(section.idSection);
      return;
    }
    
    // S'assurer que ADMIN est toujours présent avant la sauvegarde
    if (!section.roles || !section.roles.includes(Roles.ADMIN)) {
      if (!section.roles) {
        section.roles = [];
      }
      section.roles.push(Roles.ADMIN);
    }
    
    this.routeService.updateSection(section).subscribe({
      next: (updated) => {
        const idx = this.sections.findIndex(s => s.idSection === section.idSection);
        if (idx >= 0) {
          this.sections[idx] = { ...updated };
        }
        this.savingIds.delete(section.idSection);
        this.updateDisplayedSections();
        this.error = null;
      },
      error: (err) => {
        console.error(err);
        this.savingIds.delete(section.idSection);
        this.error = 'Échec de la mise à jour de la section.';
      }
    });
  }

  onFilterChange(value: string): void {
    this.filterText = value || '';
    this.updateDisplayedSections();
  }

  private updateDisplayedSections(): void {
    const text = this.filterText.trim().toLowerCase();
    if (!text) {
      this.displayedSections = [...this.sections];
      return;
    }
    this.displayedSections = this.sections.filter(s => {
      const byName = (s.nom || '').toLowerCase().includes(text);
      const byPath = (s.path || '').toLowerCase().includes(text);
      const byRole = Array.isArray(s.roles) && s.roles.some(r => r.toLowerCase().includes(text));
      const byId = String(s.idSection || '').includes(text);
      return byName || byPath || byRole || byId;
    });
  }

  isAdminRole(role: string): boolean {
    return role === Roles.ADMIN;
  }

  /**
   * Vérifie si une section est parent (a des enfants)
   */
  isSectionParent(sectionId: number): boolean {
    return this.sections.some(s => s.idParent === sectionId);
  }

  /**
   * Retourne les sections disponibles pour être parent (excluant uniquement la section actuelle)
   * Un parent peut avoir plusieurs enfants, donc les sections qui sont déjà parents sont incluses
   */
  getAvailableParentSections(currentSectionId: number): SectionResponse[] {
    return this.sections.filter(s => {
      // Exclure uniquement la section actuelle
      return s.idSection !== currentSectionId;
    });
  }

  /**
   * Retourne le nom de la section parent par son id
   */
  getParentSectionName(parentId: number | null): string {
    if (parentId === null) return '';
    const parent = this.sections.find(s => s.idSection === parentId);
    return parent ? parent.nom : '';
  }

  toggleNewRole(role: string, checked: boolean): void {
    // Ne pas permettre de décocher ADMIN
    if (role === Roles.ADMIN && !checked) {
      return;
    }

    if (checked) {
      this.newSectionRoles.add(role);
    } else {
      this.newSectionRoles.delete(role);
    }
    
    // S'assurer que ADMIN est toujours présent
    if (!this.newSectionRoles.has(Roles.ADMIN)) {
      this.newSectionRoles.add(Roles.ADMIN);
    }
  }

  hasNewRole(role: string): boolean {
    return this.newSectionRoles.has(role);
  }

  createSection(): void {
    if (!this.newSectionNom.trim() || !this.newSectionPath.trim()) {
      this.error = 'Le nom et le path sont requis.';
      return;
    }

    this.creating = true;
    this.error = null;

    // S'assurer que ADMIN est toujours présent
    if (!this.newSectionRoles.has(Roles.ADMIN)) {
      this.newSectionRoles.add(Roles.ADMIN);
    }

    const newSection: Partial<SectionResponse> = {
      nom: this.newSectionNom.trim(),
      path: this.newSectionPath.trim(),
      roles: Array.from(this.newSectionRoles),
      idParent: this.newSectionParentId,
      supprimed: false
    };

    this.routeService.createSection(newSection).subscribe({
      next: (created) => {
        this.sections.push(created);
        this.updateDisplayedSections();
        // Réinitialiser les champs
        this.newSectionNom = '';
        this.newSectionPath = '';
        this.newSectionParentId = null;
        this.newSectionRoles = new Set<string>([Roles.ADMIN]);
        this.creating = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.error = 'Échec de la création de la section.';
        this.creating = false;
      }
    });
  }

}
