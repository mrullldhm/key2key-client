import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasswordGenerator } from './password-generator';

describe('PasswordGenerator', () => {
  let component: PasswordGenerator;
  let fixture: ComponentFixture<PasswordGenerator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordGenerator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PasswordGenerator);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
