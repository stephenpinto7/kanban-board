CREATE TABLE account (
	id serial PRIMARY KEY,
	username VARCHAR ( 50 ) UNIQUE NOT NULL
);