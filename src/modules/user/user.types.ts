// Masih pake snake_case karena ini representasi database row, bukan domain model.

export type UserRow = {
  id: string;
  email: string;
  role: string;
  created_at: Date;
};

export type AuthUserRow = {
  id: string;
  email: string;
  role: string;
  created_at: Date;
  password_hash: string;
};
