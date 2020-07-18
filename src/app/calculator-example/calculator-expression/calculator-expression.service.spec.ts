import { TestBed } from '@angular/core/testing';

import { CalculatorExpressionService } from './calculator-expression.service';

describe('CalculatorExpressionService', () => {
  let service: CalculatorExpressionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CalculatorExpressionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('variables', () => {
    it('can create', () => {
      /* When */
      const v = service.addVariable(0);

      /* Then */
      expect(v.inputCount).toBe(1);
      expect(service.getVariable(v.id)).toBe(v);
    });

    it('can directly read variables', () => {
      /* When */
      const v = service.addVariable(1337);

      /* Then */
      expect(v.value).toEqual(1337);
    });

    it('can directly change variable values', () => {
      /* Given */
      const v = service.addVariable(1337);
      let value: number;
      v.output.subscribe(o => value = o);

      /* When */
      v.value = 42;

      /* Then */
      expect(v.value).toEqual(42);
      expect(value).toEqual(42);
    });

    it('overwrites the stored value with the input\'s value', () => {
      /* Given */
      const v1 = service.addVariable(0);
      const v2 = service.addVariable(1);

      /* When */
      v2.setInput(0, v1);

      /* Then */
      expect(v2.value).toEqual(0);

      /* When */
      v1.value = 42;

      /* Then */
      expect(v2.value).toEqual(42);
    });

    it('stops overwriting the stored value with the input\'s value after disconnecting', () => {
      /* Given */
      const v1 = service.addVariable(0);
      const v2 = service.addVariable(1);
      v2.setInput(0, v1);

      /* When */
      v2.clearInputs();
      v1.value = 42;

      /* Then */
      expect(v2.value).toEqual(0);
    });
  });

  describe('expressions', () => {
    it('can create', () => {
      /* When */
      const e = service.addExpression<number, number>(2, i => i.filter(x => x !== null).reduce((a, b) => a + b, 0));

      /* Then */
      expect(service.nodes).toContain(e);
      expect(e.inputCount).toBe(2);
    });

    it('calculates expressions', () => {
      /* Given */
      const e = service.addExpression<number, number>(2, i => i.filter(x => x !== null).reduce((a, b) => a + b, 0));
      const v1 = service.addVariable(1);
      const v2 = service.addVariable(2);
      const results: number[] = [];
      e.output.subscribe(o => results.push(o));

      /* When */
      e.setInput(0, v1);
      e.setInput(1, v2);
      v1.value = 3;
      v2.value = 4;
      e.clearInput(0);
      e.clearInput(1);
      e.setInput(0, v1);
      e.setInput(1, v2);
      e.clearInputs();

      /* Then */
      expect(results).toEqual([
        0, 1, 3, 5, 7, 4, 0, 3, 7, 0
      ]);
    });
  });
});
