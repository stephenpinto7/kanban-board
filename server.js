const express = require('express');
const app = express();
const port = 3000;

const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  post: 5432,
  database: 'kanban_database',
  user: 'kanban_board_service',
  password: 'magical_password',
});

app.get('/api/accounts', async (req, res) => {
  res.json((await pool.query('SELECT * FROM account;')).rows);
});

app.listen(port, () => {
  console.log(`Kanban board listening on port ${port}`);
});
