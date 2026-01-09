import { TestBed } from '@angular/core/testing';

import { VaultState } from './vault-state';

describe('VaultState', () => {
  let service: VaultState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VaultState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
