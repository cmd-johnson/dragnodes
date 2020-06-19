import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TestGraphComponent } from './test-graph.component';

describe('TestGraphComponent', () => {
  let component: TestGraphComponent;
  let fixture: ComponentFixture<TestGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TestGraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
