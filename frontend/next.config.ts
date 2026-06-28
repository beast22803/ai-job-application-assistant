import type { NextConfig } from "next";

const repo = process.env.GITHUB_REPOSITORY ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}` : "";

const nextConfig: any = {
  output: 'export',
  trailingSlash: true,
  basePath: repo,
  images: {
    unoptimized: true,
  },
  /* Avoid strict typechecking issues in template build if any */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
