import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { SignupRequest } from '../../../models/auth.model';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('scrollContainer', { static: false }) scrollContainer!: ElementRef;
  @ViewChild('submitButton', { static: false }) submitButton!: ElementRef;
  
  signupForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  fieldErrors: { [key: string]: string } = {}; // For field-specific errors
  hidePassword = true;
  hideConfirmPassword = true;
  showScrollHint = false;
  private subscription = new Subscription();

  roleOptions = [
    { value: 'parent', label: 'Parent', icon: 'family_restroom' },
    { value: 'teacher', label: 'Teacher', icon: 'school' },
    { value: 'staff', label: 'Staff', icon: 'badge' },
    { value: 'admin', label: 'Administrator', icon: 'admin_panel_settings' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private dialogRef: MatDialogRef<SignupComponent>
  ) {
    this.signupForm = this.createSignupForm();
  }

  ngOnInit(): void {
    // Component is ready
    console.log('🔐 Signup component initialized');
    
    // Debug form validation - removed auto-scroll to prevent disruption while typing
    this.signupForm.valueChanges.subscribe(() => {
      console.log('Form valid:', this.signupForm.valid);
      console.log('Form errors:', this.getFormValidationSummary());
      console.log('Form values:', this.signupForm.value);
      
      // Removed auto-scroll from here - will be triggered by Enter key instead
    });
  }

  ngAfterViewInit(): void {
    // Check if content is scrollable after view init
    setTimeout(() => {
      this.checkScrollable();
    }, 100);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // Check if we should auto-scroll (when most required fields are filled)
  private shouldAutoScroll(): boolean {
    const formValue = this.signupForm.value;
    const requiredFieldsFilled = [
      formValue.firstName && formValue.firstName.length >= 2,
      formValue.lastName && formValue.lastName.length >= 2,
      formValue.email && formValue.email.includes('@'),
      formValue.username && formValue.username.length >= 3,
      formValue.password && formValue.password.length >= 6,
      formValue.confirmPassword && formValue.confirmPassword.length >= 6
    ];
    
    // Auto-scroll when at least 5 out of 6 required fields are filled
    const filledCount = requiredFieldsFilled.filter(Boolean).length;
    return filledCount >= 5;
  }

  // Auto-scroll to submit button when form is valid
  private scrollToSubmitButton(): void {
    setTimeout(() => {
      if (this.submitButton && this.scrollContainer) {
        const submitElement = this.submitButton.nativeElement;
        const containerElement = this.scrollContainer.nativeElement;
        
        // Scroll the submit button into view with smooth animation
        submitElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
        
        // Alternative method using container scroll
        const submitRect = submitElement.getBoundingClientRect();
        const containerRect = containerElement.getBoundingClientRect();
        
        if (submitRect.bottom > containerRect.bottom) {
          const scrollTop = containerElement.scrollTop + (submitRect.bottom - containerRect.bottom) + 20;
          containerElement.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
          });
        }
      }
    }, 100); // Small delay to ensure DOM is updated
  }

  // Auto-scroll to success message
  private scrollToSuccessMessage(): void {
    setTimeout(() => {
      const successElement = document.getElementById('successMessage');
      if (successElement && this.scrollContainer) {
        const containerElement = this.scrollContainer.nativeElement;
        
        // Scroll to bottom to show success message
        const scrollTop = containerElement.scrollHeight - containerElement.clientHeight;
        
        containerElement.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
        
        // Alternative: scroll success message into view
        successElement.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      }
    }, 100);
  }

  private checkScrollable(): void {
    if (this.scrollContainer) {
      const element = this.scrollContainer.nativeElement;
      const isScrollable = element.scrollHeight > element.clientHeight;
      this.showScrollHint = isScrollable;
      
      if (isScrollable) {
        // Hide scroll hint after user starts scrolling or after 3 seconds
        element.addEventListener('scroll', () => {
          this.showScrollHint = false;
        }, { once: true });
        
        setTimeout(() => {
          this.showScrollHint = false;
        }, 3000);
      }
    }
  }

  private createSignupForm(): FormGroup {
    const form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      phoneNumber: [''],  // Simplified - make it truly optional
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      role: ['parent', [Validators.required]],
      agreeTerms: [false, [this.checkboxRequiredValidator.bind(this)]]  // Using custom validator
    });

    // Add password match validation
    form.get('confirmPassword')?.setValidators([
      Validators.required,
      this.matchPasswordValidator.bind(this)
    ]);

    // Watch for password changes to revalidate confirm password
    form.get('password')?.valueChanges.subscribe(() => {
      form.get('confirmPassword')?.updateValueAndValidity();
    });

    // Watch for checkbox changes
    form.get('agreeTerms')?.valueChanges.subscribe((value) => {
      console.log('Checkbox value changed to:', value);
    });

    // Clear field errors when user starts typing
    Object.keys(form.controls).forEach(key => {
      form.get(key)?.valueChanges.subscribe(() => {
        if (this.fieldErrors[key]) {
          delete this.fieldErrors[key];
        }
      });
    });

    // Log form creation
    console.log('Form created with values:', form.value);
    console.log('Form valid at creation:', form.valid);

    return form;
  }

  private matchPasswordValidator(control: AbstractControl) {
    const password = this.signupForm?.get('password')?.value;
    const confirmPassword = control.value;
    
    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  private testConnection(): void {
    this.subscription.add(
      this.authService.testAuthEndpoint().subscribe({
        next: (response: any) => {
          console.log('✅ Auth endpoint test successful:', response.message);
        },
        error: (error: any) => {
          console.error('❌ Auth endpoint test failed:', error);
          this.errorMessage = 'Unable to connect to authentication server. Please try again later.';
        }
      })
    );
  }

  onSubmit(): void {
    console.log('🚀 Submit attempted');
    console.log('Form valid:', this.signupForm.valid);
    console.log('Form values:', this.signupForm.value);
    console.log('Loading:', this.isLoading);
    
    // Temporarily bypass form validation for testing
    if (!this.isLoading) {
      if (!this.signupForm.valid) {
        console.log('❌ Form is invalid, showing errors:');
        this.checkFormStatus();
        // Mark all fields as touched to show validation errors
        Object.keys(this.signupForm.controls).forEach(key => {
          this.signupForm.get(key)?.markAsTouched();
        });
        return;
      }
      
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';
      this.fieldErrors = {}; // Clear field-specific errors

      const signupData: SignupRequest = {
        username: this.signupForm.value.username.trim(),
        email: this.signupForm.value.email.trim().toLowerCase(),
        firstName: this.signupForm.value.firstName.trim(),
        lastName: this.signupForm.value.lastName.trim(),
        password: this.signupForm.value.password,
        phoneNumber: this.signupForm.value.phoneNumber?.trim() || undefined,
        role: [this.signupForm.value.role]
      };

      console.log('📤 Sending signup data:', signupData);

      this.subscription.add(
        this.authService.signup(signupData).subscribe({
          next: (response: any) => {
            console.log('✅ Signup successful:', response);
            this.isLoading = false;
            this.successMessage = response.message || 'Account created successfully! You can now sign in.';
            
            // Scroll to success message
            this.scrollToSuccessMessage();
            
            // Auto-close dialog after 3 seconds (increased to give user time to read)
            setTimeout(() => {
              this.dialogRef.close({ success: true, message: this.successMessage });
            }, 3000);
          },
          error: (error: any) => {
            console.error('❌ Signup failed:', error);
            this.isLoading = false;
            
            // Handle specific field errors (like username already taken)
            if (error.status === 400 && error.error?.field) {
              // Field-specific error
              this.fieldErrors[error.error.field] = error.error.message || 'Invalid value';
              this.errorMessage = ''; // Don't show general error
              this.scrollToFieldError(error.error.field);
            } else if (error.status === 400 && error.error?.message?.toLowerCase().includes('username')) {
              // Username conflict error
              this.fieldErrors['username'] = error.error.message || 'Username already taken';
              this.errorMessage = ''; // Don't show general error
              this.scrollToFieldError('username');
            } else if (error.status === 400 && error.error?.message?.toLowerCase().includes('email')) {
              // Email conflict error
              this.fieldErrors['email'] = error.error.message || 'Email already registered';
              this.errorMessage = ''; // Don't show general error
              this.scrollToFieldError('email');
            } else if (error.status === 400) {
              // General validation error - keep showing at top for now
              this.errorMessage = error.error?.message || 'Registration failed. Please check your information.';
            } else if (error.status === 0) {
              this.errorMessage = 'Unable to connect to server. Please check your connection.';
            } else {
              this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
            }
          }
        })
      );
    }
  }

  getPasswordStrength(): string {
    const password = this.signupForm.get('password')?.value || '';
    if (password.length < 6) return 'weak';
    if (password.length < 8) return 'medium';
    if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) return 'strong';
    return 'medium';
  }

  getPasswordStrengthColor(): string {
    const strength = this.getPasswordStrength();
    switch (strength) {
      case 'weak': return '#f44336';
      case 'medium': return '#ff9800';
      case 'strong': return '#4caf50';
      default: return '#ddd';
    }
  }

  getPasswordStrengthIcon(): string {
    const strength = this.getPasswordStrength();
    switch (strength) {
      case 'weak':
        return 'warning';
      case 'medium':
        return 'info';
      case 'strong':
        return 'check_circle';
      default:
        return 'help';
    }
  }

  switchToLogin(): void {
    this.dialogRef.close({ action: 'switch-to-login' });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  // Form validation helpers
  getFieldError(fieldName: string): string {
    // Check for server-side field errors first
    if (this.fieldErrors[fieldName]) {
      return this.fieldErrors[fieldName];
    }
    
    // Then check for client-side validation errors
    const field = this.signupForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldDisplayName(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['pattern'] || field.errors['invalidPhone']) {
        if (fieldName === 'username') {
          return 'Username can only contain letters, numbers, and underscores';
        }
        if (fieldName === 'phoneNumber') {
          return 'Please enter a valid phone number (10-15 digits)';
        }
      }
      if (field.errors['passwordMismatch']) {
        return 'Passwords do not match';
      }
      if (field.errors['checkboxRequired']) {
        return 'You must agree to the Terms and Conditions';
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      username: 'Username',
      email: 'Email',
      firstName: 'First Name',
      lastName: 'Last Name',
      phoneNumber: 'Phone Number',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      role: 'Role'
    };
    return displayNames[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.signupForm.get(fieldName);
    // Show as invalid if there's a server error OR client validation error
    return !!(this.fieldErrors[fieldName] || (field?.errors && field.touched));
  }

  // Debug method to check form validity
  checkFormValidity(): void {
    console.log('🔍 Form Validity Debug:');
    console.log('Form Valid:', this.signupForm.valid);
    console.log('Form Errors:', this.signupForm.errors);
    
    Object.keys(this.signupForm.controls).forEach(key => {
      const control = this.signupForm.get(key);
      if (control && control.errors) {
        console.log(`❌ ${key}:`, control.errors);
      } else {
        console.log(`✅ ${key}: valid`);
      }
    });
  }

  // Get form debug info for template
  get formDebugInfo(): string {
    if (this.signupForm.valid) {
      return 'Form is valid ✅';
    }
    
    const invalidFields = Object.keys(this.signupForm.controls)
      .filter(key => this.signupForm.get(key)?.errors)
      .map(key => {
        const errors = this.signupForm.get(key)?.errors;
        return `${key}: ${Object.keys(errors || {}).join(', ')}`;
      });
    
    return `Invalid fields: ${invalidFields.join(' | ')}`;
  }

  // Custom validator for checkbox that must be checked
  private checkboxRequiredValidator(control: AbstractControl) {
    const value = control.value;
    console.log('Checkbox validator called with value:', value, 'Type:', typeof value);
    
    // Accept true, 'true', or any truthy value
    if (value === true || value === 'true' || (value && value !== false && value !== 'false')) {
      console.log('Checkbox validation PASSED');
      return null; // Valid
    }
    
    console.log('Checkbox validation FAILED');
    return { checkboxRequired: true }; // Invalid
  }

  private optionalPhoneValidator(control: AbstractControl) {
    const value = control.value;
    if (!value || value.trim() === '') {
      return null; // Valid if empty
    }
    
    const phonePattern = /^[0-9]{10,15}$/;
    return phonePattern.test(value) ? null : { invalidPhone: true };
  }

  getFormValidationSummary(): string {
    if (this.signupForm.valid) {
      return 'All fields are valid ✓';
    }
    
    const errors: string[] = [];
    
    Object.keys(this.signupForm.controls).forEach(key => {
      const control = this.signupForm.get(key);
      if (control && control.invalid) {
        const controlErrors = control.errors;
        if (controlErrors) {
          const errorKeys = Object.keys(controlErrors);
          errors.push(`${key}: ${errorKeys.join(', ')} (value: ${control.value})`);
        }
      }
    });
    
    return errors.length > 0 ? errors.join(' | ') : 'No errors found';
  }

  // Helper method to check specific field validity
  isFieldValid(fieldName: string): boolean {
    const field = this.signupForm.get(fieldName);
    return field ? field.valid : false;
  }

  // Helper method to get field errors
  getFieldErrors(fieldName: string): any {
    const field = this.signupForm.get(fieldName);
    return field ? field.errors : null;
  }

  // Debug method to manually trigger form validation check
  checkFormStatus(): void {
    console.log('=== FORM STATUS DEBUG ===');
    console.log('Form valid:', this.signupForm.valid);
    console.log('Form value:', this.signupForm.value);
    console.log('Form errors:', this.signupForm.errors);
    
    Object.keys(this.signupForm.controls).forEach(key => {
      const control = this.signupForm.get(key);
      if (control) {
        console.log(`${key}:`, {
          value: control.value,
          valid: control.valid,
          errors: control.errors,
          touched: control.touched,
          dirty: control.dirty
        });
      }
    });
    console.log('========================');
  }

  // Method to test form manually
  testFormManually(): void {
    console.log('=== MANUAL FORM TEST ===');
    console.log('All form values:', this.signupForm.value);
    console.log('Form valid:', this.signupForm.valid);
    console.log('Form invalid:', this.signupForm.invalid);
    
    // Check each field individually
    const fields = ['firstName', 'lastName', 'email', 'username', 'password', 'confirmPassword', 'role', 'agreeTerms'];
    fields.forEach(fieldName => {
      const field = this.signupForm.get(fieldName);
      if (field) {
        console.log(`${fieldName}:`, {
          value: field.value,
          valid: field.valid,
          errors: field.errors,
          validators: field.validator ? 'Has validators' : 'No validators'
        });
      }
    });
    
    // Test checkbox specifically
    const agreeTerms = this.signupForm.get('agreeTerms');
    if (agreeTerms) {
      console.log('Checkbox test result:', this.checkboxRequiredValidator(agreeTerms));
    }
    
    console.log('=========================');
  }

  // Auto-scroll to field with error
  private scrollToFieldError(fieldName: string): void {
    setTimeout(() => {
      const fieldElement = document.getElementById(fieldName) as HTMLInputElement;
      if (fieldElement && this.scrollContainer) {
        const containerElement = this.scrollContainer.nativeElement;
        
        // Scroll the field into view with smooth animation
        fieldElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
        
        // Alternative method using container scroll for better control
        const fieldRect = fieldElement.getBoundingClientRect();
        const containerRect = containerElement.getBoundingClientRect();
        
        // Calculate position to center the field in the viewport
        const fieldTop = fieldElement.offsetTop;
        const containerHeight = containerElement.clientHeight;
        const scrollTop = fieldTop - (containerHeight / 2) + (fieldElement.offsetHeight / 2);
        
        containerElement.scrollTo({
          top: Math.max(0, scrollTop),
          behavior: 'smooth'
        });
        
        // Focus the field for better accessibility
        setTimeout(() => {
          fieldElement.focus();
        }, 500); // Wait for scroll animation to complete
        
        // Add a subtle highlight effect to draw attention
        fieldElement.style.transition = 'box-shadow 0.3s ease';
        fieldElement.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.25)';
        
        // Remove highlight after 2 seconds
        setTimeout(() => {
          fieldElement.style.boxShadow = '';
        }, 2000);
      }
    }, 100); // Small delay to ensure DOM is updated and error is rendered
  }

  // Add method to handle Enter key press
  onFieldEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission
      
      // Check if we should auto-scroll when Enter is pressed
      if (this.signupForm.valid || this.shouldAutoScroll()) {
        this.scrollToSubmitButton();
      }
    }
  }

  // Enhanced method to handle form submission on Enter in the last field
  onLastFieldEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      
      // If form is valid, submit it
      if (this.signupForm.valid) {
        this.onSubmit();
      } else {
        // If not valid, just scroll to submit button to show validation errors
        this.scrollToSubmitButton();
      }
    }
  }
}
