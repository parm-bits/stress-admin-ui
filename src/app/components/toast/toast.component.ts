import { Component, Input, OnInit, OnDestroy } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastComponent implements OnInit, OnDestroy {
  @Input() message!: ToastMessage;
  
  private timeoutId: any;

  ngOnInit(): void {
    // Auto-dismiss after duration (default 5 seconds)
    const duration = this.message.duration || 5000;
    this.timeoutId = setTimeout(() => {
      this.dismiss();
    }, duration);
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  dismiss(): void {
    // This will be handled by the parent component
    const toastElement = document.querySelector(`[data-toast-id="${this.message.id}"]`);
    if (toastElement) {
      toastElement.classList.add('toast-dismiss');
      setTimeout(() => {
        toastElement.remove();
      }, 300);
    }
  }

  getIconClass(): string {
    switch (this.message.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  }

  getToastClass(): string {
    return `toast toast-${this.message.type}`;
  }
}
