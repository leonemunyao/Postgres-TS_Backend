// Defines login credentials
export interface ILoginCredentials {
  email: string;
  password: string;
}

// Defines registration data
export interface IRegistrationData {
  name: string;
  email: string;
  password: string;
}

// Defines authentication response
export interface IAuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

// Defines password reset
export interface IPasswordReset {
  email: string;
  token?: string;
  newPassword?: string;
}

