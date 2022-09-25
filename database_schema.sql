CREATE TABLE account (
	id serial PRIMARY KEY,
	username VARCHAR (50) UNIQUE NOT NULL,
	salt VARCHAR (29) NOT NULL,
	password VARCHAR (60) NOT NULL,
	created_date TIMESTAMPTZ NOT NULL
);

CREATE TABLE board (
	id serial PRIMARY KEY,
	owner_id integer references account(id) NOT NULL,
	title VARCHAR(20) NOT NULL,
	created_date TIMESTAMPTZ NOT NULL,
	last_updated TIMESTAMPTZ NOT NULL
);

CREATE TABLE task (
	id serial PRIMARY KEY,
	author_id integer references account(id) NOT NULL,
	assignee_id integer references account(id),
	state VARCHAR(4) NOT NULL, -- TODO, WIP, DONE
	title VARCHAR(30) NOT NULL,
	description VARCHAR(500) NOT NULL,
	created_date TIMESTAMPTZ NOT NULL,
	last_updated TIMESTAMPTZ NOT NULL
);