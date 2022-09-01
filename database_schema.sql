CREATE TABLE account (
	id serial PRIMARY KEY,
	username VARCHAR (50) UNIQUE NOT NULL,
	salt VARCHAR (29) NOT NULL,
	password VARCHAR (60) NOT NULL,
	created_date TIMESTAMPTZ NOT NULL
);