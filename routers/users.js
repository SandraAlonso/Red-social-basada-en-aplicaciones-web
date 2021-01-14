//Manejador de cierre de sesión
var express = require('express');
var router = express.Router();

const mysql = require("mysql");
const config = require("../config");

// Crear un pool de conexiones a la base de datos de MySQL
const pool = mysql.createPool(config.mysqlConfig);

const DAOUsers = require("../DAOS/DAOUser");
const daoUser = new DAOUsers(pool);


router.route('/:id')
    .get(function (request, response, next) {
        daoUser.getUser(request.params.id, function (err, result) {
            if (err) {
                response.render("users", { errorMsg: err.message });
            }
            else {
                request.user = result;
                next();
            }
        })
    })
    .get(function (request, response, next) {
        daoUser.getQAFromUser(request.params.id, function (err, result) {
            if (err) {
                response.render("users", { errorMsg: err.message });
            }
            else {
                request.questionAnswer = result;
                next();
            }
        }
        )
    })
    .get(function (request, response, next) {
        daoUser.getUserScore(request.params.id, function (err, result) {
            if (err) {
                response.render("users", { errorMsg: err.message });
            }
            else {
                request.score=result;
                next();
            }
        })
    })
    .get(function (request, response) {
        daoUser.getMedals(request.params.id, function(err, result) {
            if(err) {
                response.render("users", { errorMsg: err.message , medals: null, score: null, questionAnswer: null, user: null});
            }
            else {
                response.render("users", { errorMsg: null, medals: result, score: request.score, questionAnswer: request.questionAnswer, user: request.user });
            }
        })
    })

    router.get('/search', function (request, response) {
        daoUser.getAllUsers(function (err, result) {
            if (err) {
                response.render("user-search", { errorMsg: err.message, users: null, title: "Usuarios" });
            }
            else {
                response.render("user-search", { errorMsg: null, users: result, title: "Usuarios" });
            }
        })
    });

module.exports = router;