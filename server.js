require('dotenv').config({ path: './server.env' });

const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const Redis = require('ioredis');
const pgp = require('pg-promise')();
const RedisStore = require('connect-redis')(session);
const helmet = require('helmet');
const asyncHandler = require('express-async-handler');
const {
  body,
  checkSchema,
  param,
  validationResult,
} = require('express-validator');

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const app = express();
const port = process.env.port || 3000;

app.use(helmet());
app.use(express.json());

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

redis.addListener('error', (error) => {
  console.error(
    'Redis Error: %o\nHost was: %s\nPort was: %s',
    error,
    process.env.REDIS_HOST,
    process.env.REDIS_PORT
  );
});

const sessionOptions = {
  store: new RedisStore({ client: redis }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false,
  resave: false,
  rolling: true,
};
if (process.env.NODE_ENV === 'production') {
  sessionOptions.cookie.secure = true;
  sessionOptions.cookie.httpOnly = true;

  app.enable('trust proxy');
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

function validateParams(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    res.status(400).json({
      error: `Error with param '${firstError.param}': ${firstError.msg}`,
    });
  } else {
    next();
  }
}

const db = pgp({
  host: process.env.POSTGRESQL_HOST,
  port: process.env.POSTGRESQL_PORT,
  database: process.env.POSTGRESQL_DB,
  user: process.env.POSTGRESQL_USER,
  password: process.env.POSTGRESQL_PASSWORD,
});

app.use('/', express.static(path.resolve(__dirname, 'dist', 'spa')));

app.get(
  '/api/user',
  isAuthenticated,
  asyncHandler(async (req, res) => {
    res.json({ username: req.session.username, userId: req.session.userId });
  })
);

const validateUsername = body('username')
  .exists({ checkNull: true, checkFalsy: true })
  .withMessage('no username supplied')
  .isString()
  .withMessage('username must be a string')
  .isLength({ max: 20 })
  .withMessage('username should be 20 characters or less');

const validatePassword = body('password')
  .exists({ checkNull: true, checkFalsy: true })
  .withMessage('no password supplied')
  .isString()
  .withMessage('password must be a string')
  .isLength({ max: 120 })
  .withMessage('password should be 120 characters or less');

app.post(
  '/api/register',
  validateUsername,
  validatePassword,
  validateParams,
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    const user = await db.tx(async (tx) => {
      const user = await tx.oneOrNone(
        'SELECT * FROM account WHERE username = $1;',
        [username]
      );

      if (user) {
        throw new ApiError(400, 'Username already exists');
      }

      const salt = bcrypt.genSaltSync(12);
      const passwordHash = bcrypt.hashSync(password, salt);

      return await tx.one(
        'INSERT INTO account (username, password, salt, created_date) VALUES ($1, $2, $3, NOW()) RETURNING id, username',
        [username, passwordHash, salt]
      );
    });

    req.session.regenerate(() => {
      req.session.username = user.username;
      req.session.userId = user.id;
      res.status(201).json({ username: user.username, userId: user.id });
    });
  })
);

app.post(
  '/api/login',
  validateUsername,
  validatePassword,
  validateParams,
  asyncHandler(async (req, res) => {
    const { username: suppliedUsername, password: suppliedPassword } = req.body;

    const user = await db.oneOrNone(
      'SELECT * FROM account WHERE username = $1;',
      [suppliedUsername]
    );
    if (!user) {
      throw new ApiError(400, 'no account exists with the supplied username');
    }

    if (!bcrypt.compareSync(suppliedPassword, user.password)) {
      throw new ApiError(400, 'password was incorrect');
    }

    req.session.regenerate(() => {
      req.session.username = user.username;
      req.session.userId = user.id;
      res.status(200).json({ username: user.username, userId: user.id });
    });
  })
);

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.status(204).json(null));
});

app.get(
  '/api/users/:username',
  param('username')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('no username supplied')
    .isString()
    .withMessage('username must be a string'),
  validateParams,
  asyncHandler(async (req, res) => {
    const { username } = req.params;

    const user = await db.oneOrNone(
      'SELECT id FROM account WHERE username = $1',
      [username]
    );
    if (!user) {
      throw new ApiError(404);
    }

    return res.json(user.id);
  })
);

