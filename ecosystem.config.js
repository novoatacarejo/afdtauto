module.exports = {
  apps: [
    {
      name: 'afdtauto-195',
      script: 'main.js',
      interpreter: 'node',
      //args: '--pending',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
