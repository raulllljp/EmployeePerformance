import { Directive, Input, OnChanges, SimpleChanges, ElementRef, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appTopPerformer]',
  standalone: true
})
export class TopPerformerDirective implements OnChanges {
  @Input('appTopPerformer') rating: number = 0;
  @Input() topThreshold: number = 4.5;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.applyHighlight();
  }

  private applyHighlight(): void {
    const element = this.el.nativeElement;
    if (this.rating >= this.topThreshold) {
      this.renderer.addClass(element, 'top-performer');
      this.renderer.setStyle(element, 'border-left', '4px solid #4caf50');
      this.renderer.setStyle(element, 'background-color', 'rgba(76,175,80,0.05)');
      this.renderer.setAttribute(element, 'title', `Top Performer: ${this.rating.toFixed(1)} rating`);
    } else if (this.rating >= 4.0) {
      this.renderer.removeClass(element, 'top-performer');
      this.renderer.setStyle(element, 'border-left', '4px solid #2196f3');
      this.renderer.setStyle(element, 'background-color', 'rgba(33,150,243,0.03)');
      this.renderer.removeAttribute(element, 'title');
    } else {
      this.renderer.removeClass(element, 'top-performer');
      this.renderer.removeStyle(element, 'border-left');
      this.renderer.removeStyle(element, 'background-color');
      this.renderer.removeAttribute(element, 'title');
    }
  }
}
