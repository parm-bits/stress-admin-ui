import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

export interface ServerConfig {
  protocol: string;
  server: string;
  port: string;
}

@Component({
  selector: 'app-server-config',
  templateUrl: './server-config.component.html',
  styleUrls: ['./server-config.component.css']
})
export class ServerConfigComponent implements OnInit {
  @Input() useCaseId: string = '';
  @Input() useCaseName: string = '';
  @Output() configSaved = new EventEmitter<ServerConfig>();
  @Output() configCancelled = new EventEmitter<void>();

  serverConfig: ServerConfig = {
    protocol: 'http',
    server: '3.137.176.31',
    port: '8082'
  };

  isVisible: boolean = false;
  isLoading: boolean = false;

  constructor() { }

  ngOnInit(): void {
    this.loadDefaultConfig();
  }

  show(): void {
    this.isVisible = true;
  }

  hide(): void {
    this.isVisible = false;
  }

  loadDefaultConfig(): void {
    // Load default configuration or from localStorage
    const savedConfig = localStorage.getItem(`server-config-${this.useCaseId}`);
    if (savedConfig) {
      this.serverConfig = JSON.parse(savedConfig);
    }
  }

  saveConfig(): void {
    this.isLoading = true;
    
    // Save to localStorage
    localStorage.setItem(`server-config-${this.useCaseId}`, JSON.stringify(this.serverConfig));
    
    // Simulate API call delay
    setTimeout(() => {
      this.isLoading = false;
      this.configSaved.emit(this.serverConfig);
      this.hide();
    }, 1000);
  }

  cancelConfig(): void {
    this.configCancelled.emit();
    this.hide();
  }

  resetToDefaults(): void {
    this.serverConfig = {
      protocol: 'http',
      server: '3.137.176.31',
      port: '8080'
    };
  }

  validateConfig(): boolean {
    return !!(
      this.serverConfig.protocol &&
      this.serverConfig.server &&
      this.serverConfig.port &&
      this.serverConfig.port.match(/^\d+$/) // Port should be numeric
    );
  }
}
