module.exports = {
  apps: [
    {
      name: 'afdtauto',
      script: 'main.js',
      interpreter: 'node',
      //args: '--pending',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
