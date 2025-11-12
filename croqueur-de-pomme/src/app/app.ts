import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponant } from './componant/header-componant/header-componant';
import { FooterComponant } from './componant/footer-componant/footer-componant';
import { SiteBodyService } from './services/site-body.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponant, FooterComponant],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  constructor(private siteBodyService: SiteBodyService) {}

  ngOnInit(): void {
    this.siteBodyService.ensureLoaded();
  }
}
