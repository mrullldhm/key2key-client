import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FirstTimer } from './first-timer';

describe('FirstTimer', () => {
  let component: FirstTimer;
  let fixture: ComponentFixture<FirstTimer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FirstTimer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FirstTimer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
