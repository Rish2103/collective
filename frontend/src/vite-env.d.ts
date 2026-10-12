/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MOCK_TOKEN_ADDRESS?: string;
  readonly VITE_COLLECTIVE_POOL_ADDRESS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
