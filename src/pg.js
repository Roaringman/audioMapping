const { Pool, Client } = require('pg')

const pool = new Pool({
    user: 'audiomap',
    host: '51.15.91.161',
    database: 'audiomap',
    password: '#@bhNYzijU',
    port: 5433,
})

function pg_select (response) {
    pool.query('SELECT * FROM rf.v_audiopos_lov_res_24h')
    .then(res => {console.log('rows:', res.rows), response.json(res.rows)}
    )
    .catch(e => setImmediate(() => { throw e }))
};

function pg_insert (level, lat, lon, timeStamp) {
    const text = 'insert into rf.audiopos (level, lat, lon, client_time_unix, client_time) VALUES ($1, $2, $3, $4, to_timestamp( $4 ));'
    const values = [level, lat, lon, timeStamp]
    pool.query(text, values)
    .then(res => console.log('insert response:', res)
    )
    .catch(e => setImmediate(() => { throw e }))
};

var obj = {
    select : pg_select,
    insert : pg_insert
};

module.exports = obj;