app
  .route('/api/boards')
  .get(
    isAuthenticated,
    asyncHandler(async (req, res) => {
      const boards = await db.any(
        'SELECT b.* FROM board_user bu inner join board b on bu.board_id = b.id WHERE bu.user_id = $1',
        [req.session.userId]
      );

      res.json(boards);
    })
  )
  .post(
    isAuthenticated,
    body('title')
      .exists({ checkFalsy: true, checkNull: true })
      .withMessage('no title supplied')
      .isString()
      .withMessage('title must be a string')
      .isLength({ max: 20 }),
    validateParams,
    asyncHandler(async (req, res) => {
      const { title } = req.body;

      const board = await db.tx(async (tx) => {
        const board = await tx.one(
          'INSERT INTO board (owner_id, title, created_date, last_updated) VALUES ($1, $2, NOW(), NOW()) RETURNING *',
          [req.session.userId, title]
        );

        await tx.one(
          'INSERT INTO board_user (user_id, board_id) VALUES ($1, $2) RETURNING id',
          [req.session.userId, board.id]
        );

        return board;
      });

      res.status(201).json(board);
    })
  );

const validateBoardId = param('boardId')
  .exists({ checkFalsy: true, checkNull: true })
  .withMessage('No boardId supplied')
  .isNumeric()
  .withMessage('boardId should be numeric');

app
  .route('/api/boards/:boardId')
  .get(
    isAuthenticated,
    validateBoardId,
    validateParams,
    asyncHandler(async (req, res) => {
      const { boardId } = req.params;

      const board = await db.tx(async (tx) => {
        const board = await tx.oneOrNone('SELECT * FROM board WHERE id = $1', [
          boardId,
        ]);

        if (!board) {
          throw new ApiError(404);
        }

        const board_user = await tx.oneOrNone(
          'SELECT * FROM board_user WHERE board_id = $1 AND user_id = $2',
          [boardId, req.session.userId]
        );

        if (!board_user) {
          throw new ApiError(
            403,
            'you are not a user for this board. Please request permission from the board owner.'
          );
        }

        return board;
      });

      res.json(board);
    })
  )
  .delete(
    isAuthenticated,
    validateBoardId,
    validateParams,
    asyncHandler(async (req, res) => {
      const { boardId } = req.params;

      await db.tx(async (tx) => {
        const board = await tx.oneOrNone('SELECT * FROM board WHERE id = $1', [
          boardId,
        ]);

        if (!board) {
          throw new ApiError(404);
        } else if (board.owner_id !== req.session.userId) {
          throw new ApiError(
            403,
            'You are not the owner of this board. Please contact the board owner.'
          );
        }

        // Need to remove any outstanding tasks or board users before deleting actual board
        await tx.any('DELETE FROM task WHERE board_id = $1', [boardId]);
        await tx.any('DELETE FROM board_user WHERE board_id = $1', [boardId]);

        await tx.one('DELETE FROM board WHERE id = $1 RETURNING id', [boardId]);
      });

      res.status(204).json(null);
    })
  );

const validateTask = checkSchema({
  state: {
    in: ['body'],
    exists: {
      options: { checkNull: true, checkFalsy: true },
      errorMessage: 'no task state supplied',
    },
    in: {
      options: ['TODO', 'WIP', 'DONE'],
      errorMessage: "task state should be one of: 'TODO', 'WIP', 'DONE'",
    },
  },
  title: {
    exists: {
      options: { checkNull: true, checkFalsy: true },
      errorMessage: 'no title supplied',
    },
    isString: {
      options: true,
      errorMessage: 'title should be a string',
    },
    isLength: {
      options: { max: 20 },
      errorMessage: 'title should be 20 characters or less',
    },
  },
  description: {
    exists: {
      options: { checkNull: true, checkFalsy: false },
      errorMessage: 'no description supplied',
    },
    isString: {
      options: true,
      errorMessage: 'description should be a string',
    },
    isLength: {
      options: { max: 500 },
      errorMessage: 'description should be 500 characters or less',
    },
  },
  assignee: {
    optional: {
      options: {
        nullable: true,
        checkFalsy: false,
      },
    },
    isInt: {
      options: true,
      errorMessage: 'assignee should be an integer',
    },
  },
});

const validateUserId = param('userId')
  .exists({ checkFalsy: true, checkNull: true })
  .withMessage('No userId supplied')
  .isNumeric()
  .withMessage('userId should be numeric');

