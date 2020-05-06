import { TestBed } from '@angular/core/testing';

import { GraphConnectionsService } from './graph-connections.service';

describe('GraphConnectionsService', () => {
  let service: GraphConnectionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GraphConnectionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
