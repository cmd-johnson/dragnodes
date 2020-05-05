import { Directive, ElementRef, OnInit, HostBinding, Input, Output, EventEmitter } from '@angular/core';
import interact from 'interactjs';

@Directive({
  selector: '[dnDraggable]'
})
export class DraggableDirective implements OnInit {
  @HostBinding('style.touch-action')
  touchAction = 'none';

  @Input()
  dragAreaPadding = 0;

  @Input()
  private posX = 1;

  @Output()
  public readonly posXChange = new EventEmitter<number>();

  @Input()
  private posY = 1;

  @Output()
  public readonly posYChange = new EventEmitter<number>();

  constructor(
    private element: ElementRef
  ) { }

  ngOnInit(): void {
    const element = this.element.nativeElement;

    const p = this.dragAreaPadding;

    interact(element).draggable({
      inertia: false,
      modifiers: [
        interact.modifiers.restrictRect({
          restriction: 'parent',
          endOnly: false,
          offset: {
            top: p,
            right: p,
            bottom: p,
            left: p
          }
        })
      ],
      autoScroll: true,
      onmove: this.dragMoveListener.bind(this)
    });

    this.setPosition(this.posX, this.posY);
  }

  private dragMoveListener(event) {
    this.posX += event.dx;
    this.posY += event.dy;

    this.setPosition(this.posX, this.posY);

    this.posXChange.emit(this.posX);
    this.posYChange.emit(this.posY);
  }

  private setPosition(x, y) {
    const element: HTMLElement = this.element.nativeElement;
    element.style.transform = `translate(${x}px, ${y}px)`;
  }

}
