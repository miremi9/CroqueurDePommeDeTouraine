import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { UserResponse } from '../../model/article-response.model';
import { Roles } from '../../model/roles';
import { AuthService } from '../../services/auth.service';
import { RoleService, RoleDAO } from '../../services/role.service';


@Component({
  selector: 'app-admin-edit-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-edit-users.component.html',
  styleUrl: './admin-edit-users.component.css'
})
export class AdminEditRoleComponent {
  users: UserResponse[] = [];
  displayedUsers: UserResponse[] = [];
  loading = false;
  error: string | null = null;
  roleKeys: string[] = [];
  savingIds = new Set<UserResponse['idUser']>();
  cdr: ChangeDetectorRef;
  filterText: string = '';
  newUserNom: string = '';
  newUserRoles = new Set<string>();

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private roleService: RoleService
  ) {
    this.cdr = inject(ChangeDetectorRef);
    this.loadUsers();
    this.loadRoles();
  }

  private loadUsers(): void {
    this.loading = true;
    this.error = null;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        console.log(users);
        this.users = users || [];
        this.updateDisplayedUsers();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Impossible de charger les utilisateurs.';
        console.error(err);
      }
    });
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

  hasRole(user: UserResponse, role: string): boolean {
    return Array.isArray(user.roles) && user.roles.includes(role);
  }

  onToggle(user: UserResponse, role: string, checked: boolean): void {
    // Empêcher un admin de se retirer le rôle ADMIN
    const currentUserId = this.authService.getId();
    const isCurrentUser = currentUserId && user.idUser === currentUserId;
    const hasAdminRole = this.authService.getRoles().includes(Roles.ADMIN);
    
    if (isCurrentUser && hasAdminRole && role === Roles.ADMIN && !checked) {
      this.error = 'Vous ne pouvez pas vous retirer le rôle ADMIN.';
      return;
    }
    
    const current = new Set(user.roles || []);
    if (checked) {
      current.add(role);
    } else {
      current.delete(role);
    }
    user.roles = Array.from(current);
    this.error = null; // Réinitialiser l'erreur si la modification est valide
  }

  save(user: UserResponse): void {
    // Vérifier si l'utilisateur modifié est l'utilisateur connecté
    const currentUserId = this.authService.getId();
    const isCurrentUser = currentUserId && user.idUser === currentUserId;
    const hasAdminRole = this.authService.getRoles().includes(Roles.ADMIN);
    
    // Empêcher un admin de se retirer le rôle ADMIN
    if (isCurrentUser && hasAdminRole) {
      if (!user.roles || !user.roles.includes(Roles.ADMIN)) {
        this.error = 'Vous ne pouvez pas vous retirer le rôle ADMIN.';
        return;
      }
    }
    
    this.savingIds.add(user.idUser);
    this.userService.updateUser(user).subscribe({
      next: (updated) => {
        const idx = this.users.findIndex(u => u.idUser === user.idUser);
        if (idx >= 0) this.users[idx] = { ...this.users[idx], roles: updated.roles };
        this.savingIds.delete(user.idUser);
        this.updateDisplayedUsers();
        this.error = null;
      },
      error: (err) => {
        console.error(err);
        this.savingIds.delete(user.idUser);
        this.error = 'Échec de la mise à jour des rôles.';
      }
    });
  }

  onFilterChange(value: string): void {
    this.filterText = value || '';
    this.updateDisplayedUsers();
  }

  private updateDisplayedUsers(): void {
    const text = this.filterText.trim().toLowerCase();
    if (!text) {
      this.displayedUsers = [...this.users];
      return;
    }
    this.displayedUsers = this.users.filter(u => {
      const byName = (u.nom || '').toLowerCase().includes(text);
      const byRole = Array.isArray(u.roles) && u.roles.some(r => r.toLowerCase().includes(text));
      const byId = (u.idUser || '').toLowerCase().includes(text);
      return byName || byRole || byId;
    });
  }

  toggleNewRole(role: string, checked: boolean): void {
    if (checked) {
      this.newUserRoles.add(role);
    } else {
      this.newUserRoles.delete(role);
    }
  }

  isCurrentUser(user: UserResponse): boolean {
    const currentUserId = this.authService.getId();
    return currentUserId !== null && user.idUser === currentUserId;
  }

  isAdminRoleDisabled(user: UserResponse, role: string): boolean {
    if (role !== Roles.ADMIN) {
      return false;
    }
    const isCurrentUser = this.isCurrentUser(user);
    const hasAdminRole = this.authService.getRoles().includes(Roles.ADMIN);
    return isCurrentUser && hasAdminRole;
  }

}

