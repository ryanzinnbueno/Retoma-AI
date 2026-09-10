import {fileURLToPath,URL} from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import {defineConfig} from 'vite';

export default defineConfig({
 root:'vercel-spa',publicDir:'../public',
 plugins:[react()],
 resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},
 css:{postcss:{plugins:[tailwindcss()]}},
 build:{outDir:'../vercel-dist',emptyOutDir:true},
});
