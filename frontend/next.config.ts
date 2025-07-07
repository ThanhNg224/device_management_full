import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/device/listDevice",
        destination: "http://192.168.1.157:3000/api/device/listDevice",
      },
    ]
  },
}

export default nextConfig
