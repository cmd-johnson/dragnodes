import { TestBed } from '@angular/core/testing';

import { DnService } from './dn.service';

describe('DnService', () => {
  let service: DnService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DnService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
