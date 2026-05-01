import client from './client';

export const authAPI = {
  // Send OTP to phone number
  sendOTP: (phone) => client.post('/auth/otp/send', { phone }),

  // Verify OTP
  verifyOTP: (phone, otp) => client.post('/auth/otp/verify', { phone, otp }),

  // Google sign in
  googleSignIn: (idToken) => client.post('/auth/google', { idToken }),

  // Complete profile after signup
  setupProfile: (data) => client.post('/auth/profile/setup', data),

  // Refresh token
  refreshToken: () => client.post('/auth/refresh'),

  // Get current user
  getMe: () => client.get('/auth/me'),
};
