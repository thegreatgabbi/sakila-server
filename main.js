// Load and configure
const path = require('path');
const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const handlebars = require('express-handlebars');

const pool = mysql.createPool({
    host: 'localhost', port: 3306,
    user: 'root', password: 'password',
    database: 'sakila',
    connectionLimit: 4
});

// Create an instance of an app
const app = express();

app.engine('handlebars', handlebars({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

// Enable CORS
app.use(cors());
// app.use((req, resp, next) => {
//     resp.header('Access-Control-Allow-Origin', true);

// })

// GET /film/1
const SQL_FILM = "select * from film where film_id = ?";
app.get('/film/:fid', (req, resp) => {
    pool.getConnection((err, conn) => {
        if (err) {
            resp.status(500);
            resp.type('text/plain');
            resp.send(JSON.stringify(err));
            return;
        }
        conn.query(SQL_FILM, [parseInt(req.params.fid)],
            (err, result) => {
                conn.release();
                if (err) {
                    resp.status(500);
                    resp.type('text/plain');
                    resp.send(JSON.stringify(err));
                    return;
                }
                if (result.length <= 0) {
                    resp.status(404);
                    resp.type('text/plain');
                    resp.send(result);
                }

                // content negotiation - representation
                resp.format({
                    'text/html': () => {
                        resp.render('films', { films: result });
                    },
                    'application/json': () => {
                        resp.json(result[0]);
                    },
                    'default': () => {
                        resp.status(415);
                        resp.send('response type not supported');
                    }
                })
            })
        })
    })

    // GET /films?limit=50&offset=10
    // Representational state transfer
    const SQL_FILMS = "select * from film limit ? offset ?";
    app.get('/films', (req, resp) => {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        pool.getConnection((err, conn) => {
            if (err) {
                resp.status(500);
                resp.type('text/plain');
                resp.send(JSON.stringify(err));
                return;
            }
            conn.query(SQL_FILMS, [limit, offset],
                (err, result) => {
                    conn.release();
                    if (err) {
                        resp.status(500);
                        resp.type('text/plain');
                        resp.send(JSON.stringify(err));
                        return;
                    }
                    resp.status(200);
                    // content negotiation - representation
                    resp.format({
                        'text/html': () => {
                            resp.render('films', { films: result });
                        },
                        'application/json': () => {
                            resp.json(result);
                        },
                        'default': () => {
                            resp.status(415);
                            resp.send('response type not supported');
                        }
                    })

                })
        })
    })

    // Define routes


    // Define static resources
    app.use(express.static(path.join(__dirname, "public")));
    app.use(express.static(path.join(__dirname, "images")));

    app.use((req, resp) => {
        resp.status(404);
        resp.type('image/gif');
        resp.sendFile(path.join(__dirname, "images", "404.gif"));
    })

    // Start sever
    app.listen(3000, () => {
        console.log('Application started on port 3000 at %s', new Date());
    })