import { TestBed } from '@angular/core/testing';

import { DraggedConnectionsService } from './dragged-connections.service';

describe('DraggedConnectionsService', () => {
  let service: DraggedConnectionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DraggedConnectionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
