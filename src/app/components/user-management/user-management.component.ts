import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService, User, CreateUserRequest, UpdateUserRequest } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  isLoading = false;
  isCreatingUser = false;
  showCreateForm = false;
  editingUser: User | null = null;
  
  createUserForm: FormGroup;
  editUserForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.createUserForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['USER', [Validators.required]]
    });

    this.editUserForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      password: [''],
      role: ['USER', [Validators.required]],
      status: ['ACTIVE', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.toastService.showError('Error', 'Failed to load users');
        this.isLoading = false;
      }
    });
  }

  onCreateUser(): void {
    if (this.createUserForm.valid) {
      this.isCreatingUser = true;
      const userData: CreateUserRequest = this.createUserForm.value;

      this.userService.createUser(userData).subscribe({
        next: (response) => {
          this.isCreatingUser = false;
          if (response.success) {
            this.toastService.showSuccess('Success', 'User created successfully');
            this.createUserForm.reset();
            this.showCreateForm = false;
            this.loadUsers();
          } else {
            this.toastService.showError('Error', response.message || 'Failed to create user');
          }
        },
        error: (error) => {
          this.isCreatingUser = false;
          console.error('Error creating user:', error);
          this.toastService.showError('Error', 'Failed to create user');
        }
      });
    } else {
      this.markFormGroupTouched(this.createUserForm);
    }
  }

  onEditUser(user: User): void {
    this.editingUser = user;
    this.editUserForm.patchValue({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      password: ''
    });
  }

  onUpdateUser(): void {
    if (this.editUserForm.valid && this.editingUser) {
      const updateData: UpdateUserRequest = { ...this.editUserForm.value };
      
      // Remove empty password
      if (!updateData.password) {
        delete updateData.password;
      }

      this.userService.updateUser(this.editingUser.id, updateData).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.showSuccess('Success', 'User updated successfully');
            this.editingUser = null;
            this.loadUsers();
          } else {
            this.toastService.showError('Error', response.message || 'Failed to update user');
          }
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.toastService.showError('Error', 'Failed to update user');
        }
      });
    } else {
      this.markFormGroupTouched(this.editUserForm);
    }
  }

  onDeleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.showSuccess('Success', 'User deleted successfully');
            this.loadUsers();
          } else {
            this.toastService.showError('Error', response.message || 'Failed to delete user');
          }
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.toastService.showError('Error', 'Failed to delete user');
        }
      });
    }
  }

  cancelEdit(): void {
    this.editingUser = null;
    this.editUserForm.reset();
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.createUserForm.reset();
    }
  }

  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.authorities?.some((auth: any) => auth.authority === 'ROLE_ADMIN') || false;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
