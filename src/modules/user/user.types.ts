// Masih pake snake_case karena ini representasi database row, bukan domain model.

export type UserRole = "user" | "admin";

export type UserRow = {
  id: string;
  email: string;
  role: UserRole;
  created_at: Date;
};

export type AuthUserRow = {
  id: string;
  email: string;
  role: UserRole;
  created_at: Date;
  password_hash: string;
};
