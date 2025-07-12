import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class SignupComponent implements OnInit, OnDestroy {
  signupForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  hidePassword = true;
  hideConfirmPassword = true;
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
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private createSignupForm(): FormGroup {
    const form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      phoneNumber: ['', [this.optionalPhoneValidator.bind(this)]],  // Optional with validation
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      role: ['parent', [Validators.required]]
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
    if (this.signupForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const signupData: SignupRequest = {
        username: this.signupForm.value.username.trim(),
        email: this.signupForm.value.email.trim().toLowerCase(),
        firstName: this.signupForm.value.firstName.trim(),
        lastName: this.signupForm.value.lastName.trim(),
        password: this.signupForm.value.password,
        phoneNumber: this.signupForm.value.phoneNumber?.trim() || undefined,
        role: [this.signupForm.value.role]
      };

      this.subscription.add(
        this.authService.signup(signupData).subscribe({
          next: (response: any) => {
            console.log('✅ Signup successful:', response);
            this.isLoading = false;
            this.successMessage = response.message || 'Account created successfully! You can now sign in.';
            
            // Auto-close dialog after 2 seconds
            setTimeout(() => {
              this.dialogRef.close({ success: true, message: this.successMessage });
            }, 2000);
          },
          error: (error: any) => {
            console.error('❌ Signup failed:', error);
            this.isLoading = false;
            
            if (error.status === 400) {
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

  onCancel(): void {
    this.dialogRef.close({ success: false });
  }

  // Form validation helpers
  getFieldError(fieldName: string): string {
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
    return !!(field?.errors && field.touched);
  }

  // Password strength indicator
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

  private optionalPhoneValidator(control: AbstractControl) {
    const value = control.value;
    if (!value || value.trim() === '') {
      return null; // Valid if empty
    }
    
    const phonePattern = /^[0-9]{10,15}$/;
    return phonePattern.test(value) ? null : { invalidPhone: true };
  }
}
