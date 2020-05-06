import { Directive, Input, ElementRef, HostBinding } from '@angular/core';
import { GraphNode } from '../../data/graph-types';
import { Position } from '../../data/position';

const position = Symbol('position');

@Directive({
  selector: '[dnNode]'
})
export class NodeDirective {

  @HostBinding('style.transform')
  private elementTransform: string;

  @Input()
  node: GraphNode;

  [position]: Position = { x: 0, y: 0 };

  @Input()
  set position(v: Position) {
    this[position] = v;
    this.updatePosition();
  }
  get position(): Position {
    return this[position];
  }

  get nativeElement(): HTMLElement {
    return this.element.nativeElement;
  }

  constructor(
    private element: ElementRef
  ) { }

  private updatePosition() {
    const { x, y } = this.position;
    this.elementTransform = `translate(${x}px, ${y}px)`;
  }

}
