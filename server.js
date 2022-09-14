require('dotenv').config({ path: './server.env' });

const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const { createClient } = require('redis');
const RedisStore = require('connect-redis')(session);
const helmet = require('helmet');

const app = express();
const port = 3000;

app.use(helmet());
app.use(express.json());
const redisClient = createClient({
  url: process.env.REDIS_URL,
  legacyMode: true,
});
redisClient.on('error', console.error);
redisClient.connect().catch(console.error);
const sessionOptions = {
  store: new RedisStore({ client: redisClient }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
  secret: 'kanban',
  saveUninitialized: false,
  resave: false,
  rolling: true,
};
if (process.env.NODE_ENV === 'production') {
  sessionOptions.cookie.secure = true;
}
app.use(session(sessionOptions));
app.use((req, res, next) => {
  if (!req.session) {
    return next(new Error('Session Error'));
  } else {
    next();
  }
});

function isAuthenticated(req, res, next) {
  if (req.session && req.session.username && req.session.username.length > 0) {
    next();
  } else {
    res.status(401);
    res.json({ error: 'User is not logged in' });
  }
}

const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.POSTGRESQL_HOST,
  post: process.env.POSTGRESQL_PORT,
  database: process.env.POSTGRESQL_DB,
  user: process.env.POSTGRESQL_USER,
  password: process.env.POSTGRESQL_PASSWORD,
});

/**
 *
 * @param {string} username
 */
async function getUser(username) {
  const result = await pool.query(
    'SELECT * FROM account WHERE username = $1;',
    [username]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

app.get('/api/username', isAuthenticated, async (req, res) => {
  res.json({ result: req.session.username });
});

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username) {
    res.status(400);
    res.json({ error: 'No username supplied' });
    return;
  } else if (username.length > 20) {
    res.status(400);
    res.json({ error: 'Username must be 20 characters or less' });
    return;
  } else if (!password) {
    res.status(400);
    res.json({ error: 'No password supplied' });
    return;
  } else if (password.length > 120) {
    res.status(400);
    res.json({ error: 'Password must be 120 characters or less' });
    return;
  }

  if (await getUser(username)) {
    res.status(400);
    res.json({ error: 'Username already exists' });
    return;
  }

  const salt = bcrypt.genSaltSync(12);
  const passwordHash = bcrypt.hashSync(password, salt);

  const insertResult = await pool.query(
    'INSERT INTO account (username, password, salt, created_date) VALUES ($1, $2, $3, NOW())',
    [username, passwordHash, salt]
  );

  if (insertResult.rowCount === 0) {
    res.status(500);
    res.json({ error: 'Failed to create new user' });
    return;
  }

  res.json({ message: 'Registration success' });
});

app.post('/api/login', async (req, res) => {
  const { username: suppliedUsername, password: suppliedPassword } = req.body;
  if (!suppliedUsername) {
    res.status(400);
    res.json({ error: 'No username supplied' });
    return;
  } else if (!suppliedPassword) {
    res.status(400);
    res.json({ error: 'No password supplied' });
    return;
  }

  const user = await getUser(suppliedUsername);
  if (!user) {
    res.status(400);
    res.json({ error: 'Username is not registered' });
    return;
  }

  if (!bcrypt.compareSync(suppliedPassword, user.password)) {
    res.status(400);
    res.json({ error: 'Password was incorrect' });
    return;
  }

  req.session.username = user.username;
  res.json({ message: 'Login success' });
});

app.get('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logout success' });
});

// custom 404
app.use((req, res, next) => {
  res.status(404).json({ error: 'Requested resource cannot be found' });
});

// custom error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'An unexpected error occured!' });
});

app.listen(port, () => {
  console.log(`Kanban board listening on port ${port}`);
});
