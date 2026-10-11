module.exports = {
  apps: [
    {
      name: "mcp",
      script: "node_modules/tsx/dist/cli.mjs",
      args: "src/server.ts",
      node_args: "--env-file=.env",
      cwd: __dirname,
    },
    {
      name: "ngrok",
      script: "C:/Users/Earl John Flores/AppData/Local/Microsoft/WinGet/Packages/Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe/ngrok.exe",
      args: "http --domain=abrasive-onboard-tasting.ngrok-free.dev 3000",
      interpreter: "none",
      windowsHide: true,
    },
  ],
};
