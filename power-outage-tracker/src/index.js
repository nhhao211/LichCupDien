const express = require('express');
const path = require('path');
const cron = require('node-cron');
const { initializeDatabase } = require('./database');
const { updatePowerOutageData } = require('./services/powerOutage');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, '../node_modules/bootstrap/dist/css')));

// Routes
app.use('/', require('./routes'));

// Initialize database
initializeDatabase();

// Schedule data update every 2 hours
cron.schedule('0 */2 * * *', async () => {
  console.log('Updating power outage data...');
  await updatePowerOutageData();
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
