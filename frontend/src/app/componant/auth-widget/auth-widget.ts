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
  modalMode: 'login' | 'register' | 'reset' | 'edit-profile' = 'login';
  username = '';
  password = '';
  registerEmail = '';
  resetToken = '';
  resetNewPassword = '';
  profileName = '';
  profileEmail = '';
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
    if (this.authService.getToken() && !this.authService.isTokenExpired()) {
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
    this.resetToken = '';
    this.resetNewPassword = '';
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openRegister() {
    this.modalMode = 'register';
    this.errorMessage = null;
    this.lastAuthError = null;
    this.username = '';
    this.password = '';
    this.registerEmail = '';
    this.resetToken = '';
    this.resetNewPassword = '';
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openEditProfile() {
    const user = this.authService.getUser();
    this.modalMode = 'edit-profile';
    this.errorMessage = null;
    this.lastAuthError = null;
    this.profileName = user?.nom ?? this.username ?? '';
    this.profileEmail = user?.email ?? '';
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
    if (this.modalMode !== 'reset' && (!cred.nom || !cred.motDePasse)) {
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
    } else if (this.modalMode === 'edit-profile') {
      this.onEditProfileSubmit();
    } else if (this.modalMode === 'reset') {
      this.onResetSubmit();
    } else {
      // registration branch: require name, email, password
      const nom = this.username.trim();
      const email = this.registerEmail.trim();
      const motDePasse = this.password;

      if (!nom || !email || !motDePasse) {
        this.errorMessage = 'Veuillez renseigner le nom, l\'email et le mot de passe.';
        return;
      }
      // simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        this.errorMessage = 'Adresse email invalide.';
        return;
      }

      this.authService.register({ nom, motDePasse, email }).subscribe({
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
          if (err && err.status === 400) {
            alert('ok');
            return;
          }
          const apiMsg = err?.error?.message || err?.message;
          this.errorMessage = apiMsg ? String(apiMsg) : "Échec de l'inscription.";
          this.cdr.detectChanges();
        }
      });
    }
  }

  onForgotPassword(): void {
    this.errorMessage = null;
    const email = window.prompt('Entrez votre email pour recevoir le lien de réinitialisation :')?.trim();
    if (!email) {
      return;
    }

    this.authService.forgotPassword({ email }).subscribe({
      next: () => {
        alert('Mail envoyé');
        this.modalMode = 'reset';
        this.resetToken = '';
        this.resetNewPassword = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        const apiMsg = err?.error?.message || err?.error || err?.message;
        this.errorMessage = apiMsg ? String(apiMsg) : 'Échec de l’envoi du mail de réinitialisation.';
        this.cdr.detectChanges();
      }
    });
  }

  private onResetSubmit(): void {
    const token = this.resetToken.trim();
    const newPassword = this.resetNewPassword;
    if (!token || !newPassword) {
      this.errorMessage = 'Veuillez renseigner le token et le nouveau mot de passe.';
      return;
    }

    this.authService.resetPassword({ token, newPassword }).subscribe({
      next: () => {
        alert('Mot de passe réinitialisé avec succès');
        this.modalMode = 'login';
        this.password = '';
        this.resetToken = '';
        this.resetNewPassword = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        const apiMsg = err?.error?.message || err?.error || err?.message;
        this.errorMessage = apiMsg ? String(apiMsg) : 'Échec de la réinitialisation du mot de passe.';
        this.cdr.detectChanges();
      }
    });
  }

  private onEditProfileSubmit(): void {
    const nom = this.profileName.trim();
    const emailValue = this.profileEmail.trim();
    const email = emailValue ? emailValue : null;

    if (!nom) {
      this.errorMessage = 'Le nom est obligatoire.';
      return;
    }

    this.authService.updateProfile({ nom, email }).subscribe({
      next: () => {
        this.username = nom;
        this.showModal = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        const apiMsg = err?.error?.message || err?.error || err?.message;
        this.errorMessage = apiMsg ? String(apiMsg) : 'Échec de la mise à jour du profil.';
        this.cdr.detectChanges();
      }
    });
  }

  logout() {
    this.authService.logout();
  }
}


