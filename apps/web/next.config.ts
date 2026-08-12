import type { NextConfig } from 'next';
import path from 'path';
import { loadEnvConfig } from '@next/env';

// Load monorepo root .env so NEXT_PUBLIC_* vars are available to the web app.
loadEnvConfig(path.join(__dirname, '../..'));

const nextConfig: NextConfig = {};

export default nextConfig;
