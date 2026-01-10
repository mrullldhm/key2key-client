import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Access } from './access';

describe('Access', () => {
  let component: Access;
  let fixture: ComponentFixture<Access>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Access]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Access);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
