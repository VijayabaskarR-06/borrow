import vinext from 'vinext';
import { defineConfig } from 'vite';
import { sites } from './scripts/vite/sites-vite-plugin';
import { configureToolEnvironment } from './scripts/tool-environment.mjs';
export default defineConfig(async()=>{
  configureToolEnvironment(process.cwd());
  const { cloudflare } = await import('@cloudflare/vite-plugin');
  return {server:{host:'127.0.0.1'}, plugins:[vinext(),sites({mockAuth:true}),cloudflare({viteEnvironment:{name:'rsc',childEnvironments:['ssr']},inspectorPort:false,config:{main:'./worker/index.ts',compatibility_flags:['nodejs_compat'],d1_databases:[{binding:'DB',database_name:'borrow-local',database_id:'00000000-0000-4000-8000-000000000000',migrations_dir:'drizzle'}]}})]};
});
