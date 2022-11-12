CREATE TABLE account (
	id serial PRIMARY KEY,
	username VARCHAR (20) UNIQUE NOT NULL,
	salt VARCHAR (29) NOT NULL,
	password VARCHAR (120) NOT NULL,
	created_date TIMESTAMPTZ NOT NULL
);

CREATE TABLE board (
	id serial PRIMARY KEY,
	owner_id integer references account(id) NOT NULL,
	title VARCHAR(20) NOT NULL,
	created_date TIMESTAMPTZ NOT NULL,
	last_updated TIMESTAMPTZ NOT NULL
);

CREATE TABLE board_user (
	id serial PRIMARY KEY,
	user_id integer references account(id) NOT NULL,
	board_id integer references board(id) NOT NULL,
	UNIQUE(user_id, board_id)
);

CREATE TABLE task (
	id serial PRIMARY KEY,
	board_id integer references board(id) NOT NULL,
	author_id integer references account(id) NOT NULL,
	state VARCHAR(4) NOT NULL, -- TODO, WIP, DONE
	title VARCHAR(30) NOT NULL,
	description VARCHAR(500) NOT NULL,
	created_date TIMESTAMPTZ NOT NULL,
	last_updated TIMESTAMPTZ NOT NULL
);