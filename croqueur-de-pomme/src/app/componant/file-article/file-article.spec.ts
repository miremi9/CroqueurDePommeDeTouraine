import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileArticle } from './file-article';

describe('FileArticle', () => {
  let component: FileArticle;
  let fixture: ComponentFixture<FileArticle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileArticle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileArticle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
