import { Component, OnInit } from '@angular/core';
import { UseCaseService } from '../../services/usecase.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  jmeterPath: string = '';
  isLoading: boolean = false;
  message: string = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private useCaseService: UseCaseService) { }

  ngOnInit(): void {
    this.loadCurrentSettings();
  }

  loadCurrentSettings(): void {
    this.useCaseService.getSettings().subscribe({
      next: (settings) => {
        this.jmeterPath = settings.jmeterPath || '';
      },
      error: (error) => {
        console.error('Error loading settings:', error);
        this.showMessage('Error loading settings', 'error');
      }
    });
  }

  onSave(): void {
    if (!this.jmeterPath.trim()) {
      this.showMessage('Please enter a valid JMeter path', 'error');
      return;
    }

    // Validate that the path ends with .sh for JMeter script
    if (!this.jmeterPath.trim().endsWith('.sh')) {
      this.showMessage('JMeter path should end with .sh (e.g., /opt/jmeter/bin/jmeter.sh)', 'error');
      return;
    }

    this.isLoading = true;
    this.useCaseService.updateSettings({ jmeterPath: this.jmeterPath.trim() }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showMessage('Settings saved successfully!', 'success');
      },
      error: (error) => {
        this.isLoading = false;
        this.showMessage('Error saving settings: ' + (error.error?.error || error.message), 'error');
      }
    });
  }

  onBrowse(): void {
    // Create a file input element for browsing
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.sh';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.jmeterPath = file.path || file.name;
      }
    };
    input.click();
  }

  showMessage(text: string, type: 'success' | 'error'): void {
    this.message = text;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }
}