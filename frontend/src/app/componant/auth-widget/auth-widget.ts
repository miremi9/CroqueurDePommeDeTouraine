import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-widget.html',
  styleUrl: './auth-widget.css'
})
export class AuthWidgetComponent implements OnInit {
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  isAuthenticated = false;
  showModal = false;
  modalMode: 'login' | 'register' = 'login';
  username = '';
  password = '';
  errorMessage: string | null = null;
  lastAuthError: string | null = null;

  constructor() {
    this.authService.isAuthenticated$.subscribe(v => {
      this.isAuthenticated = v;
      // Récupérer le nom d'utilisateur si authentifié
      if (v) {
        this.username = this.authService.getUsername() || '';
        // Utiliser setTimeout pour éviter l'erreur dans le constructeur
        setTimeout(() => this.cdr.detectChanges(), 0);
      } else {
        this.username = '';
      }
    });
  }

  ngOnInit() {
    // Récupérer le nom d'utilisateur au démarrage si déjà authentifié
    if (this.authService.getToken()) {
      this.username = this.authService.getUsername() || '';
      this.cdr.detectChanges();
    }
  }

  openLogin() {
    this.modalMode = 'login';
    this.errorMessage = null;
    this.lastAuthError = null;
    this.username = '';
    this.password = '';
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openRegister() {
    this.modalMode = 'register';
    this.errorMessage = null;
    this.lastAuthError = null;
    this.username = '';
    this.password = '';
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.showModal = false;
    this.cdr.detectChanges();
  }

  onSubmit() {
    this.errorMessage = null;
    const cred = { nom: this.username.trim(), motDePasse: this.password };
    if (!cred.nom || !cred.motDePasse) {
      this.errorMessage = 'Veuillez renseigner les champs.';
      return;
    }
    if (this.modalMode === 'login') {
      this.authService.login(cred).subscribe({
        next: () => {
          this.lastAuthError = null;
          this.showModal = false;
          this.username = cred.nom;
          this.cdr.detectChanges();
        },
        error: (err) => {
          if (err && err.status === 401) {
            this.errorMessage = "Utilisateur ou mot de passe incorrect.";
            this.lastAuthError = this.errorMessage;
          } else {
            this.errorMessage = 'Une erreur est survenue.';
          }
          this.cdr.detectChanges();
        }
      });
    } else {
      this.authService.register(cred).subscribe({
        next: () => {
          this.lastAuthError = null;
          // Affiche une pop-up de succès et ferme la fenêtre
          alert('Compte créé avec succès');
          this.showModal = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          // Affiche le message d'erreur de la requête si disponible
          console.log('erreur d\'inscription', err);
          const apiMsg = err?.error?.message || err?.message;
          this.errorMessage = apiMsg ? String(apiMsg) : "Échec de l'inscription.";
          this.cdr.detectChanges();
        }
      });
    }
  }

  logout() {
    this.authService.logout();
  }
}


