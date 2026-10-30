// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // supabase/functions run on Deno (jsr: imports), not in the app bundle
    ignores: ["dist/*", "supabase/functions/**"],
  }
]);
