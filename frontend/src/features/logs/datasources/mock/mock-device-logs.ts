import type { DeviceLog } from "../../domain/device-log";

export const mockDeviceLogs: DeviceLog[] = [
  {
    deviceCode: "DEV-001",
    fullName: "John Smith",
    accessType: "0",
    time: "2024-01-20 14:25:30",
    result: "Success",
    similarity: "95.2%",
    note: "Access granted",
  },
  {
    deviceCode: "DEV-002",
    fullName: "Unknown",
    accessType: "1",
    time: "2024-01-20 13:45:22",
    result: "Warning",
    similarity: "-",
    note: "High CPU usage detected",
  },
  {
    deviceCode: "DEV-001",
    fullName: "Jane Doe",
    accessType: "1",
    time: "2024-01-20 12:15:45",
    result: "Failed",
    similarity: "67.8%",
    note: "Similarity below threshold",
  },
  {
    deviceCode: "DEV-003",
    fullName: "Unknown",
    accessType: "0",
    time: "2024-01-20 08:00:12",
    result: "Success",
    similarity: "-",
    note: "System startup completed",
  },
  {
    deviceCode: "DEV-004",
    fullName: "Michael Johnson",
    accessType: "0",
    time: "2024-01-20 11:30:18",
    result: "Success",
    similarity: "98.7%",
    note: "Access granted - VIP user",
  },
  {
    deviceCode: "DEV-001",
    fullName: "Admin User",
    accessType: "0",
    time: "2024-01-19 18:00:00",
    result: "Completed",
    similarity: "-",
    note: "Scheduled maintenance performed",
  },
];

