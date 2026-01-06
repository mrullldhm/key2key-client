import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VaultNavbar } from './vault-navbar';

describe('VaultNavbar', () => {
  let component: VaultNavbar;
  let fixture: ComponentFixture<VaultNavbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VaultNavbar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VaultNavbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
