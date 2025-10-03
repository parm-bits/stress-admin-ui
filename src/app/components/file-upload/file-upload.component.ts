import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { UseCaseService } from '../../services/usecase.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent implements OnInit {
  @Output() useCaseCreated = new EventEmitter<any>();
  
  useCaseName: string = '';
  useCaseDescription: string = '';
  jmxFile: File | null = null;
  csvFile: File | null = null;
  isUploading: boolean = false;
  uploadMessage: string = '';
  csvUserCount: number = 0;
  isEditMode: boolean = false;
  editUseCaseId: string = '';
  existingJmxFileName: string = '';
  existingCsvFileName: string = '';
  
  // Thread Group Configuration
  threadGroupConfig = {
    numberOfThreads: 1,
    rampUpPeriod: 1,
    loopCount: 1,
    infiniteLoop: false,
    sameUserOnEachIteration: true,
    delayThreadCreation: false,
    specifyThreadLifetime: false,
    duration: 60,
    startupDelay: 0,
    actionAfterSamplerError: 'Continue'
  };

  // Server Configuration
  serverConfig = {
    protocol: 'http',
    server: '3.137.176.31',
    port: '8082'
  };

  // Preset Server Configurations
  presetConfigs = [
    {
      name: 'Status Testing QA API',
      protocol: 'https',
      server: 'stratustexting-qaapi.beetexting.com',
      port: ''
    },
    {
      name: 'BeeTexting QA API',
      protocol: 'https',
      server: 'qaapi.beetexting.com',
      port: ''
    }
  ];

  constructor(
    private useCaseService: UseCaseService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) { }

  ngOnInit(): void {
    // Check if we're in edit mode
    this.route.queryParams.subscribe(params => {
      if (params['edit'] === 'true') {
        this.isEditMode = true;
        this.editUseCaseId = params['id'] || '';
        
        // Load full use case data from backend
        if (this.editUseCaseId) {
          this.loadUseCaseForEdit(this.editUseCaseId);
        } else {
          // Fallback to query params if no ID
          this.useCaseName = params['name'] || '';
          this.useCaseDescription = params['description'] || '';
          this.existingJmxFileName = params['jmxFile'] || '';
          this.existingCsvFileName = params['csvFile'] || '';
        }
      }
    });
  }

  loadUseCaseForEdit(useCaseId: string): void {
    this.useCaseService.getUseCaseById(useCaseId).subscribe({
      next: (useCase: any) => {
        this.useCaseName = useCase.name || '';
        this.useCaseDescription = useCase.description || '';
        this.existingJmxFileName = useCase.jmxPath ? useCase.jmxPath.split('/').pop() : '';
        this.existingCsvFileName = useCase.csvPath ? useCase.csvPath.split('/').pop() : '';
        
        // Parse configurations from dedicated fields if they exist
        this.parseConfigurationsFromDescription(useCase);
      },
      error: (error: any) => {
        console.error('Error loading use case for edit:', error);
        this.toastService.showError(
          'Error Loading Use Case',
          'Failed to load use case data for editing. Please try again.',
          5000
        );
      }
    });
  }

  parseConfigurationsFromDescription(useCase: any): void {
    try {
      console.log('=== PARSING CONFIGURATIONS FOR EDIT ===');
      console.log('Raw useCase data:', useCase);
      
      // Parse ThreadGroupConfig from dedicated field
      if (useCase.threadGroupConfig) {
        console.log('Raw threadGroupConfig:', useCase.threadGroupConfig);
        const config = JSON.parse(useCase.threadGroupConfig);
        console.log('Parsed threadGroupConfig:', config);
        this.threadGroupConfig = { ...this.threadGroupConfig, ...config };
        
        // Ensure proper data types for form binding
        this.threadGroupConfig.numberOfThreads = Number(this.threadGroupConfig.numberOfThreads) || 1;
        this.threadGroupConfig.rampUpPeriod = Number(this.threadGroupConfig.rampUpPeriod) || 1;
        this.threadGroupConfig.loopCount = Number(this.threadGroupConfig.loopCount) || 1;
        this.threadGroupConfig.duration = Number(this.threadGroupConfig.duration) || 60;
        this.threadGroupConfig.startupDelay = Number(this.threadGroupConfig.startupDelay) || 0;
        this.threadGroupConfig.infiniteLoop = Boolean(this.threadGroupConfig.infiniteLoop);
        this.threadGroupConfig.sameUserOnEachIteration = Boolean(this.threadGroupConfig.sameUserOnEachIteration);
        this.threadGroupConfig.delayThreadCreation = Boolean(this.threadGroupConfig.delayThreadCreation);
        this.threadGroupConfig.specifyThreadLifetime = Boolean(this.threadGroupConfig.specifyThreadLifetime);
        
        console.log('Final threadGroupConfig:', this.threadGroupConfig);
      } else {
        console.log('No threadGroupConfig found in useCase');
      }
      
      // Parse ServerConfig from dedicated field
      if (useCase.serverConfig) {
        console.log('Raw serverConfig:', useCase.serverConfig);
        const config = JSON.parse(useCase.serverConfig);
        console.log('Parsed serverConfig:', config);
        this.serverConfig = { ...this.serverConfig, ...config };
        console.log('Final serverConfig:', this.serverConfig);
      } else {
        console.log('No serverConfig found in useCase');
      }
      
      console.log('=== CONFIGURATION PARSING COMPLETE ===');
      
      // Force change detection to update the form
      setTimeout(() => {
        console.log('Form values after timeout:', {
          delayThreadCreation: this.threadGroupConfig.delayThreadCreation,
          startupDelay: this.threadGroupConfig.startupDelay,
          infiniteLoop: this.threadGroupConfig.infiniteLoop,
          specifyThreadLifetime: this.threadGroupConfig.specifyThreadLifetime
        });
      }, 100);
      
    } catch (error) {
      console.error('Error parsing configurations:', error);
    }
  }

  onJmxFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.name.toLowerCase().endsWith('.jmx')) {
      this.jmxFile = file;
    } else {
      alert('Please select a valid .jmx file');
      event.target.value = '';
    }
  }

  onCsvFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.name.toLowerCase().endsWith('.csv')) {
      this.csvFile = file;
      this.countUsersInCsv(file);
    } else {
      alert('Please select a valid .csv file');
      event.target.value = '';
      this.csvUserCount = 0;
    }
  }

  removeJmxFile(): void {
    this.jmxFile = null;
    // Reset the file input
    const fileInput = document.getElementById('jmxFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onInfiniteLoopChange(event: any): void {
    console.log('=== INFINITE LOOP CHANGE EVENT ===');
    console.log('Event target checked:', event.target.checked);
    console.log('Event target value:', event.target.value);
    console.log('Current threadGroupConfig.infiniteLoop:', this.threadGroupConfig.infiniteLoop);
    console.log('Current threadGroupConfig.loopCount:', this.threadGroupConfig.loopCount);
    
    // Force update the model value
    this.threadGroupConfig.infiniteLoop = event.target.checked;
    
    // Also ensure proper boolean conversion
    this.threadGroupConfig.infiniteLoop = Boolean(event.target.checked);
    
    console.log('After update - infiniteLoop:', this.threadGroupConfig.infiniteLoop);
    console.log('After update - loopCount:', this.threadGroupConfig.loopCount);
    console.log('=== CHANGE EVENT COMPLETE ===');
  }

  removeCsvFile(): void {
    this.csvFile = null;
    this.csvUserCount = 0;
    // Reset the file input
    const fileInput = document.getElementById('csvFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  countUsersInCsv(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        const lines = csvContent.split('\n').filter(line => line.trim() !== '');
        
        // Count non-empty lines (excluding header if present)
        // Assuming first line might be header, so we count lines - 1
        // But if all lines look like data, we count all lines
        let userCount = lines.length;
        
        // Check if first line looks like a header (contains common header words)
        const firstLine = lines[0]?.toLowerCase() || '';
        const headerKeywords = ['username', 'user', 'email', 'id', 'name', 'login', 'password'];
        const isHeader = headerKeywords.some(keyword => firstLine.includes(keyword));
        
        if (isHeader && lines.length > 1) {
          userCount = lines.length - 1; // Exclude header
        }
        
        this.csvUserCount = userCount;
      } catch (error) {
        console.error('Error reading CSV file:', error);
        this.csvUserCount = 0;
      }
    };
    reader.readAsText(file);
  }

  applyPresetConfig(preset: any): void {
    this.serverConfig = {
      protocol: preset.protocol,
      server: preset.server,
      port: preset.port
    };
  }

  async onSubmit(): Promise<void> {
    if (!this.useCaseName.trim()) {
      alert('Please enter a use case name');
      return;
    }

    // Debug: Log the current thread group configuration
    console.log('=== FORM SUBMISSION DEBUG ===');
    console.log('Thread Group Config before submission:', JSON.stringify(this.threadGroupConfig, null, 2));
    console.log('Delay Thread Creation:', this.threadGroupConfig.delayThreadCreation);
    console.log('Startup Delay:', this.threadGroupConfig.startupDelay);
    console.log('Specify Thread Lifetime:', this.threadGroupConfig.specifyThreadLifetime);
    console.log('Infinite Loop:', this.threadGroupConfig.infiniteLoop);
    console.log('Loop Count:', this.threadGroupConfig.loopCount);
    console.log('================================');

    if (this.isEditMode) {
      // In edit mode, update the use case
      this.isUploading = true;
      this.uploadMessage = '';

      this.useCaseService.updateUseCase(
        this.editUseCaseId,
        this.useCaseName,
        this.useCaseDescription,
        this.threadGroupConfig,
        this.serverConfig
      ).subscribe({
        next: (updatedUseCase: any) => {
          this.isUploading = false;
          this.uploadMessage = `Use case "${this.useCaseName}" updated successfully!`;
          
          // Show success toast notification
          this.toastService.showSuccess(
            'Use Case Updated Successfully! ✏️',
            `"${this.useCaseName}" has been updated successfully.`,
            5000
          );
          
          // Navigate back to use cases page
          this.router.navigate(['/usecases']);
        },
        error: (error: any) => {
          this.isUploading = false;
          this.uploadMessage = '';
          
          console.error('Error updating use case:', error);
          this.toastService.showError(
            'Update Failed',
            `Failed to update use case: ${error.error?.error || error.message || 'Unknown error'}`,
            5000
          );
        }
      });
      
      return;
    }

    if (!this.jmxFile) {
      alert('Please select a JMX file');
      return;
    }

    // CSV file is now optional - no validation needed

    this.isUploading = true;
    this.uploadMessage = '';

    try {
      // Modify JMX file with thread group settings
      const modifiedJmxFile = await this.modifyJmxFileWithThreadGroupSettings(this.jmxFile);
      
      this.useCaseService.createUseCase(
        this.useCaseName,
        this.useCaseDescription,
        modifiedJmxFile,
        this.csvFile,
        this.csvFile !== null,
        this.threadGroupConfig,
        this.serverConfig
      ).subscribe({
        next: (useCase) => {
          this.isUploading = false;
          this.uploadMessage = `Use case created successfully! Applied Thread Group settings: ${this.threadGroupConfig.numberOfThreads} threads, ${this.threadGroupConfig.rampUpPeriod}s ramp-up, ${this.threadGroupConfig.infiniteLoop ? 'infinite' : this.threadGroupConfig.loopCount} loops. Applied Server settings: ${this.serverConfig.protocol}://${this.serverConfig.server}:${this.serverConfig.port}. Added Summary Report listener and Simple Data Writer for live performance monitoring.`;
          
          // Show success toast notification
          this.toastService.showUseCaseCreated(this.useCaseName);
          
          // Log detailed success information for debugging
          console.log('=== USE CASE CREATION SUCCESS ===');
          console.log('Use Case ID:', useCase.id);
          console.log('Use Case Name:', this.useCaseName);
          console.log('Thread Group Config Applied:', {
            numberOfThreads: this.threadGroupConfig.numberOfThreads,
            rampUpPeriod: this.threadGroupConfig.rampUpPeriod,
            loopCount: this.threadGroupConfig.loopCount,
            infiniteLoop: this.threadGroupConfig.infiniteLoop,
            sameUserOnEachIteration: this.threadGroupConfig.sameUserOnEachIteration,
            delayThreadCreation: this.threadGroupConfig.delayThreadCreation,
            specifyThreadLifetime: this.threadGroupConfig.specifyThreadLifetime,
            duration: this.threadGroupConfig.duration,
            startupDelay: this.threadGroupConfig.startupDelay,
            actionAfterSamplerError: this.threadGroupConfig.actionAfterSamplerError
          });
          console.log('Server Config Applied:', {
            protocol: this.serverConfig.protocol,
            server: this.serverConfig.server,
            port: this.serverConfig.port
          });
          console.log('Created Use Case Data:', useCase);
          console.log('=== CREATION COMPLETE ===');
          
          // Verify the created use case data from backend
          this.verifyCreatedUseCase(useCase.id);
          
          this.useCaseCreated.emit(useCase);
          this.resetForm();
        },
        error: (error) => {
          this.isUploading = false;
          this.uploadMessage = 'Error creating use case: ' + (error.error?.error || error.message);
          
          // Show error toast notification
          this.toastService.showError(
            'Use Case Creation Failed',
            `Failed to create "${this.useCaseName}". Please check your files and try again.`
          );
          
          console.error('Error creating use case:', error);
        }
      });
    } catch (error) {
      this.isUploading = false;
      this.uploadMessage = 'Error modifying JMX file: ' + (error as Error).message;
      console.error('Error modifying JMX file:', error);
    }
  }

  resetForm(): void {
    this.useCaseName = '';
    this.useCaseDescription = '';
    this.jmxFile = null;
    this.csvFile = null;
    this.uploadMessage = '';
    this.csvUserCount = 0;
    this.resetThreadGroupConfig();
    this.resetServerConfig();
  }

  resetThreadGroupConfig(): void {
    this.threadGroupConfig = {
      numberOfThreads: 1,
      rampUpPeriod: 1,
      loopCount: 1,
      infiniteLoop: false,
      sameUserOnEachIteration: true,
      delayThreadCreation: false,
      specifyThreadLifetime: false,
      duration: 60,
      startupDelay: 0,
      actionAfterSamplerError: 'Continue'
    };
  }

  resetServerConfig(): void {
    this.serverConfig = {
      protocol: 'http',
      server: '3.137.176.31',
      port: '8080'
    };
  }

  async modifyJmxFileWithThreadGroupSettings(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          let jmxContent = e.target?.result as string;
          
          console.log('Original JMX content preview:', jmxContent.substring(0, 500));
          
          // Modify Thread Group settings in JMX content
          jmxContent = this.updateThreadGroupInJmx(jmxContent);
          
          // Modify Server Configuration in JMX content
          jmxContent = this.updateServerConfigInJmx(jmxContent);
          
          // Add Summary Report listener to JMX content
          jmxContent = this.addSummaryReportListener(jmxContent);
          
          console.log('Modified JMX content preview:', jmxContent.substring(0, 500));
          
          // Create a new File with modified content
          const modifiedFile = new File([jmxContent], file.name, { type: file.type });
          resolve(modifiedFile);
        } catch (error) {
          console.error('Error in modifyJmxFileWithThreadGroupSettings:', error);
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  }

  updateThreadGroupInJmx(jmxContent: string): string {
    // This is a simplified XML modification - in production, you'd want to use a proper XML parser
    let modifiedContent = jmxContent;
    
    console.log('Original Thread Group Config:', this.threadGroupConfig);
    
    // Update number of threads (intProp, not stringProp)
    modifiedContent = modifiedContent.replace(
      /<intProp name="ThreadGroup\.num_threads">\d+<\/intProp>/g,
      `<intProp name="ThreadGroup.num_threads">${this.threadGroupConfig.numberOfThreads}</intProp>`
    );
    
    // Update ramp-up period (intProp, not stringProp)
    modifiedContent = modifiedContent.replace(
      /<intProp name="ThreadGroup\.ramp_time">\d+<\/intProp>/g,
      `<intProp name="ThreadGroup.ramp_time">${this.threadGroupConfig.rampUpPeriod}</intProp>`
    );
    
    // Update loop count
    if (this.threadGroupConfig.infiniteLoop) {
      modifiedContent = modifiedContent.replace(
        /<stringProp name="LoopController\.loops">-?\d+<\/stringProp>/g,
        `<stringProp name="LoopController.loops">-1</stringProp>`
      );
      // Also update the continue_forever property
      modifiedContent = modifiedContent.replace(
        /<boolProp name="LoopController\.continue_forever">(true|false)<\/boolProp>/g,
        `<boolProp name="LoopController.continue_forever">true</boolProp>`
      );
    } else {
      modifiedContent = modifiedContent.replace(
        /<stringProp name="LoopController\.loops">-?\d+<\/stringProp>/g,
        `<stringProp name="LoopController.loops">${this.threadGroupConfig.loopCount}</stringProp>`
      );
      // Set continue_forever to false for finite loops
      modifiedContent = modifiedContent.replace(
        /<boolProp name="LoopController\.continue_forever">(true|false)<\/boolProp>/g,
        `<boolProp name="LoopController.continue_forever">false</boolProp>`
      );
    }
    
    // Update same user on each iteration
    modifiedContent = modifiedContent.replace(
      /<boolProp name="ThreadGroup\.same_user_on_next_iteration">(true|false)<\/boolProp>/g,
      `<boolProp name="ThreadGroup.same_user_on_next_iteration">${this.threadGroupConfig.sameUserOnEachIteration}</boolProp>`
    );
    
    // Update specify thread lifetime (scheduler)
    modifiedContent = modifiedContent.replace(
      /<boolProp name="ThreadGroup\.scheduler">(true|false)<\/boolProp>/g,
      `<boolProp name="ThreadGroup.scheduler">${this.threadGroupConfig.specifyThreadLifetime}</boolProp>`
    );
    
    // Update duration only if scheduler is enabled (thread lifetime is specified)
    // First, ensure the property exists if thread lifetime is specified
    if (this.threadGroupConfig.specifyThreadLifetime) {
      // Check if duration property exists, if not add it
      const durationPattern = /<longProp name="ThreadGroup\.duration">\d+<\/longProp>/g;
      if (modifiedContent.match(durationPattern)) {
        // Update existing duration property
        modifiedContent = modifiedContent.replace(
          durationPattern,
          `<longProp name="ThreadGroup.duration">${this.threadGroupConfig.duration}</longProp>`
        );
      } else {
        // Add duration property if it doesn't exist
        propertiesToAdd.push(`    <longProp name="ThreadGroup.duration">${this.threadGroupConfig.duration}</longProp>`);
      }
    } else {
      // If scheduler is disabled, remove or set duration to 0
      modifiedContent = modifiedContent.replace(
        /<longProp name="ThreadGroup\.duration">\d+<\/longProp>/g,
        `<longProp name="ThreadGroup.duration">0</longProp>`
      );
    }
    
    // Update action after sampler error
    modifiedContent = modifiedContent.replace(
      /<stringProp name="ThreadGroup\.on_sample_error">[^<]+<\/stringProp>/g,
      `<stringProp name="ThreadGroup.on_sample_error">${this.threadGroupConfig.actionAfterSamplerError.toLowerCase()}</stringProp>`
    );
    
    // Handle properties that might not exist in the original JMX
    const propertiesToAdd: string[] = [];
    
    // Check and add delay thread creation if needed
    const delayStartPattern = /<boolProp name="ThreadGroup\.delayedStart">(true|false)<\/boolProp>/g;
    if (modifiedContent.match(delayStartPattern)) {
      // Update existing
      modifiedContent = modifiedContent.replace(
        delayStartPattern,
        `<boolProp name="ThreadGroup.delayedStart">${this.threadGroupConfig.delayThreadCreation}</boolProp>`
      );
    } else {
      // Add new property
      propertiesToAdd.push(`    <boolProp name="ThreadGroup.delayedStart">${this.threadGroupConfig.delayThreadCreation}</boolProp>`);
    }
    
    // Check and add startup delay if needed
    const startupDelayPattern = /<stringProp name="ThreadGroup\.delay">\d+<\/stringProp>/g;
    if (modifiedContent.match(startupDelayPattern)) {
      // Update existing
      modifiedContent = modifiedContent.replace(
        startupDelayPattern,
        `<stringProp name="ThreadGroup.delay">${this.threadGroupConfig.startupDelay}</stringProp>`
      );
    } else {
      // Add new property
      propertiesToAdd.push(`    <stringProp name="ThreadGroup.delay">${this.threadGroupConfig.startupDelay}</stringProp>`);
    }
    
    // Add all new properties at once before the closing ThreadGroup tag
    if (propertiesToAdd.length > 0) {
      const propertiesToInsert = propertiesToAdd.join('\n') + '\n';
      modifiedContent = modifiedContent.replace(
        /(<\/ThreadGroup>)/,
        propertiesToInsert + '$1'
      );
    }
    
    console.log('=== JMX MODIFICATION COMPLETED ===');
    console.log('Final Thread Group Config Applied:', {
      numberOfThreads: this.threadGroupConfig.numberOfThreads,
      rampUpPeriod: this.threadGroupConfig.rampUpPeriod,
      loopCount: this.threadGroupConfig.loopCount,
      infiniteLoop: this.threadGroupConfig.infiniteLoop,
      sameUserOnEachIteration: this.threadGroupConfig.sameUserOnEachIteration,
      delayThreadCreation: this.threadGroupConfig.delayThreadCreation,
      specifyThreadLifetime: this.threadGroupConfig.specifyThreadLifetime,
      duration: this.threadGroupConfig.duration,
      startupDelay: this.threadGroupConfig.startupDelay,
      actionAfterSamplerError: this.threadGroupConfig.actionAfterSamplerError
    });
    
    // Enhanced verification logging for JMX properties
    console.log('=== JMX PROPERTY VERIFICATION ===');
    
    // Thread Group properties verification
    const numberOfThreadsMatch = modifiedContent.match(/<intProp name="ThreadGroup\.num_threads">(\d+)<\/intProp>/);
    const rampTimeMatch = modifiedContent.match(/<intProp name="ThreadGroup\.ramp_time">(\d+)<\/intProp>/);
    const schedulerMatch = modifiedContent.match(/<boolProp name="ThreadGroup\.scheduler">(true|false)<\/boolProp>/);
    const sameUserMatch = modifiedContent.match(/<boolProp name="ThreadGroup\.same_user_on_next_iteration">(true|false)<\/boolProp>/);
    const actionErrorMatch = modifiedContent.match(/<stringProp name="ThreadGroup\.on_sample_error">([^<]+)<\/stringProp>/);
    
    // Loop controller verification
    const loopsMatch = modifiedContent.match(/<stringProp name="LoopController\.loops">(-?\d+)<\/stringProp>/);
    const continueForeverMatch = modifiedContent.match(/<boolProp name="LoopController\.continue_forever">(true|false)<\/boolProp>/);
    
    // Duration and delay verification
    const durationMatch = modifiedContent.match(/<longProp name="ThreadGroup\.duration">(\d+)<\/longProp>/);
    const delayStartMatch = modifiedContent.match(/<boolProp name="ThreadGroup\.delayedStart">(true|false)<\/boolProp>/);
    const startupDelayMatch = modifiedContent.match(/<stringProp name="ThreadGroup\.delay">(\d+)<\/stringProp>/);
    
    console.log('✓ Number of Threads:', numberOfThreadsMatch ? numberOfThreadsMatch[1] : 'NOT FOUND');
    console.log('✓ Ramp-up Period:', rampTimeMatch ? rampTimeMatch[1] : 'NOT FOUND');
    console.log('✓ Thread Lifetime (Scheduler):', schedulerMatch ? schedulerMatch[1] : 'NOT FOUND');
    console.log('✓ Same User on Each Iteration:', sameUserMatch ? sameUserMatch[1] : 'NOT FOUND');
    console.log('✓ Action After Sampler Error:', actionErrorMatch ? actionErrorMatch[1] : 'NOT FOUND');
    console.log('✓ Loop Count:', loopsMatch ? loopsMatch[1] : 'NOT FOUND');
    console.log('✓ Continue Forever:', continueForeverMatch ? continueForeverMatch[1] : 'NOT FOUND');
    console.log('✓ Duration (seconds):', durationMatch ? durationMatch[1] : 'NOT FOUND');
    console.log('✓ Delay Thread Creation:', delayStartMatch ? delayStartMatch[1] : 'NOT FOUND');
    console.log('✓ Startup Delay:', startupDelayMatch ? startupDelayMatch[1] : 'NOT FOUND');
    
    console.log('=== VERIFICATION COMPLETE ===');
    
    // Validate JMX structure
    this.validateJmxStructure(modifiedContent);
    
    return modifiedContent;
  }

  validateJmxStructure(jmxContent: string): void {
    console.log('=== JMX STRUCTURE VALIDATION ===');
    
    // Check for basic XML structure
    const hasXmlDeclaration = jmxContent.includes('<?xml');
    const hasJmeterTestPlan = jmxContent.includes('<jmeterTestPlan');
    const hasThreadGroup = jmxContent.includes('<ThreadGroup');
    const hasClosingThreadGroup = jmxContent.includes('</ThreadGroup>');
    
    console.log('XML Declaration:', hasXmlDeclaration ? '✓' : '✗');
    console.log('JMeter Test Plan:', hasJmeterTestPlan ? '✓' : '✗');
    console.log('Thread Group:', hasThreadGroup ? '✓' : '✗');
    console.log('Closing Thread Group:', hasClosingThreadGroup ? '✓' : '✗');
    
    // Check for malformed XML
    const openTags = (jmxContent.match(/</g) || []).length;
    const closeTags = (jmxContent.match(/>/g) || []).length;
    
    console.log('Open Tags:', openTags);
    console.log('Close Tags:', closeTags);
    
    if (openTags !== closeTags) {
      console.warn('⚠️ WARNING: Mismatched XML tags detected!');
    } else {
      console.log('✓ XML tag structure is balanced');
    }
    
    // Check for duplicate properties
    const delayStartCount = (jmxContent.match(/<boolProp name="ThreadGroup\.delayedStart">/g) || []).length;
    const startupDelayCount = (jmxContent.match(/<stringProp name="ThreadGroup\.delay">/g) || []).length;
    
    console.log('Delay Start Properties:', delayStartCount);
    console.log('Startup Delay Properties:', startupDelayCount);
    
    if (delayStartCount > 1) {
      console.warn('⚠️ WARNING: Multiple delay start properties found!');
    }
    if (startupDelayCount > 1) {
      console.warn('⚠️ WARNING: Multiple startup delay properties found!');
    }
    
    console.log('=== VALIDATION COMPLETE ===');
  }

  updateServerConfigInJmx(jmxContent: string): string {
    let modifiedContent = jmxContent;
    
    console.log('Original Server Config:', this.serverConfig);
    
    // Update HTTP Request Defaults (if they exist)
    // This will update the default server, port, and protocol for all HTTP requests
    
    // Update server name/IP in HTTP Request Defaults
    modifiedContent = modifiedContent.replace(
      /<stringProp name="HTTPSampler\.domain">[^<]*<\/stringProp>/g,
      `<stringProp name="HTTPSampler.domain">${this.serverConfig.server}</stringProp>`
    );
    
    // Update port in HTTP Request Defaults
    modifiedContent = modifiedContent.replace(
      /<stringProp name="HTTPSampler\.port">[^<]*<\/stringProp>/g,
      `<stringProp name="HTTPSampler.port">${this.serverConfig.port}</stringProp>`
    );
    
    // Update protocol in HTTP Request Defaults
    modifiedContent = modifiedContent.replace(
      /<stringProp name="HTTPSampler\.protocol">[^<]*<\/stringProp>/g,
      `<stringProp name="HTTPSampler.protocol">${this.serverConfig.protocol}</stringProp>`
    );
    
    // Also update individual HTTP Request samplers
    // Update server name/IP in individual HTTP requests
    modifiedContent = modifiedContent.replace(
      /<stringProp name="HTTPSampler\.domain">[^<]*<\/stringProp>/g,
      `<stringProp name="HTTPSampler.domain">${this.serverConfig.server}</stringProp>`
    );
    
    // Update port in individual HTTP requests
    modifiedContent = modifiedContent.replace(
      /<stringProp name="HTTPSampler\.port">[^<]*<\/stringProp>/g,
      `<stringProp name="HTTPSampler.port">${this.serverConfig.port}</stringProp>`
    );
    
    // Update protocol in individual HTTP requests
    modifiedContent = modifiedContent.replace(
      /<stringProp name="HTTPSampler\.protocol">[^<]*<\/stringProp>/g,
      `<stringProp name="HTTPSampler.protocol">${this.serverConfig.protocol}</stringProp>`
    );
    
    // Update server name/IP in HTTP Request samplers (alternative property names)
    modifiedContent = modifiedContent.replace(
      /<stringProp name="HTTPSampler\.serverName">[^<]*<\/stringProp>/g,
      `<stringProp name="HTTPSampler.serverName">${this.serverConfig.server}</stringProp>`
    );
    
    // Update port in HTTP Request samplers (alternative property names)
    modifiedContent = modifiedContent.replace(
      /<stringProp name="HTTPSampler\.portNumber">[^<]*<\/stringProp>/g,
      `<stringProp name="HTTPSampler.portNumber">${this.serverConfig.port}</stringProp>`
    );
    
    // Update protocol in HTTP Request samplers (alternative property names)
    modifiedContent = modifiedContent.replace(
      /<stringProp name="HTTPSampler\.protocolType">[^<]*<\/stringProp>/g,
      `<stringProp name="HTTPSampler.protocolType">${this.serverConfig.protocol}</stringProp>`
    );
    
    console.log('Server configuration applied to JMX');
    return modifiedContent;
  }

  addSummaryReportListener(jmxContent: string): string {
    // Check if Summary Report listener already exists
    if (jmxContent.includes('SummaryReport')) {
      console.log('Summary Report listener already exists in JMX');
      return jmxContent;
    }

    // Create both Summary Report listener and Simple Data Writer for JTL file generation
    // Summary Report listener for display
    const summaryReportListener = `
    <SummaryReport guiclass="SummaryReportGui" testclass="SummaryReport" testname="Summary Report" enabled="true">
      <boolProp name="SummaryReport.errors">true</boolProp>
      <boolProp name="SummaryReport.label">true</boolProp>
      <boolProp name="SummaryReport.samplers">true</boolProp>
      <boolProp name="SummaryReport.success">true</boolProp>
      <boolProp name="SummaryReport.filename">false</boolProp>
      <stringProp name="filename"></stringProp>
    </SummaryReport>
    <hashTree/>`;

    // Simple Data Writer for JTL file generation (this is what creates the .jtl files)
    const simpleDataWriter = `
    <ResultCollector guiclass="SimpleDataWriter" testclass="ResultCollector" testname="Simple Data Writer" enabled="true">
      <boolProp name="ResultCollector.error_logging">false</boolProp>
      <objProp>
        <name>saveConfig</name>
        <value class="SampleSaveConfiguration">
          <time>true</time>
          <latency>true</latency>
          <timestamp>true</timestamp>
          <success>true</success>
          <label>true</label>
          <code>true</code>
          <message>true</message>
          <threadName>true</threadName>
          <dataType>true</dataType>
          <encoding>false</encoding>
          <assertions>true</assertions>
          <subresults>true</subresults>
          <responseData>false</responseData>
          <samplerData>false</samplerData>
          <xml>false</xml>
          <fieldNames>true</fieldNames>
          <responseHeaders>false</responseHeaders>
          <requestHeaders>false</requestHeaders>
          <responseDataOnError>false</responseDataOnError>
          <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>
          <assertionsResultsToSave>0</assertionsResultsToSave>
          <bytes>true</bytes>
          <sentBytes>true</sentBytes>
          <url>true</url>
          <threadCounts>true</threadCounts>
          <idleTime>true</idleTime>
          <connectTime>true</connectTime>
        </value>
      </objProp>
      <stringProp name="filename">result_${Date.now()}.jtl</stringProp>
    </ResultCollector>
    <hashTree/>`;

    // Find the test plan element and add the Summary Report listener
    // We need to add it at the test plan level, just like in JMeter
    const testPlanPattern = /(<TestPlan[^>]*>[\s\S]*?<hashTree>)([\s\S]*?)(<\/hashTree>\s*<\/TestPlan>)/;
    const match = jmxContent.match(testPlanPattern);
    
    if (match) {
      const beforeTestPlan = match[1];
      const testPlanContent = match[2];
      const afterTestPlan = match[3];
      
      // Add both Summary Report listener and Simple Data Writer before the closing </hashTree> of the test plan
      const modifiedContent = beforeTestPlan + testPlanContent + summaryReportListener + '\n' + simpleDataWriter + '\n' + afterTestPlan;
      console.log('Summary Report listener and Simple Data Writer added to JMX');
      return modifiedContent;
    }

    // Fallback: If we can't find the test plan structure, try to add it before the closing </jmeterTestPlan>
    const lastHashTreeIndex = jmxContent.lastIndexOf('</hashTree>');
    if (lastHashTreeIndex !== -1) {
      const beforeLastHashTree = jmxContent.substring(0, lastHashTreeIndex);
      const afterLastHashTree = jmxContent.substring(lastHashTreeIndex);
      
      const modifiedContent = beforeLastHashTree + summaryReportListener + '\n' + simpleDataWriter + '\n' + afterLastHashTree;
      console.log('Summary Report listener and Simple Data Writer added to JMX (fallback method)');
      return modifiedContent;
    }

    console.log('Could not find suitable location to add Summary Report listener');
    return jmxContent;
  }

  goBack(): void {
    // Use Angular Location service for better browser history management
    if (this.location.isCurrentPathEqualTo('/upload')) {
      // If we're on upload page, try to go back in history
      this.location.back();
    } else {
      // Fallback to home if no history or direct access
      this.router.navigate(['/home']);
    }
  }

  // Test function to verify form data loading (can be called from browser console)
  testFormDataLoading(): void {
    console.log('=== FORM DATA TESTING ===');
    console.log('Current threadGroupConfig:', this.threadGroupConfig);
    console.log('Is Edit Mode:', this.isEditMode);
    console.log('Edit Use Case ID:', this.editUseCaseId);
    
    // Test individual properties
    console.log('Individual Properties:');
    console.log('- delayThreadCreation:', this.threadGroupConfig.delayThreadCreation, typeof this.threadGroupConfig.delayThreadCreation);
    console.log('- startupDelay:', this.threadGroupConfig.startupDelay, typeof this.threadGroupConfig.startupDelay);
    console.log('- infiniteLoop:', this.threadGroupConfig.infiniteLoop, typeof this.threadGroupConfig.infiniteLoop);
    console.log('- specifyThreadLifetime:', this.threadGroupConfig.specifyThreadLifetime, typeof this.threadGroupConfig.specifyThreadLifetime);
    
    console.log('=== TEST COMPLETE ===');
  }

  // Method to manually set form values for testing (can be called from browser console)
  setTestFormValues(): void {
    console.log('Setting test form values...');
    this.threadGroupConfig.delayThreadCreation = true;
    this.threadGroupConfig.startupDelay = 5;
    this.threadGroupConfig.infiniteLoop = true;
    this.threadGroupConfig.specifyThreadLifetime = true;
    this.threadGroupConfig.duration = 300;
    this.threadGroupConfig.loopCount = 10; // This should be ignored when infiniteLoop is true
    console.log('Test values set:', this.threadGroupConfig);
  }

  // Method to test infinite loop toggle (can be called from browser console)
  testInfiniteLoopToggle(): void {
    console.log('=== INFINITE LOOP TOGGLE TEST ===');
    console.log('Before toggle - infiniteLoop:', this.threadGroupConfig.infiniteLoop, typeof this.threadGroupConfig.infiniteLoop);
    console.log('Before toggle - loopCount:', this.threadGroupConfig.loopCount, typeof this.threadGroupConfig.loopCount);
    
    // Toggle infinite loop with explicit boolean conversion
    this.threadGroupConfig.infiniteLoop = Boolean(!this.threadGroupConfig.infiniteLoop);
    
    console.log('After toggle - infiniteLoop:', this.threadGroupConfig.infiniteLoop, typeof this.threadGroupConfig.infiniteLoop);
    console.log('After toggle - loopCount:', this.threadGroupConfig.loopCount, typeof this.threadGroupConfig.loopCount);
    
    // Also test the checkbox element directly
    const checkbox = document.getElementById('infiniteLoop') as HTMLInputElement;
    if (checkbox) {
      console.log('Checkbox element checked:', checkbox.checked);
      console.log('Checkbox element value:', checkbox.value);
    }
    
    console.log('=== TEST COMPLETE ===');
  }

  // Test function to verify JMX modification (can be called from browser console)
  testJmxModification(): void {
    console.log('=== JMX MODIFICATION TEST ===');
    console.log('Current Thread Group Config:', this.threadGroupConfig);
    
    // Create a sample JMX content
    const sampleJmx = `<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.6.3">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="Test Plan">
      <boolProp name="TestPlan.functional_mode">false</boolProp>
    </TestPlan>
    <hashTree>
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Test Thread Group">
        <intProp name="ThreadGroup.num_threads">1</intProp>
        <intProp name="ThreadGroup.ramp_time">1</intProp>
        <boolProp name="ThreadGroup.same_user_on_next_iteration">true</boolProp>
        <boolProp name="ThreadGroup.scheduler">false</boolProp>
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="Loop Controller">
          <stringProp name="LoopController.loops">1</stringProp>
          <boolProp name="LoopController.continue_forever">false</boolProp>
        </elementProp>
      </ThreadGroup>
    </hashTree>
  </hashTree>
</jmeterTestPlan>`;
    
    console.log('Original JMX:', sampleJmx);
    
    // Apply modifications
    const modifiedJmx = this.updateThreadGroupInJmx(sampleJmx);
    
    console.log('Modified JMX:', modifiedJmx);
    
    // Check if properties were added
    const delayStartFound = modifiedJmx.includes(`<boolProp name="ThreadGroup.delayedStart">${this.threadGroupConfig.delayThreadCreation}</boolProp>`);
    const startupDelayFound = modifiedJmx.includes(`<stringProp name="ThreadGroup.delay">${this.threadGroupConfig.startupDelay}</stringProp>`);
    
    console.log('Delay Thread Creation added:', delayStartFound);
    console.log('Startup Delay added:', startupDelayFound);
    console.log('=== TEST COMPLETE ===');
  }

  // Method to force set infinite loop and sync with checkbox
  forceSetInfiniteLoop(value: boolean): void {
    console.log('=== FORCE SET INFINITE LOOP ===');
    console.log('Setting infiniteLoop to:', value);
    
    // Set the model value
    this.threadGroupConfig.infiniteLoop = Boolean(value);
    
    // Also update the checkbox element directly
    const checkbox = document.getElementById('infiniteLoop') as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = Boolean(value);
      console.log('Checkbox element updated to:', checkbox.checked);
    }
    
    console.log('Final infiniteLoop value:', this.threadGroupConfig.infiniteLoop);
    console.log('=== FORCE SET COMPLETE ===');
  }

  // Method to verify the created use case data from backend
  verifyCreatedUseCase(useCaseId: string): void {
    console.log('=== VERIFYING CREATED USE CASE ===');
    console.log('Fetching use case data for ID:', useCaseId);
    
    this.useCaseService.getUseCaseById(useCaseId).subscribe({
      next: (useCaseData: any) => {
        console.log('=== BACKEND USE CASE VERIFICATION ===');
        console.log('Raw Backend Data:', useCaseData);
        
        // Check if threadGroupConfig was saved properly
        if (useCaseData.threadGroupConfig) {
          try {
            const savedConfig = JSON.parse(useCaseData.threadGroupConfig);
            console.log('✓ Backend Thread Group Config:', savedConfig);
            console.log('✓ Specify Thread Lifetime in Backend:', savedConfig.specifyThreadLifetime);
            console.log('✓ Duration in Backend:', savedConfig.duration);
            
            // Compare with frontend config
            console.log('--- CONFIGURATION COMPARISON ---');
            console.log('Frontend vs Backend - Specify Thread Lifetime:', 
              this.threadGroupConfig.specifyThreadLifetime, '==', savedConfig.specifyThreadLifetime,
              this.threadGroupConfig.specifyThreadLifetime === savedConfig.specifyThreadLifetime ? '✓' : '✗'
            );
            console.log('Frontend vs Backend - Duration:', 
              this.threadGroupConfig.duration, '==', savedConfig.duration,
              this.threadGroupConfig.duration === savedConfig.duration ? '✓' : '✗'
            );
            console.log('--- COMPARISON COMPLETE ---');
          } catch (error) {
            console.error('Error parsing threadGroupConfig from backend:', error);
          }
        } else {
          console.warn('⚠️ No threadGroupConfig found in backend response');
        }
        
        // Check if serverConfig was saved properly
        if (useCaseData.serverConfig) {
          try {
            const savedServerConfig = JSON.parse(useCaseData.serverConfig);
            console.log('✓ Backend Server Config:', savedServerConfig);
          } catch (error) {
            console.error('Error parsing serverConfig from backend:', error);
          }
        } else {
          console.warn('⚠️ No serverConfig found in backend response');
        }
        
        console.log('=== BACKEND VERIFICATION COMPLETE ===');
      },
      error: (error) => {
        console.error('❌ Error fetching use case for verification:', error);
      }
    });
  }

}