import type { VersionDTO } from "../types"

export const mockVersions: VersionDTO[] = [
  {
    id: "version-1",
    version_code: "2.1.5",
    version_name: "Multi Faces Detection",
    file_url: "https://example.com/app-v2.1.5.apk",
    file_size: 45678901, // ~43.5 MB
    sha256: "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
    note: "Critical security update and performance improvements",
    created_at: "2025-08-20T14:30:00Z"
  },
  {
    id: "version-2", 
    version_code: "2.1.4",
    version_name: "Connectivity Fix",
    file_url: "https://example.com/app-v2.1.4.apk",
    file_size: 44892367, // ~42.8 MB
    sha256: "b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567",
    note: "Bug fixes for device connectivity issues",
    created_at: "2025-08-18T09:15:00Z"
  },
  {
    id: "version-3",
    version_code: "2.1.3",
    version_name: "Enhanced Recognition",
    file_url: "https://example.com/app-v2.1.3.apk", 
    file_size: 44123456, // ~42.1 MB
    sha256: "c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678",
    note: "Added new face recognition algorithms",
    created_at: "2025-08-15T16:45:00Z"
  },
  {
    id: "version-4",
    version_code: "2.1.2",
    version_name: null, // No version name
    file_url: "https://example.com/app-v2.1.2.apk",
    file_size: 43567890, // ~41.6 MB
    sha256: "d4e5f6789012345678901234567890abcdef1234567890abcdef123456789",
    note: null, // No note
    created_at: "2025-08-12T11:20:00Z"
  },
  {
    id: "version-5",
    version_code: "2.1.1",
    version_name: "UI Improvements",
    file_url: "https://example.com/app-v2.1.1.apk",
    file_size: 42987654, // ~41.0 MB
    sha256: "e5f6789012345678901234567890abcdef1234567890abcdef1234567890",
    note: "Minor UI improvements and stability fixes",
    created_at: "2025-08-10T08:00:00Z"
  },
  {
    id: "version-6",
    version_code: "2.1.0",
    version_name: "Dashboard Release",
    file_url: "https://example.com/app-v2.1.0.apk",
    file_size: 41234567, // ~39.3 MB
    sha256: "f6789012345678901234567890abcdef1234567890abcdef12345678901",
    note: "Major release with new dashboard and analytics features",
    created_at: "2025-08-05T13:30:00Z"
  },
  {
    id: "version-7",
    version_code: "2.0.9",
    version_name: "Temperature Hotfix",
    file_url: "https://example.com/app-v2.0.9.apk",
    file_size: 40876543, // ~39.0 MB
    sha256: "6789012345678901234567890abcdef1234567890abcdef123456789012",
    note: "Hotfix for temperature sensor readings",
    created_at: "2025-08-02T10:15:00Z"
  }
]
