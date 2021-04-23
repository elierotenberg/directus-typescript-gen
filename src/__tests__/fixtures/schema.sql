CREATE TABLE author (
  email text NOT NULL PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL
);

CREATE TABLE article (
  article_id text NOT NULL PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL,
  publish_date timestamptz -- nullable
);

CREATE TABLE article_author (
  article_id text NOT NULL REFERENCES article (article_id),
  author_email text NOT NULL REFERENCES author (email),
  PRIMARY KEY (article_id, author_email)
);

