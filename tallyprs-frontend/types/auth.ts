export type RegisterRequest = {
  email: string;
  username: string;
  password: string;
};

export type LoginRequest = {
  emailOrUsername: string;
  password: string;
};

export type AuthResponse = {
  user: {
    email: string;
    userName: string;
    id: string;
  };
  accessToken: string;
  refreshToken: string;
  accessTokenExpiration: string;
};
