import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouteService } from '../../services/route.service';
import { SectionResponse } from '../../model/article-response.model';
import { Roles } from '../../model/roles';
import { RoleService, RoleDAO } from '../../services/role.service';


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
  roleKeys: string[] = [];
  savingIds = new Set<SectionResponse['idSection']>();
  cdr: ChangeDetectorRef;
  filterText: string = '';
  newSectionNom: string = '';
  newSectionPath: string = '';
  newSectionParentId: number | null = null;
  newSectionRolesCanRead = new Set<string>([Roles.USER]); // par défaut lisible par USER
  newSectionRolesCanWrite = new Set<string>([Roles.ADMIN]); // ADMIN peut toujours écrire
  creating = false;

  constructor(
    private routeService: RouteService,
    private roleService: RoleService
  ) {
    this.cdr = inject(ChangeDetectorRef);
    this.loadRoles();
    this.loadSections();
  }

  private loadRoles(): void {
    this.roleService.getAllRoles().subscribe({
      next: (roles: RoleDAO[]) => {
        const keys = (roles || []).map(r => r.nomRole).filter(Boolean);
        this.roleKeys = Array.from(new Set(keys)).sort();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des rôles :', err);
        if (!this.error) {
          this.error = 'Impossible de charger les rôles.';
        }
      }
    });
  }

  private loadSections(): void {
    this.loading = true;
    this.error = null;
    this.routeService.getDynamicRoutes().subscribe({
      next: (sections) => {
        console.log(sections);
        this.sections = sections || [];
        // Normaliser les listes de rôles de chaque section
        this.sections.forEach(section => {
          section.rolesCanRead = Array.isArray(section.rolesCanRead) ? section.rolesCanRead : [];
          section.rolesCanWrite = Array.isArray(section.rolesCanWrite) ? section.rolesCanWrite : [];

          // Garantir quelques valeurs de base
          if (!section.rolesCanRead.includes(Roles.USER)) {
            section.rolesCanRead.push(Roles.USER);
          }
          if (!section.rolesCanWrite.includes(Roles.ADMIN)) {
            section.rolesCanWrite.push(Roles.ADMIN);
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

  hasRoleCanRead(section: SectionResponse, role: string): boolean {
    return Array.isArray(section.rolesCanRead) && section.rolesCanRead.includes(role);
  }

  hasRoleCanWrite(section: SectionResponse, role: string): boolean {
    return Array.isArray(section.rolesCanWrite) && section.rolesCanWrite.includes(role);
  }

  onToggleCanRead(section: SectionResponse, role: string, checked: boolean): void {
    const current = new Set(section.rolesCanRead || []);
    if (checked) {
      current.add(role);
    } else {
      current.delete(role);
    }

    // S'assurer que USER peut toujours lire
    if (!current.has(Roles.USER)) {
      current.add(Roles.USER);
    }

    section.rolesCanRead = Array.from(current);
  }

  onToggleCanWrite(section: SectionResponse, role: string, checked: boolean): void {
    // Ne pas permettre de décocher ADMIN en écriture
    if (role === Roles.ADMIN && !checked) {
      return;
    }

    const current = new Set(section.rolesCanWrite || []);
    if (checked) {
      current.add(role);
    } else {
      current.delete(role);
    }

    // S'assurer que ADMIN peut toujours écrire
    if (!current.has(Roles.ADMIN)) {
      current.add(Roles.ADMIN);
    }

    section.rolesCanWrite = Array.from(current);
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
      const byRole = Array.isArray(s.rolesCanRead) && s.rolesCanRead.some(r => r.toLowerCase().includes(text));
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

  toggleNewRoleCanRead(role: string, checked: boolean): void {
    if (checked) {
      this.newSectionRolesCanRead.add(role);
    } else {
      this.newSectionRolesCanRead.delete(role);
    }

    // S'assurer que USER peut toujours lire
    if (!this.newSectionRolesCanRead.has(Roles.USER)) {
      this.newSectionRolesCanRead.add(Roles.USER);
    }
  }

  toggleNewRoleCanWrite(role: string, checked: boolean): void {
    // Ne pas permettre de décocher ADMIN
    if (role === Roles.ADMIN && !checked) {
      return;
    }

    if (checked) {
      this.newSectionRolesCanWrite.add(role);
    } else {
      this.newSectionRolesCanWrite.delete(role);
    }

    // S'assurer que ADMIN peut toujours écrire
    if (!this.newSectionRolesCanWrite.has(Roles.ADMIN)) {
      this.newSectionRolesCanWrite.add(Roles.ADMIN);
    }
  }

  hasNewRoleCanRead(role: string): boolean {
    return this.newSectionRolesCanRead.has(role);
  }

  hasNewRoleCanWrite(role: string): boolean {
    return this.newSectionRolesCanWrite.has(role);
  }

  createSection(): void {
    if (!this.newSectionNom.trim() || !this.newSectionPath.trim()) {
      this.error = 'Le nom et le path sont requis.';
      return;
    }

    this.creating = true;
    this.error = null;

    const newSection: Partial<SectionResponse> = {
      nom: this.newSectionNom.trim(),
      path: this.newSectionPath.trim(),
      rolesCanRead: Array.from(this.newSectionRolesCanRead),
      rolesCanWrite: Array.from(this.newSectionRolesCanWrite),
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
        this.newSectionRolesCanRead = new Set<string>([Roles.USER]);
        this.newSectionRolesCanWrite = new Set<string>([Roles.ADMIN]);
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
