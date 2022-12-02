import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewcubeComponent } from './viewcube.component';

describe('ViewcubeComponent', () => {
  let component: ViewcubeComponent;
  let fixture: ComponentFixture<ViewcubeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewcubeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewcubeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
