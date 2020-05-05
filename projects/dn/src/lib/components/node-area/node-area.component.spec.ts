import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeAreaComponent } from './node-area.component';

describe('NodeAreaComponent', () => {
  let component: NodeAreaComponent;
  let fixture: ComponentFixture<NodeAreaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NodeAreaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
