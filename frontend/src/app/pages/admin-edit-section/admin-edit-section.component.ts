import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
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
  private readonly routeService = inject(RouteService);
  private readonly roleService = inject(RoleService);
  private readonly cdr = inject(ChangeDetectorRef);

  sections: SectionResponse[] = [];
  displayedSections: SectionResponse[] = [];
  parentSectionIds = new Set<number>();
  parentOptionsBySectionId = new Map<number, SectionResponse[]>();
  parentOptionsForCreate: SectionResponse[] = [];
  loading = false;
  error: string | null = null;
  roleKeys: string[] = [];
  savingIds = new Set<SectionResponse['idSection']>();
  filterText = '';
  newSectionNom = '';
  newSectionPath = '';
  newSectionParentId: number | null = null;
  newSectionRolesCanRead: string[] = [Roles.USER];
  newSectionRolesCanWrite: string[] = [Roles.ADMIN];
  creating = false;
  showResultModal = false;
  resultModalTitle = '';
  resultModalMessage = '';
  resultModalIsError = false;

  constructor() {
    this.loadRoles();
    this.loadSections();
  }

  private loadRoles(): void {
    this.roleService.getAllRoles().subscribe({
      next: (roles: RoleDAO[]) => {
        this.roleKeys = [...new Set((roles ?? []).map(r => r.nomRole).filter(Boolean))].sort();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des rôles :', err);
        this.error ??= 'Impossible de charger les rôles.';
      }
    });
  }

  private loadSections(): void {
    this.loading = true;
    this.error = null;
    this.routeService.getDynamicRoutes().subscribe({
      next: (sections) => {
        this.sections = (sections ?? []).map(section => this.normalizeSectionRoles(section));
        this.rebuildSectionLookups();
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

  hasCanRead(role: string, section?: SectionResponse): boolean {
    return this.hasRole(section?.rolesCanRead ?? this.newSectionRolesCanRead, role);
  }

  hasCanWrite(role: string, section?: SectionResponse): boolean {
    return this.hasRole(section?.rolesCanWrite ?? this.newSectionRolesCanWrite, role);
  }

  toggleCanRead(role: string, checked: boolean, section?: SectionResponse): void {
    if (section) {
      section.rolesCanRead = this.applyReadToggle(section.rolesCanRead, role, checked);
      return;
    }
    this.newSectionRolesCanRead = this.applyReadToggle(this.newSectionRolesCanRead, role, checked);
  }

  toggleCanWrite(role: string, checked: boolean, section?: SectionResponse): void {
    if (section) {
      section.rolesCanWrite = this.applyWriteToggle(section.rolesCanWrite, role, checked);
      return;
    }
    this.newSectionRolesCanWrite = this.applyWriteToggle(this.newSectionRolesCanWrite, role, checked);
  }

  isWriteRoleLocked(role: string): boolean {
    return role === Roles.ADMIN;
  }

  save(section: SectionResponse): void {
    this.savingIds.add(section.idSection);

    if (this.parentSectionIds.has(section.idSection) && section.idParent !== null) {
      this.showResult('Une section parent ne peut pas avoir de parent.', true);
      this.savingIds.delete(section.idSection);
      return;
    }

    this.routeService.updateSection(section).subscribe({
      next: (updated) => {
        this.savingIds.delete(section.idSection);
        this.showResult(`La section « ${updated.nom} » a été mise à jour avec succès.`);
        queueMicrotask(() => {
          const idx = this.sections.findIndex(s => s.idSection === section.idSection);
          if (idx >= 0) {
            this.sections[idx] = this.normalizeSectionRoles({ ...updated });
          }
          this.rebuildSectionLookups();
          this.updateDisplayedSections();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error(err);
        this.savingIds.delete(section.idSection);
        this.showResult(this.extractErrorMessage(err, 'Échec de la mise à jour de la section.'), true);
      }
    });
  }

  onFilterChange(value: string): void {
    this.filterText = value ?? '';
    this.updateDisplayedSections();
  }

  createSection(): void {
    if (!this.newSectionNom.trim() || !this.newSectionPath.trim()) {
      this.showResult('Le nom et le path sont requis.', true);
      return;
    }

    this.creating = true;

    const newSection: Partial<SectionResponse> = {
      nom: this.newSectionNom.trim(),
      path: this.newSectionPath.trim(),
      rolesCanRead: [...this.newSectionRolesCanRead],
      rolesCanWrite: [...this.newSectionRolesCanWrite],
      idParent: this.newSectionParentId,
      supprimed: false
    };

    this.routeService.createSection(newSection).subscribe({
      next: (created) => {
        this.creating = false;
        this.showResult(`La section « ${created.nom} » a été créée avec succès.`);
        queueMicrotask(() => {
          this.sections.push(this.normalizeSectionRoles(created));
          this.rebuildSectionLookups();
          this.updateDisplayedSections();
          this.resetCreateForm();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error(err);
        this.creating = false;
        this.showResult(this.extractErrorMessage(err, 'Échec de la création de la section.'), true);
      }
    });
  }

  showResult(message: string, isError = false): void {
    this.resultModalTitle = isError ? 'Erreur' : 'Succès';
    this.resultModalMessage = message;
    this.resultModalIsError = isError;
    this.showResultModal = true;
    this.cdr.detectChanges();
  }

  closeResultModal(): void {
    this.showResultModal = false;
    this.resultModalTitle = '';
    this.resultModalMessage = '';
    this.resultModalIsError = false;
  }

  trackBySectionId(_index: number, section: SectionResponse): number {
    return section.idSection;
  }

  trackByRole(_index: number, role: string): string {
    return role;
  }

  private resetCreateForm(): void {
    this.newSectionNom = '';
    this.newSectionPath = '';
    this.newSectionParentId = null;
    this.newSectionRolesCanRead = [Roles.USER];
    this.newSectionRolesCanWrite = [Roles.ADMIN];
  }

  private normalizeSectionRoles(section: SectionResponse): SectionResponse {
    return {
      ...section,
      rolesCanRead: this.enforceReadRules(new Set(section.rolesCanRead ?? [])),
      rolesCanWrite: this.enforceWriteRules(new Set(section.rolesCanWrite ?? []))
    };
  }

  private hasRole(roles: string[] | undefined, role: string): boolean {
    return Array.isArray(roles) && roles.includes(role);
  }

  private applyReadToggle(roles: string[] | undefined, role: string, checked: boolean): string[] {
    const current = new Set(roles ?? []);
    if (checked) {
      current.add(role);
    } else {
      current.delete(role);
    }
    return this.enforceReadRules(current);
  }

  private applyWriteToggle(roles: string[] | undefined, role: string, checked: boolean): string[] {
    if (role === Roles.ADMIN && !checked) {
      return this.enforceWriteRules(new Set(roles ?? []));
    }
    const current = new Set(roles ?? []);
    if (checked) {
      current.add(role);
    } else {
      current.delete(role);
    }
    return this.enforceWriteRules(current);
  }

  private enforceReadRules(roles: Set<string>): string[] {
    roles.add(Roles.USER);
    return Array.from(roles);
  }

  private enforceWriteRules(roles: Set<string>): string[] {
    roles.add(Roles.ADMIN);
    return Array.from(roles);
  }

  private updateDisplayedSections(): void {
    const text = this.filterText.trim().toLowerCase();
    this.displayedSections = text
      ? this.sections.filter(section => this.matchesFilter(section, text))
      : this.sections;
  }

  private matchesFilter(section: SectionResponse, text: string): boolean {
    return (section.nom ?? '').toLowerCase().includes(text)
      || (section.path ?? '').toLowerCase().includes(text)
      || String(section.idSection ?? '').includes(text)
      || (section.rolesCanRead ?? []).some(role => role.toLowerCase().includes(text));
  }

  private rebuildSectionLookups(): void {
    this.parentSectionIds = new Set(
      this.sections.map(s => s.idParent).filter((id): id is number => id != null)
    );
    this.parentOptionsForCreate = [...this.sections];
    this.parentOptionsBySectionId.clear();
    for (const section of this.sections) {
      this.parentOptionsBySectionId.set(
        section.idSection,
        this.sections.filter(s => s.idSection !== section.idSection)
      );
    }
  }

  private extractErrorMessage(error: unknown, defaultMsg: string): string {
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

    return httpError?.message || defaultMsg;
  }
}
