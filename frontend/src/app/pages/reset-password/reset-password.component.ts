import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly form = this.fb.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  loading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  submit(): void {
    this.errorMessage = null;
    this.successMessage = null;

    const token = this.getTokenFromUrl();
    if (!token) {
      this.errorMessage = 'Lien invalide: token manquant.';
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { newPassword, confirmPassword } = this.form.getRawValue();
    if (newPassword !== confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.loading = true;
    this.authService.resetPassword({ token, newPassword }).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Mot de passe reinitialise avec succes.';
        this.form.reset();
        setTimeout(() => this.router.navigateByUrl('/accueil'), 1500);
      },
      error: (err) => {
        this.loading = false;
        const apiMsg = err?.error?.message || err?.error || err?.message;
        this.errorMessage = apiMsg ? String(apiMsg) : 'Echec de la reinitialisation du mot de passe.';
      },
    });
  }

  private getTokenFromUrl(): string {
    const rawToken = this.route.snapshot.queryParamMap.get('token') ?? '';
    return rawToken.replace(/^"+|"+$/g, '').trim();
  }
}
