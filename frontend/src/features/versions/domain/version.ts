export interface Version {
  id: string;
  versionCode: string;
  versionName: string | null;
  fileUrl: string;
  fileSize: number | null;
  sha256: string | null;
  note: string | null;
  createdAt: string;
  status: number;
  statusTitle: string | null;
}