app
  .route('/api/boards/:boardId/users')
  .get(
    isAuthenticated,
    validateBoardId,
    validateParams,
    asyncHandler(async (req, res) => {
      const { boardId } = req.params;

      const users = await db.any(
        'SELECT a.id, a.username FROM board_user bu inner join account a on a.id = bu.user_id WHERE bu.board_id = $1 ORDER BY a.username',
        [boardId]
      );

      res.json(users);
    })
  )
  .post(
    isAuthenticated,
    validateBoardId,
    body('userId')
      .exists({ checkFalsy: true, checkNull: true })
      .withMessage('No userId supplied')
      .isNumeric()
      .withMessage('userId should be numeric'),
    validateParams,
    asyncHandler(async (req, res) => {
      const { boardId } = req.params;
      const { userId } = req.body;
      const user = await db.tx(async (tx) => {
        const board = await tx.oneOrNone('SELECT * FROM board WHERE id = $1', [
          boardId,
        ]);

        if (!board) {
          throw new ApiError(404);
        } else if (board.owner_id !== req.session.userId) {
          throw new ApiError(
            403,
            'you are not the owner of this board. Please contact the board owner.'
          );
        }

        const user = await tx.oneOrNone(
          'SELECT id, username FROM account WHERE id = $1',
          [userId]
        );
        if (!user) {
          throw new ApiError(400, 'no user with supplied id');
        }

        await tx.one(
          'INSERT INTO board_user (user_id, board_id) VALUES ($1, $2) RETURNING id',
          [userId, boardId]
        );

        await tx.one(
          'UPDATE board set last_updated = NOW() where id = $1 returning id',
          [board.id]
        );

        return user;
      });

      return res.status(201).json(user);
    })
  );

app
  .route('/api/boards/:boardId/users/:userId')
  .get(
    isAuthenticated,
    validateBoardId,
    validateUserId,
    validateParams,
    asyncHandler(async (req, res) => {
      const { boardId, userId } = req.params;

      const user = await db.tx(async (tx) => {
        const board = await tx.oneOrNone('SELECT * FROM board WHERE id = $1', [
          boardId,
        ]);
        if (!board) {
          throw new ApiError(404, 'no board exists with the supplied id');
        }

        const user = await tx.oneOrNone('SELECT * FROM account WHERE id = $1', [
          userId,
        ]);
        if (!user) {
          throw new ApiError(404, 'no user exists with the supplied id');
        }

        const board_user = await tx.oneOrNone(
          'SELECT * FROM board_user WHERE board_id = $1 AND user_id = $2',
          [boardId, userId]
        );
        if (!board_user) {
          throw new ApiError(400, 'user is not added to the supplied board');
        }

        return user;
      });

      res.json(user);
    })
  )
  .delete(
    isAuthenticated,
    validateBoardId,
    validateUserId,
    validateParams,
    asyncHandler(async (req, res) => {
      const { boardId, userId } = req.params;

      await db.tx(async (tx) => {
        const board = await tx.oneOrNone('SELECT * FROM board WHERE id = $1', [
          boardId,
        ]);
        if (!board) {
          throw new ApiError(404);
        }

        const user = await tx.oneOrNone('SELECT * FROM account WHERE id = $1', [
          userId,
        ]);
        if (!user) {
          throw new ApiError(404, 'no user exists with the supplied id');
        }

        // Unassign the removed user's tasks
        await tx.any(
          'UPDATE task SET assignee_id = NULL WHERE assignee_id = $1',
          [userId]
        );

        await tx.oneOrNone(
          'DELETE FROM board_user WHERE board_id = $1 AND user_id = $2',
          [boardId, userId]
        );

        await tx.one(
          'UPDATE board SET last_updated = NOW() WHERE id = $1 RETURNING id',
          [board.id]
        );
      });

      res.status(204).json(null);
    })
  );

app
  .route('/api/boards/:boardId/tasks')
  .all(isAuthenticated, validateBoardId)
  .get(
    validateParams,
    asyncHandler(async (req, res) => {
      const { boardId } = req.params;

      const tasks = await db.tx(async (tx) => {
        const board = await tx.oneOrNone('SELECT * FROM board WHERE id = $1', [
          boardId,
        ]);
        if (!board) {
          throw new ApiError(404);
        }

        return await tx.any('SELECT * FROM task WHERE board_id = $1', [
          boardId,
        ]);
      });

      return res.json(tasks);
    })
  )
  .post(
    validateTask,
    validateParams,
    asyncHandler(async (req, res) => {
      const { boardId } = req.params;
      const { title, state, description, assignee } = req.body;

      const task = await db.tx(async (tx) => {
        const board = await tx.oneOrNone('SELECT * FROM board WHERE id = $1', [
          boardId,
        ]);
        if (!board) {
          throw new ApiError(404, 'no board exists with the supplied id');
        }

        if (assignee) {
          const user = await tx.oneOrNone(
            'SELECT * FROM account where id = $1',
            [assignee]
          );
          if (!user) {
            throw new ApiError(
              404,
              'no user exists with the supplied assignee id'
            );
          }
        }

        const task = await tx.one(
          'INSERT INTO task (board_id, author_id, assignee_id, state, title, description, created_date, last_updated) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) returning *',
          [
            boardId,
            req.session.userId,
            assignee ?? null,
            state,
            title,
            description,
          ]
        );

        await tx.one(
          'UPDATE board set last_updated = NOW() where id = $1 returning *',
          [board.id]
        );

        return task;
      });

      res.status(201).json(task);
    })
  );

