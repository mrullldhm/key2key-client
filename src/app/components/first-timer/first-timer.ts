import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-first-timer',
  imports: [],
  templateUrl: './first-timer.html',
  styleUrl: './first-timer.scss',
})
export class FirstTimer {
  @Output() addFirst = new EventEmitter<void>();

  addPassword() {
    this.addFirst.emit();
  }
}
