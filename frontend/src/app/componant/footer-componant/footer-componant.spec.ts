import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterComponant } from './footer-componant';

describe('FooterComponant', () => {
  let component: FooterComponant;
  let fixture: ComponentFixture<FooterComponant>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponant]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FooterComponant);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
