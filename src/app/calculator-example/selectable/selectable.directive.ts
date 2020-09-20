import { Directive, HostListener, EventEmitter, OnInit, ElementRef, Output, OnDestroy, Input } from '@angular/core';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { BehaviorSubject, Subject } from 'rxjs';

@Directive({
  selector: '[appSelectable]',
  exportAs: 'selectable'
})
export class SelectableDirective implements OnInit, OnDestroy {
  private unsubscribe = new Subject<void>();

  private isSelected = new BehaviorSubject(false);
  @Output()
  selectedChange = new EventEmitter<boolean>();
  @Input()
  set selected(value: boolean) {
    this.isSelected.next(value);
  }
  get selected(): boolean {
    return this.isSelected.value;
  }

  @Input()
  allowMultiSelection = false;

  @Input()
  ignoreOutsideOf: HTMLElement = null;

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    event.preventDefault();
    this.elementClicked(event);
    console.log('touchstart', event.target);
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    console.log('touchend', event.target);
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: MouseEvent) {
    this.elementClicked(event);
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    this.elementClicked(event);
  }

  private elementClicked(event: MouseEvent | TouchEvent) {
    switch (event.type) {
      case 'click':
        this.isSelected.next(!this.isSelected.value);
        break;
      case 'contextmenu':
        this.isSelected.next(true);
        break;
      // TODO: handle touch events
      default:
        return;
    }
    event.preventDefault();
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Ignore clicks happening outside the ignoreOutsideOf element.
    if (!this.shouldIgnore(event.target as HTMLElement)) {
      return;
    }
    // If the user clicked the same element again, the event will be handled by the onClick listener.
    if (event.target === this.element.nativeElement) {
      // return;
    }
    if (this.allowMultiSelection) {
      // Don't de-select this element when the ctrl key is pressed
      if ((event.button === 0 || event.button === 2) && event.ctrlKey) {
        return;
      }
      // Don't de-select this element when right-clicking and this element is already selected, as
      // the right-click could be used to open a context menu.
      if (event.button === 2 && this.isSelected.value) {
        return;
      }
    }
    this.isSelected.next(false);
  }

  constructor(
    private element: ElementRef
  ) { }

  private shouldIgnore(target: HTMLElement): boolean {
    if (this.ignoreOutsideOf === null) {
      return true;
    }
    let next = target;
    while (!!next) {
      if (next === this.ignoreOutsideOf) {
        return true;
      }
      next = next.parentElement;
    }
    return false;
  }

  ngOnInit() {
    this.isSelected.pipe(
      distinctUntilChanged(),
      takeUntil(this.unsubscribe)
    ).subscribe(this.selectedChange);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
