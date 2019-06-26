const dotenv = require("dotenv").config();
const { Pool, Client } = require('pg')

const pool = new Pool({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
})

function pg_select (response) {
    pool.query('SELECT * FROM rf.v_audiopos_lov_res_24h')
    .then(res => {console.log('rows:', res.rows), response.json(res.rows)}
    )
    .catch(e => setImmediate(() => { throw e }))
};

function pg_insert_levelPos (level, lat, lon, timeStamp) {
    const text = 'insert into rf.audiopos (level, lat, lon, client_time_unix, client_time) VALUES ($1, $2, $3, $4::int, to_timestamp( $4 ));'
    const values = [level, lat, lon, timeStamp]
    pool.query(text, values)
    .then(res => console.log('insert response:', res)
    )
    .catch(e => setImmediate(() => { throw e }))
};

function pg_insert_calibration (sessionid, level, key) {
    const text = 'insert into rf.calibration (sessionid, level, key) VALUES ($1, $2, $3);'
    const values = [sessionid, level, key]
    pool.query(text, values)
    .then(res => console.log('insert response:', res)
    )
    .catch(e => setImmediate(() => { throw e }))
};

var obj = {
    select : pg_select,
    insert_levelPos : pg_insert_levelPos,
    insert_calibration : pg_insert_calibration,
};

module.exports = obj;