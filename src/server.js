const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3500;

app.use(express.static(path.join('C:/node/afdtauto', 'public')));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

app.use(express.static('public'));

const jsonPath = path.join('C:/node/afdtauto/json', 'fails.json');

app.get('/logs', (req, res) => {
  try {
    const data = fs.readFileSync(jsonPath, 'utf8');
    const logs = JSON.parse(data).data;

    res.json(logs);
  } catch (err) {
    console.error('Error reading JSON file:', err);
    res.status(500).json({ error: 'Failed to read logs' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
