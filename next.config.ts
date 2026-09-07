import type { NextConfig } from 'next';

const config: NextConfig = {
  // Isolate local validation builds from an already-running application.
  distDir: process.env.CIVIGRAPH_BUILD_DIR || '.next',
};

export default config;
