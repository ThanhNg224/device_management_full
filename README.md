## 📋 Project Overview

**Device Management** is a full-stack platform designed to manage and update Android-based Face Terminal machines over a local network. The system enables real-time device monitoring, access log viewing, and remote APK updates.

### 🔧 Tech Stack
- **Frontend**: Built with Next.js and Tailwind CSS. Provides a responsive web dashboard to view device status, check logs, and trigger updates.
- **Backend**: Node.js with Express and WebSocket. Handles file uploads, device registration, and sending update commands to terminals.
- **Android Tool**: A native Kotlin service running on rooted Face Terminal devices. Listens for update commands, downloads APKs, and performs silent installation via `pm install -r`.

### 💡 Key Features
- Device table with status (online/offline), CPU/RAM stats, version info
- Detailed device logs fetched from MongoDB
- OTA APK upload + push update per device
- Local-network-first design, no external dependency
- Socket-based real-time communication

This tool is designed for internal deployment in enterprise environments where device fleets need to be maintained efficiently and securely.
