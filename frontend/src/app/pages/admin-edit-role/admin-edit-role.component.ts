import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService, RoleDAO } from '../../services/role.service';

@Component({
  selector: 'app-admin-edit-role',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-edit-role.component.html',
  styleUrl: './admin-edit-role.component.css',
})
export class AdminEditRolePageComponent {
  roles: RoleDAO[] = [];
  loading = false;
  error: string | null = null;
  savingIds = new Set<RoleDAO['idRole']>();
  newRoleName = '';
  creating = false;

  private roleService = inject(RoleService);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    this.loadRoles();
  }

  private loadRoles(): void {
    this.loading = true;
    this.error = null;
    this.roleService.getAllRoles().subscribe({
      next: roles => {
        this.roles = roles || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error(err);
        this.error = 'Impossible de charger les rôles.';
        this.loading = false;
      },
    });
  }

  save(role: RoleDAO): void {
    if (!role.nomRole || !role.nomRole.trim()) {
      this.error = 'Le nom du rôle est requis.';
      return;
    }

    this.savingIds.add(role.idRole ?? '');
    this.roleService.updateRole(role).subscribe({
      next: updated => {
        const idx = this.roles.findIndex(r => r.idRole === updated.idRole);
        if (idx >= 0) {
          this.roles[idx] = { ...updated };
        }
        this.savingIds.delete(role.idRole ?? '');
        this.error = null;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error(err);
        this.savingIds.delete(role.idRole ?? '');
        this.error = 'Échec de la mise à jour du rôle.';
      },
    });
  }

  delete(role: RoleDAO): void {
    if (!role.idRole) {
      this.error = 'Impossible de supprimer un rôle sans identifiant.';
      return;
    }

    this.savingIds.add(role.idRole);
    this.roleService.deleteRole(role.idRole).subscribe({
      next: () => {
        this.roles = this.roles.filter(r => r.idRole !== role.idRole);
        this.savingIds.delete(role.idRole as string);
        this.error = null;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error(err);
        this.savingIds.delete(role.idRole as string);
        this.error = 'Échec de la suppression du rôle.';
      },
    });
  }

  create(): void {
    const name = this.newRoleName.trim();
    if (!name) {
      this.error = 'Le nom du nouveau rôle est requis.';
      return;
    }

    this.creating = true;
    this.error = null;
    const payload: RoleDAO = { nomRole: name };

    this.roleService.createRole(payload).subscribe({
      next: created => {
        this.roles.push(created);
        this.newRoleName = '';
        this.creating = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error(err);
        this.error = 'Échec de la création du rôle.';
        this.creating = false;
      },
    });
  }
}
