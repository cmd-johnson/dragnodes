import { TestBed } from '@angular/core/testing';

import { PortRegistryService } from './port-registry.service';

describe('PortRegistryService', () => {
  let service: PortRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PortRegistryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
