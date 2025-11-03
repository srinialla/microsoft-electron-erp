export type UserRow = {
  id: number;
  username: string;
  password_hash: string;
  role: string;
  created_at: string;
};

export type SettingRow = {
  key: string;
  value: string;
  updated_at: string;
};

export type ActivityLogRow = {
  id: number;
  user_id: number | null;
  action: string;
  metadata: string | null;
  created_at: string;
};

export type DbSchema = {
  users: UserRow;
  settings: SettingRow;
  activity_log: ActivityLogRow;
};
