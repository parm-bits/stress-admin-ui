import { Injectable } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts: ToastMessage[] = [];
  private toastContainer: HTMLElement | null = null;

  constructor() {
    this.createToastContainer();
  }

  private createToastContainer(): void {
    this.toastContainer = document.createElement('div');
    this.toastContainer.id = 'toast-container';
    this.toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(this.toastContainer);
  }

  showSuccess(title: string, message: string, duration: number = 5000): void {
    this.showToast({
      id: this.generateId(),
      type: 'success',
      title,
      message,
      duration
    });
  }

  showError(title: string, message: string, duration: number = 7000): void {
    this.showToast({
      id: this.generateId(),
      type: 'error',
      title,
      message,
      duration
    });
  }

  showWarning(title: string, message: string, duration: number = 6000): void {
    this.showToast({
      id: this.generateId(),
      type: 'warning',
      title,
      message,
      duration
    });
  }

  showInfo(title: string, message: string, duration: number = 5000): void {
    this.showToast({
      id: this.generateId(),
      type: 'info',
      title,
      message,
      duration
    });
  }

  private showToast(toast: ToastMessage): void {
    this.toasts.push(toast);
    this.renderToast(toast);
  }

  private renderToast(toast: ToastMessage): void {
    if (!this.toastContainer) return;

    const toastElement = document.createElement('div');
    toastElement.setAttribute('data-toast-id', toast.id);
    toastElement.className = `toast-container`;
    toastElement.style.pointerEvents = 'auto';
    
    const icon = this.getIcon(toast.type);
    const borderColor = this.getBorderColor(toast.type);
    const progressColor = this.getProgressColor(toast.type);
    
    toastElement.innerHTML = `
      <div class="toast toast-${toast.type}" style="border-left: 4px solid ${borderColor};">
        <div class="toast-content">
          <div class="toast-icon">${icon}</div>
          <div class="toast-text">
            <div class="toast-title">${toast.title}</div>
            <div class="toast-message">${toast.message}</div>
          </div>
          <button class="toast-close" onclick="this.closest('.toast-container').remove()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="toast-progress">
          <div class="toast-progress-bar" style="background: ${progressColor}; animation: progressBar ${toast.duration || 5000}ms linear forwards;"></div>
        </div>
      </div>
    `;
    
    // Add CSS styles
    this.addToastStyles();
    
    this.toastContainer.appendChild(toastElement);

    // Auto-remove after duration
    setTimeout(() => {
      this.removeToast(toast.id);
    }, toast.duration || 5000);
  }

  private addToastStyles(): void {
    if (document.getElementById('toast-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
      }

      .toast {
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(226, 232, 240, 0.8);
        min-width: 350px;
        max-width: 450px;
        overflow: hidden;
        position: relative;
      }

      .toast-content {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px 20px;
      }

      .toast-icon {
        font-size: 20px;
        margin-top: 2px;
        flex-shrink: 0;
      }

      .toast-text {
        flex: 1;
        min-width: 0;
      }

      .toast-title {
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 4px;
        line-height: 1.3;
      }

      .toast-message {
        font-size: 14px;
        color: #64748b;
        line-height: 1.4;
      }

      .toast-close {
        background: none;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .toast-close:hover {
        background: #f1f5f9;
        color: #64748b;
      }

      .toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: rgba(226, 232, 240, 0.3);
      }

      .toast-progress-bar {
        height: 100%;
        width: 100%;
      }

      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes progressBar {
        from {
          width: 100%;
        }
        to {
          width: 0%;
        }
      }

      @media (max-width: 480px) {
        .toast-container {
          top: 10px;
          right: 10px;
          left: 10px;
        }
        
        .toast {
          min-width: auto;
          max-width: none;
        }
        
        .toast-content {
          padding: 14px 16px;
        }
        
        .toast-title {
          font-size: 15px;
        }
        
        .toast-message {
          font-size: 13px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private getIcon(type: string): string {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  }

  private getBorderColor(type: string): string {
    switch (type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#3b82f6';
    }
  }

  private getProgressColor(type: string): string {
    switch (type) {
      case 'success': return 'linear-gradient(90deg, #10b981, #059669)';
      case 'error': return 'linear-gradient(90deg, #ef4444, #dc2626)';
      case 'warning': return 'linear-gradient(90deg, #f59e0b, #d97706)';
      case 'info': return 'linear-gradient(90deg, #3b82f6, #1d4ed8)';
      default: return 'linear-gradient(90deg, #3b82f6, #1d4ed8)';
    }
  }

  private removeToast(id: string): void {
    const toastElement = this.toastContainer?.querySelector(`[data-toast-id="${id}"]`) as HTMLElement;
    if (toastElement) {
      toastElement.style.animation = 'slideOutRight 0.3s ease-in forwards';
      setTimeout(() => {
        toastElement.remove();
      }, 300);
    }
    this.toasts = this.toasts.filter(toast => toast.id !== id);
  }

  private generateId(): string {
    return 'toast-' + Math.random().toString(36).substr(2, 9);
  }

  // Specific methods for common use cases
  showUseCaseCreated(useCaseName: string): void {
    this.showSuccess(
      'Use Case Created Successfully! 🎉',
      `"${useCaseName}" has been created successfully. You can now run it from the Use Cases table.`,
      6000
    );
  }

  showTestStarted(testName: string): void {
    this.showInfo(
      'Test Started',
      `"${testName}" is now running. Check the status monitor for real-time updates.`,
      5000
    );
  }

  showTestCompleted(testName: string, status: 'success' | 'failed'): void {
    if (status === 'success') {
      this.showSuccess(
        'Test Completed Successfully! ✅',
        `"${testName}" has completed successfully. Check the summary report for detailed results.`,
        6000
      );
    } else {
      this.showError(
        'Test Failed ❌',
        `"${testName}" has failed. Please check the logs and try again.`,
        7000
      );
    }
  }

  showFileUploaded(fileName: string): void {
    this.showSuccess(
      'File Uploaded Successfully! 📁',
      `"${fileName}" has been uploaded and is ready for processing.`,
      5000
    );
  }
}
