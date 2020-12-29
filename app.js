"use strict";

const mysql = require("mysql");
const config = require("./config");
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const DAOUsers = require("./DAOS/DAOUser");
const DAOTasks = require("./DAOS/DAOTasks");


// Crear un servidor Express.js
const app = express();

// Crear un pool de conexiones a la base de datos de MySQL
const pool = mysql.createPool(config.mysqlConfig);

// Crear una instancia de DAOTasks
const daoTasks = new DAOTasks(pool);
const daoUser = new DAOUsers(pool);

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
app.use(express.static(ficherosEstaticos));

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
const sessionStore = new MySQLStore({
    host: "localhost",
    user: "root",
    password: "",
    database: "404"
});
//Crear un middleware de sesión
const middlewareSession = session({
    saveUninitialized: false,
    secret: "foobar34",
    resave: false,
    store: sessionStore
});
//Lo añadimos a la cadena de middlewares de la aplicación
app.use(middlewareSession);

//Manejador de ruta para mostrar la vista login
app.get("/login", function (request, response) {
    response.status(200);
    response.render("login", { errorMsg: null });
});

//Manejador para comprobar si el usuario existe en la base de datos
app.post("/login", function (request, response) {
    daoUser.isUserCorrect(request.body.user,
        request.body.password, function (error, ok) {
            if (error) { // error de acceso a la base de datos
                response.status(500);
                response.render("login",
                    {
                        errorMsg: "Error interno de acceso a la base de datos"
                    });
            }
            else if (ok) {
                request.session.currentUser = request.body.user;
                response.redirect("/main.html");
            } else {
                response.status(200);
                response.render("login",
                    { errorMsg: "Email y/o contraseña no válidos" });
            }
        });
});

//Manejador de cierre de sesión
app.get("/logout", function (request, response) {
    request.session.destroy()
    response.redirect("/login");

});

//Manejador de crear cuenta
app.get("/create-account", function (request, response) {
    response.status(200);
    response.render("create-account", { errorMsg: null });
});

//Manejador para insertar usuarios
app.post("/create-user", function (request, response) {
    daoUser.addUser(request.body.email, request.body.password,request.body.password2, request.body.name, cb_addUser);
    function cb_addUser(err) {
        if (err) {
            response.render("create-account", { errorMsg: err.message });
        }
        else {
            response.redirect("/main.html");
        }
    }
});

app.get("/users", function(request, response){
    daoUser.getUser("sanalo05@ucm.es", function(err, result){
        if (err) {
            response.render("users", { errorMsg: err.message });
        }
        else {
            response.render("users", { errorMsg: null, name: result[0].name, email: result[0].name, img:result[0].img, sud: result[0].SignUpDate.substring(0,10)});
        }
    })
});


