import { TestBed } from '@angular/core/testing';

import { ResolvePortService } from './resolve-port.service';

describe('ResolvePortService', () => {
  let service: ResolvePortService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResolvePortService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
