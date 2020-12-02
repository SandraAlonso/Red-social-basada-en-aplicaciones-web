"use strict";

const mysql = require("mysql");
const config = require("./config");
const DAOUsers = require("./DAOUsers");

// Crear el pool de conexiones
const pool = mysql.createPool({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
});

let daoUser = new DAOUsers(pool);
let daoTask = new DAOTasks(pool);


// Uso de los métodos de las clases DAOUser
daoUser.isUserCorrect("sanalo05@ucm.es", "password", cb_isUserCorrect);
daoUser.infoUser("hectarra@ucm.es", "patata", cb_infoUser)
// Definición de las funciones callback
//DAOUser
//Comprobar si el usuario esta dado de alta en la bd
function cb_isUserCorrect(err, result) {
    if (err) {
        console.log(err.message);
    } else if (result) {
        console.log("Usuario y contraseña correctos");
    } else {
        console.log("Usuario y/o contraseña incorrectos");
    }
}
