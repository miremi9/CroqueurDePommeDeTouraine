import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { NgFor, AsyncPipe, NgIf } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { Subscription, filter, map, combineLatest } from 'rxjs';
import { AuthWidgetComponent } from '../auth-widget/auth-widget';
import { AuthService } from '../../services/auth.service';
import { RouteService } from '../../services/route.service';
import { SectionResponse } from '../../model/article-response.model';
import { Roles } from '../../model/roles';

interface MenuSection {
  section: SectionResponse;
  children: SectionResponse[];
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, RouterLinkActive, AuthWidgetComponent, AsyncPipe],
  templateUrl: './menu.html',
  styleUrl: './menu.css'
})
export class MenuComponent implements OnInit, OnDestroy {
  parentSections: MenuSection[] = [];
  standaloneSections: SectionResponse[] = [];
  private routerSubscription?: Subscription;
  private authService = inject(AuthService);
  private routeService = inject(RouteService);
  private cdr = inject(ChangeDetectorRef);
  
  // Observable pour vérifier si l'utilisateur est admin
  isAdmin$ = this.authService.roles$.pipe(
    map(roles => roles.includes(Roles.ADMIN))
  );

  // Observable pour les rôles de l'utilisateur
  userRoles$ = this.authService.roles$;

  showDropdown: number | null = null;
  showAdminDropdown = false;

  constructor(private router: Router) {}

  onMouseEnterParent(menuSection: MenuSection) {
    this.showDropdown = menuSection.section.idSection;
    console.log('Parent:', menuSection.section.nom, 'Enfants:', menuSection.children);
  }

  onMouseLeaveParent() {
    this.showDropdown = null;
  }

  onMouseEnterAdmin() {
    this.showAdminDropdown = true;
  }

  onMouseLeaveAdmin() {
    this.showAdminDropdown = false;
  }

  ngOnInit() {
    this.loadSections();
    
    // Écoute les changements de route pour mettre à jour le menu
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.loadSections();
      });
    
    // Écoute aussi les changements de configuration
    setTimeout(() => {
      this.loadSections();
    }, 100);
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private loadSections() {
    combineLatest([
      this.routeService.getDynamicRoutes(),
      this.userRoles$
    ]).subscribe(([sections, userRoles]) => {
      // Filtrer les sections selon les permissions utilisateur (lecture)
      const accessibleSections = sections.filter(section => {
        const readRoles = Array.isArray(section.rolesCanRead) ? section.rolesCanRead : [];
        if (readRoles.length === 0) return true;
        return readRoles.some(role => userRoles.includes(role) || role === Roles.ADMIN);
      });

      // Organiser les sections par parent/enfant
      const parentMap = new Map<number, SectionResponse[]>();
      const standalone: SectionResponse[] = [];

      accessibleSections.forEach(section => {
        if (section.idParent === null) {
          // Section parent ou standalone
          if (accessibleSections.some(s => s.idParent === section.idSection)) {
            // C'est un parent
          } else {
            // C'est une section standalone
            standalone.push(section);
          }
        } else {
          // Section enfant
          if (!parentMap.has(section.idParent)) {
            parentMap.set(section.idParent, []);
          }
          parentMap.get(section.idParent)!.push(section);
        }
      });

      // Créer la structure pour le menu
      this.parentSections = Array.from(parentMap.entries())
        .map(([parentId, children]) => {
          const parent = accessibleSections.find(s => s.idSection === parentId);
          return parent ? { section: parent, children } : null;
        })
        .filter((item): item is MenuSection => item !== null);

      this.standaloneSections = standalone;
      this.cdr.detectChanges();
    });
  }
}


