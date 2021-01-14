"use strict";

const config = require("./config");
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

// Crear un servidor Express.js
const app = express();

// Arrancar el servidor
app.listen(config.port, function (err) {
    if (err) {
        console.log("ERROR al iniciar el servidor");
    }
    else {
        console.log(`Servidor arrancado en el puerto ${config.port}`);
    }
});

//Añadir un middleware static para la entrega de los recursos estaticos al cliente
const ficherosEstaticos = path.join(__dirname, "public");
app.use("/", express.static(ficherosEstaticos));

// Se incluye el middleware body-parser en la cadena de middleware
app.use(bodyParser.urlencoded({ extended: false }));

//Configurar EJS como motor de plantillas
app.set("view engine", "ejs");
//Definir el motor de plantillas
app.set("views", path.join(__dirname, "views"));

//Obtener la clase MySQLStore
const session = require("express-session");
const mysqlSession = require("express-mysql-session");
const MySQLStore = mysqlSession(session);

//Crear una instancia de MySQLStore, pasando al constructor los datos de conexión a la BD
const sessionStore = new MySQLStore(config.mysqlConfig);
//Crear un middleware de sesión
const middlewareSession = session({
    saveUninitialized: false,
    secret: "foobar34",
    resave: false,
    store: sessionStore
});
//Lo añadimos a la cadena de middlewares de la aplicación
app.use(middlewareSession);

/* Routers
----------------------------------------------------------------- */
var root = require('./routers/root');
var user = require('./routers/user');
var question = require('./routers/question')

app.use('/', root);
app.use('/user', user);
app.use('/question', question);

app.use(function(req, res, next){
    var err = new Error('No encontrado');
    err.status = 404;
    next(err);
});

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    if(err.status === 404) res.render('error', { title: 404, body: "Parece que te has perdido... O quizás te estás confundiendo... Tranquilo te acompañamos a casa"});
    else res.render('error', { title: 500, body: "Nuestro servidor está hoy un poco travieso... Un par de informáticos están revisando el error."});
});