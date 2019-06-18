const { Pool, Client } = require('pg')

const pool = new Pool({
    user: 'audiomap',
    host: '51.15.91.161',
    database: 'audiomap',
    password: '#@bhNYzijU',
    port: 5433,
})

function pg_select() {
    pool.query('SELECT * FROM rf.audiopos', (err, res) => {
        console.log(err, res)
        pool.end()
        return err, res
    })
}

// const client = new Client({
//      user: 'audiomap',
//      host: '51.15.91.161',
//      database: 'audiomap',
//      password: '#@bhNYzijU',
//      port: 5433,
// })

// client.connect()

// function pg_select() {
//     client.query('SELECT NOW()', (err, res) => {
//         console.log(err, res)
//         client.end()
//         return err, res
//     })
// }

const select = pg_select()

var pgdb = {
    select: select,
    insert: "500"
};

module.exports.pgdb = pgdb;