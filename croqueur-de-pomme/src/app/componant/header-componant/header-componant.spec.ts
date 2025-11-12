import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderComponant } from './header-componant';

describe('HeaderComponant', () => {
  let component: HeaderComponant;
  let fixture: ComponentFixture<HeaderComponant>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponant]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderComponant);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
