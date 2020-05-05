import { Component, OnInit, ElementRef, Input } from '@angular/core';

import interact from 'interactjs';

@Component({
  selector: 'dn-draggable',
  templateUrl: './draggable.component.html',
  styleUrls: ['./draggable.component.scss']
})
export class DraggableComponent implements OnInit {

  private x = 0;
  private y = 0;

  constructor(
    private element: ElementRef
  ) { }

  ngOnInit(): void {
    const element = this.element.nativeElement;

    interact(element).draggable({
      inertia: false,
      modifiers: [
        interact.modifiers.restrictRect({
          restriction: 'parent',
          endOnly: false
        })
      ],
      autoScroll: true,
      onmove: this.dragMoveListener.bind(this)
    });
  }

  private dragMoveListener(event) {
    const element: HTMLElement = this.element.nativeElement;

    this.x += event.dx;
    this.y += event.dy;

    element.style.transform = `translate(${this.x}px, ${this.y}px)`;
  }

}
