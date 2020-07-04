import { TestBed } from '@angular/core/testing';

import { CalculatorExpressionServiceService } from './calculator-expression-service.service';

describe('CalculatorExpressionServiceService', () => {
  let service: CalculatorExpressionServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CalculatorExpressionServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
