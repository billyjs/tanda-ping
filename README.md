# tanda-ping
Tanda Internship Code Challenge - Ping Backend

## about

To complete this project I decided to use;
- `node + express` for the server as they allow simple and powerful creation of api servers,
- `mongodb` for the database as a relational database is overkill for this api with only a single entity and mongodb works well with `node`.

This stack was used as together they are commonly used for running simple api servers and setup and use is very straightforward.

Other depencies for this project are;
- `dotenv` for server configuration files,
- `moment.js` for handling/parsing dates and unix times,
- `mongoose` for easy connection to the mongodb server,
- `morgan` for server logging.

## steps to build

- install node & npm `sudo apt install nodejs`

- install mongodb `sudo apt install mongodb`

- install ruby (optional used for testing only) `sudo apt install ruby`

- clone or download this repo

- rename `example.env -> .env` and edit any config settings if needed, default is recommended

- run `npm install` to install node dependencies

- run `node app` to start the server (default server listens on `localhost:3000`)

- run `ruby pings.rb` (optional used for testing)
