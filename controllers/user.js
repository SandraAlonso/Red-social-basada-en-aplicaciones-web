const mysql = require("mysql");
const config = require("../config");

const utils = require("../utils");

// Crear un pool de conexiones a la base de datos de MySQL
const pool = mysql.createPool(config.mysqlConfig);

const DAOUsers = require("../models/DAOUser");
const daoUser = new DAOUsers(pool);

//crear una instancia de utils
const ut = new utils;

exports.getAllUsers = function (request, response) {
    daoUser.getAllUsers(function (err, result) {
        if (err) {
            response.render("user-search", { errorMsg: err.message, users: null, title: "Usuarios" });
        }
        else {
            response.render("user-search", { errorMsg: null, users: result, title: "Usuarios" });
        }
    })
};

//Filtrado de usuario por nombre
exports.filterUserByName = function (request, response){
    daoUser.getAllUsers(function(err, result){
        if (err) {
            response.render("user-search", { errorMsg: err.message, users: null, title: "Usuarios filtrados por [\"" + request.body.filter + "\"]"});
        }
        else {
            var usersFiltered= ut.filterUserByName(result, request.body.filter);
            response.render("user-search", { errorMsg: null, users: usersFiltered, title: "Usuarios filtrados por [\"" + request.body.filter + "\"]" });
        }
    })
};

exports.getUser = function (request, response, next) {
    daoUser.getUser(request.params.id, function (err, result) {
        if (err) {
            response.render("users", { errorMsg: err.message });
        }
        else {
            request.user = result;
            next();
        }
    })
};
    
exports.getQAFromUser = function (request, response, next) {
    daoUser.getQAFromUser(request.params.id, function (err, result) {
        if (err) {
            response.render("users", { errorMsg: err.message });
        }
        else {
            request.questionAnswer = result;
            next();
        }
    })
};

exports.getUserScore = function (request, response, next) {
    daoUser.getUserScore(request.params.id, function (err, result) {
        if (err) {
            response.render("users", { errorMsg: err.message });
        }
        else {
            request.score=result;
            next();
        }
    })
};

exports.getMedals = function (request, response) {
    daoUser.getMedals(request.params.id, function(err, result) {
        if(err) {
            response.render("users", { errorMsg: err.message , medals: null, score: null, questionAnswer: null, user: null});
        }
        else {
            response.render("users", { errorMsg: null, medals: result, score: request.score, questionAnswer: request.questionAnswer, user: request.user });
        }
    })
};

exports.checkId = function (request, response, next) {
    daoUser.checkId(request.params.id, function (err) {
        if (err) {
            response.render('error', { title: 404, body: "Parece que te has perdido... O quizás te estás confundiendo... Tranquilo te acompañamos a casa"});        
        }
        else {
            next();
        }
    })
};