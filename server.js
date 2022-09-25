require('dotenv').config({ path: './server.env' });

const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const { createClient } = require('redis');
const RedisStore = require('connect-redis')(session);
const helmet = require('helmet');
const asyncHandler = require('express-async-handler');

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
    res.status(401).json({ error: 'User is not logged in' });
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

app.get(
  '/api/username',
  isAuthenticated,
  asyncHandler(async (req, res) => {
    res.json(req.session.username);
  })
);

app.post(
  '/api/register',
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username) {
      res.status(400).json({ error: 'No username supplied' });
      return;
    } else if (typeof username !== 'string') {
      res.status(400).json({ error: 'Username must be a string' });
      return;
    } else if (username.length > 20) {
      res.status(400).json({ error: 'Username must be 20 characters or less' });
      return;
    } else if (!password) {
      res.status(400).json({ error: 'No password supplied' });
      return;
    } else if (typeof password !== 'string') {
      res.status(400).json({ error: 'Password must be a string' });
      return;
    } else if (password.length > 120) {
      res
        .status(400)
        .json({ error: 'Password must be 120 characters or less' });
      return;
    }

    if (await getUser(username)) {
      res.status(400).json({ error: 'Username already exists' });
      return;
    }

    const salt = bcrypt.genSaltSync(12);
    const passwordHash = bcrypt.hashSync(password, salt);

    const insertResult = await pool.query(
      'INSERT INTO account (username, password, salt, created_date) VALUES ($1, $2, $3, NOW())',
      [username, passwordHash, salt]
    );

    if (insertResult.rowCount === 0) {
      res.status(500).json({ error: 'Failed to create new user' });
      return;
    }

    res.status(204).json();
  })
);

app.post(
  '/api/login',
  asyncHandler(async (req, res) => {
    const { username: suppliedUsername, password: suppliedPassword } = req.body;
    if (!suppliedUsername) {
      res.status(400).json({ error: 'No username supplied' });
      return;
    } else if (typeof suppliedUsername !== 'string') {
      res.status(400).json({ error: 'Username must be a string' });
      return;
    } else if (!suppliedPassword) {
      res.status(400).json({ error: 'No password supplied' });
      return;
    } else if (typeof suppliedPassword !== 'string') {
      res.status(400).json({ error: 'Password must be a string' });
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

    req.session.regenerate(() => {
      req.session.username = user.username;
      req.session.userId = user.id;
      res.status(204).json();
    });
  })
);

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.status(204).json());
});

app
  .route('/api/boards')
  .get(
    isAuthenticated,
    asyncHandler(async (req, res) => {
      const result = await pool.query(
        'SELECT * FROM board WHERE owner_id = $1',
        [req.session.userId]
      );

      res.json({ result: result.rows });
    })
  )
  .post(
    isAuthenticated,
    asyncHandler(async (req, res) => {
      const { title } = req.body;

      if (!title) {
        res.status(400).json({ error: 'No title supplied' });
        return;
      } else if (typeof title !== 'string') {
        res.status(400).json({ error: 'Title must be a string' });
      }

      const client = await pool.connect();
      try {
        const createResult = await client.query(
          'INSERT INTO board (owner_id, title, created_date, last_updated) VALUES ($1, $2, NOW(), NOW()) returning id',
          [req.session.userId, title]
        );

        if (createResult.rowCount === 0) {
          res.status(500).json({ error: 'Failed to create new board' });
          return;
        }

        const newBoardResult = await client.query(
          'SELECT * FROM board WHERE id = $1 AND owner_id = $2',
          [createResult.rows[0].id, req.session.userId]
        );

        return res.status(201).json(newBoardResult.rows[0]);
      } catch (error) {
        throw error;
      } finally {
        client.release();
      }
    })
  );

app
  .route('/api/boards/:boardId')
  .get(
    isAuthenticated,
    asyncHandler(async (req, res) => {
      const { boardId } = req.params;

      if (!boardId) {
        res.status(400).json({ error: 'No board id supplied' });
        return;
      }

      const result = await pool.query(
        'SELECT * FROM board WHERE id = $1 AND owner_id = $2',
        [boardId, req.session.userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Unable to find board' });
        return;
      }

      res.json({ result: result.rows[0] });
    })
  )
  .delete(
    isAuthenticated,
    asyncHandler(async (req, res) => {
      const { boardId } = req.params;

      if (!boardId) {
        res.status(400).json({ error: 'No board id supplied' });
        return;
      }

      const result = await pool.query(
        'DELETE FROM board WHERE owner_id = $1 AND id = $2',
        [req.session.userId, boardId]
      );

      if (result.rowCount === 0) {
        res.status(500).json({ error: 'Unable to delete board' });
        return;
      }

      res.status(204).json();
    })
  );

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
