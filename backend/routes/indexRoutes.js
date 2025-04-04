const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const routesDir = __dirname;

fs.readdirSync(routesDir).forEach((file) => {
  if (file !== 'indexRoutes.js' && file.endsWith('Routes.js')) {
    const route = require(path.join(routesDir, file));
    const routePath = `/api/${file.replace('Routes.js', '').toLowerCase()}`;
    router.use(routePath, route);
    console.log(`Rota registrada: ${routePath}`);
  }
});

module.exports = router;