const validateTaskId = param('taskId')
  .exists({ checkFalsy: true, checkNull: true })
  .withMessage('no taskId supplied')
  .isNumeric()
  .withMessage('taskId should be numeric');

app
  .route('/api/boards/:boardId/tasks/:taskId')
  .all(isAuthenticated, validateBoardId, validateTaskId)
  .get(
    validateParams,
    asyncHandler(async (req, res) => {
      const { boardId, taskId } = req.params;

      const task = await db.tx(async (tx) => {
        const board = await tx.oneOrNone('SELECT * FROM board WHERE id = $1', [
          boardId,
        ]);
        if (!board) {
          throw new ApiError(404, 'no board exists with the supplied id');
        }

        const board_user = await task.oneOrNone(
          'SELECT * FROM board_user WHERE board_id = $1 AND user_id = $2',
          [boardId, req.session.userId]
        );
        if (!board_user) {
          throw new ApiError(
            403,
            'you are not a user for this board, please request permission from the board owner.'
          );
        }

        const task = await task.oneOrNone('SELECT * FROM task WHERE id = $1', [
          taskId,
        ]);
        if (!task) {
          throw new ApiError(404, 'no task exists with the suplied id');
        }

        return task;
      });

      res.json(task);
    })
  )
  .delete(
    validateParams,
    asyncHandler(async (req, res) => {
      const { boardId, taskId } = req.params;

      await db.tx(async (tx) => {
        const board = await tx.oneOrNone('SELECT * FROM board WHERE id = $1', [
          boardId,
        ]);
        if (!board) {
          throw new ApiError(404, 'no board exists with the supplied id');
        }

        const board_user = await tx.oneOrNone(
          'SELECT * FROM board_user WHERE board_id = $1 AND user_id = $2',
          [boardId, req.session.userId]
        );
        if (!board_user) {
          throw new ApiError(
            403,
            'you are not a user for this board, please request permission from the board owner.'
          );
        }

        await tx.oneOrNone('DELETE FROM task WHERE id = $1 returning id', [
          taskId,
        ]);

        await tx.one(
          'UPDATE board set last_updated = NOW() where id = $1 returning id',
          [board.id]
        );
      });

      res.status(204).json(null);
    })
  )
  .put(
    validateParams,
    validateTask,
    asyncHandler(async (req, res) => {
      const { boardId, taskId } = req.params;
      const { state, title, description, assignee } = req.body;

      const task = await db.tx(async (tx) => {
        const board = await tx.oneOrNone('SELECT * FROM board WHERE id = $1', [
          boardId,
        ]);
        if (!board) {
          throw new ApiError(404, 'no board exists with the supplied id');
        }

        const board_user = await tx.oneOrNone(
          'SELECT * FROM board_user WHERE board_id = $1 AND user_id = $2',
          [boardId, req.session.userId]
        );
        if (!board_user) {
          throw new ApiError(
            403,
            'you are not a user for this board, please request permission from the board owner.'
          );
        }

        const task = await tx.one(
          'UPDATE task SET state = $1, title = $2, description = $3, assignee_id = $4, last_updated = NOW() WHERE id = $5 returning *',
          [state, title, description, assignee, taskId]
        );

        await tx.one(
          'UPDATE board set last_updated = NOW() where id = $1 returning id',
          [board.id]
        );

        return task;
      });

      res.json(task);
    })
  );

// custom 404
app.use((req, res, next) => {
  res.status(404).json({ error: 'Requested resource cannot be found' });
});

// custom error handler
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    res.status(err.status);
    if (err.message) {
      res.json({ error: err.message });
    } else {
      res.json(null);
    }
  } else {
    console.error(err.stack);
    res.status(500).json({ error: 'An unexpected error occured!' });
  }
});

app.listen(port, () => {
  console.log(`Kanban board listening on port ${port}`);
});
