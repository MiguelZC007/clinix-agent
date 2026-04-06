module.exports = {
  apps: [
    {
      name: "clinica-frontend",
      script: "pnpm start",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        PORT: process.env.PORT || "4301",
      },
    },
  ],
};
