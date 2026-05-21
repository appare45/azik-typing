import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      // .dat.gz はkuromoji側でgunzipするため、サーバーが自動展開しないようContent-Encodingを除去する
      name: 'no-auto-gunzip-dat-gz',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.includes('.dat.gz')) {
            const origSetHeader = res.setHeader.bind(res);
            res.setHeader = (name: string, value: string | number | readonly string[]) => {
              if (name.toLowerCase() === 'content-encoding') return res;
              return origSetHeader(name, value);
            };
          }
          next();
        });
      },
    },
  ],
})
