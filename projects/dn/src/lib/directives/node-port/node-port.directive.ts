import { Directive, ElementRef, Input } from '@angular/core';
import { Port } from '../../data/graph-types';

@Directive({
  selector: '[dnNodePort]'
})
export class NodePortDirective {

  @Input()
  port: Port;

  get nativeElement(): HTMLElement {
    return this.element.nativeElement;
  }

  constructor(
    private element: ElementRef
  ) { }

}
