import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { SiteBodyResponse } from '../../model/article-response.model';
import { SiteBodyService } from '../../services/site-body.service';

@Component({
  selector: 'app-admin-edit-site',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-edit-site.component.html',
  styleUrl: './admin-edit-site.component.css',
})
export class AdminEditSiteComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly siteBodyService = inject(SiteBodyService);

  form: FormGroup = this.fb.nonNullable.group({
    titre: ['', Validators.required],
    basDePage: ['', Validators.required],
    couleurPrincipale: ['#094609', Validators.required],
    couleurSecondaire: ['#0c6a3a', Validators.required],
  });

  loading = false;
  saving = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  logoPreview: string[] = [];

  private currentSiteBody: SiteBodyResponse | null = null;
  private selectedLogoBase64: string | null = null;
  private shouldRemoveLogo = false;
  private previewObjectUrl: string | null = null;
  private readonly subscriptions = new Subscription();

  ngOnInit(): void {
    this.loading = true;
    const sub = this.siteBodyService
      .getSiteBody()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (siteBody) => this.applySiteBody(siteBody),
        error: (error) => {
          console.error(error);
          this.errorMessage = 'Impossible de charger les informations du site.';
        },
      });

    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.revokePreviewObjectUrl();
  }

  get hasLogo(): boolean {
    return this.logoPreview.length > 0 || this.selectedLogoBase64 !== null;
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.shouldRemoveLogo = false;
    this.revokePreviewObjectUrl();
    this.previewObjectUrl = URL.createObjectURL(file);
    this.logoPreview = [this.previewObjectUrl];

    // Convertir le fichier en base64
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const commaIndex = result.indexOf(',');
        this.selectedLogoBase64 = commaIndex >= 0 ? result.substring(commaIndex + 1) : result;
      }
    };
    reader.onerror = () => {
      this.errorMessage = 'Erreur lors de la lecture du fichier.';
      this.selectedLogoBase64 = null;
      this.logoPreview = [];
      this.revokePreviewObjectUrl();
    };
    reader.readAsDataURL(file);
  }

  onRemoveLogo(): void {
    this.shouldRemoveLogo = true;
    this.selectedLogoBase64 = null;
    this.logoPreview = [];
    this.revokePreviewObjectUrl();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { titre, basDePage, couleurPrincipale, couleurSecondaire } = this.form.getRawValue();
    
    let logoValue = '';
    if (this.shouldRemoveLogo) {
      logoValue = '';
    } else if (this.selectedLogoBase64) {
      logoValue = this.selectedLogoBase64;
    } else if (this.currentSiteBody?.logo) {
      logoValue = this.currentSiteBody.logo;
    }

    const payload: SiteBodyResponse = {
      titre,
      basDePage,
      couleurPrincipale,
      couleurSecondaire,
      logo: logoValue,
    };

    this.saving = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.siteBodyService
      .updateSiteBody(payload)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (updated) => {
          this.applySiteBody(updated);
          this.successMessage = 'Paramètres enregistrés avec succès.';
          this.shouldRemoveLogo = false;
          this.selectedLogoBase64 = null;
          this.revokePreviewObjectUrl();
        },
        error: (error) => {
          console.error(error);
          this.errorMessage = "Impossible d'enregistrer les paramètres du site.";
        },
      });
  }

  private applySiteBody(siteBody: SiteBodyResponse): void {
    this.currentSiteBody = siteBody;
    this.shouldRemoveLogo = false;
    this.selectedLogoBase64 = null;
    this.revokePreviewObjectUrl();
    this.form.patchValue({
      titre: siteBody.titre ?? '',
      basDePage: siteBody.basDePage ?? '',
      couleurPrincipale: siteBody.couleurPrincipale ?? '#094609',
      couleurSecondaire: siteBody.couleurSecondaire ?? '#0c6a3a',
    });

    const logoSrc = this.siteBodyService.resolveLogoSource(siteBody.logo);
    this.logoPreview = logoSrc ? [logoSrc] : [];
  }

  private revokePreviewObjectUrl(): void {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
  }
}

