

const { Pool, Client } = require('pg')

const pool = new Pool({
  user: 'audiomap',
  host: '51.15.91.161',
  database: 'audiomap',
  password: '#@bhNYzijU',
  port: 5433,
})

pool.query('SELECT NOW()', (err, res) => {
  console.log(err, res)
  pool.end()
})

// const client = new Client({
//   user: 'dbuser',
//   host: 'database.server.com',
//   database: 'mydb',
//   password: 'secretpassword',
//   port: 3211,
// })
// client.connect()

// client.query('SELECT NOW()', (err, res) => {
//   console.log(err, res)
//   client.end()
// })