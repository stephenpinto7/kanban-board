require('dotenv').config({ path: './server.env' });

const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const { createClient } = require('redis');
const RedisStore = require('connect-redis')(session);

const app = express();
const port = 3000;

app.use(express.json());
const redisClient = createClient({
  url: process.env.REDIS_URL,
  legacyMode: true,
});
redisClient.connect().catch(console.error);
const sessionOptions = {
  store: new RedisStore({ client: redisClient }),
  cookie: {
    maxAge: 1000 * 60 * 5,
  },
  secret: 'kanban',
  saveUninitialized: true,
  resave: false,
  rolling: true,
};
if (process.env.NODE_ENV === 'production') {
  sessionOptions.cookie.secure = true;
}
app.use(session(sessionOptions));

function isAuthenticated(req, res, next) {
  if (req.session && req.session.username) {
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

app.get('/api/accounts', isAuthenticated, async (req, res) => {
  res.json((await pool.query('SELECT * FROM account;')).rows);
});

app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username) {
      res.status(400);
      res.json({ error: 'No username supplied' });
      return;
    } else if (!password) {
      res.status(400);
      res.json({ error: 'No password supplied' });
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
  } catch (error) {
    console.error('Unexpected error during registration: %o', error);
    res.status(500);
    res.json({ error: 'An unexpected error occured' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
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
      res.json({ error: 'The supplied user does not exist' });
      return;
    }

    if (!bcrypt.compareSync(suppliedPassword, user.password)) {
      res.status(400);
      res.json({ error: 'Password was incorrect' });
      return;
    }

    req.session.username = user.username;
    res.json({ message: 'Login success' });
  } catch (error) {
    console.error('Unexpected error during login: %o', error);
    res.status(500);
    res.json({ error: 'An unexpected error occured' });
  }
});

app.listen(port, () => {
  console.log(`Kanban board listening on port ${port}`);
});
