import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-variable-node',
  templateUrl: './variable-node.component.html',
  styleUrls: ['./variable-node.component.scss']
})
export class VariableNodeComponent<T> implements OnInit {

  @Input()
  nodeKey: number;

  @Input()
  variable: any;

  @Input()
  value: any;

  @Output()
  valueChange = new EventEmitter<any>();

  get inputPortKey() { return `${this.nodeKey}_input`; }
  get outputPortKey() { return `${this.nodeKey}_output`; }

  constructor() { }

  ngOnInit(): void {
  }

}
