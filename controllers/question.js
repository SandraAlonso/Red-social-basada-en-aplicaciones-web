const mysql = require("mysql");
const config = require("../config");
const utils = require("../utils");

// Crear un pool de conexiones a la base de datos de MySQL
const pool = mysql.createPool(config.mysqlConfig);

const DAOQuestions = require("../models/DAOQuestion");
const daoQuestion = new DAOQuestions(pool);

//crear una instancia de utils
const ut = new utils;

exports.getQuestion =  function (request, response) {
    daoQuestion.getAllQuestions(function (err, result) {
        if (err) {
            response.render("questions", { errorMsg: err.message, questions: null, title: "Todas las preguntas" });
        }
        else {
            response.render("questions", { errorMsg: null, questions: result, title: "Todas las preguntas" });
        }
    })
};

//Filtrado de preguntas sin respuesta
exports.getNoAnswerFilter = function (request, response){
    daoQuestion.questionNoAnswerFilter(function(err, result){
        if (err) {
            response.render("questions", { errorMsg: err.message, questions: null, title: "Preguntas sin responder"});
        }
        else {
            response.render("questions", { errorMsg: null, questions: result, title: "Preguntas sin responder"});
        }
    })
};

exports.postFilterText = function (request, response){
    daoQuestion.getAllQuestions(function(err, result){
        if (err) {
            response.render("questions", { errorMsg: err.message, questions: null, title: "Resultados de la búsqueda \"" + request.body.filter + "\"" });
        }
        else {
            var questionsFiltered = ut.filterByText(result, request.body.filter);
            response.render("questions", { errorMsg: null, questions: questionsFiltered, title: "Resultados de la búsqueda \"" + request.body.filter + "\""  });
        }
    })
};

//Filtrado de preguntas por texto
exports.getFilterTag = function (request, response){
    daoQuestion.getAllQuestions(function(err, result){
        if (err) {
            response.render("questions", { errorMsg: err.message, questions: null, title: "Preguntas con la etiqueta [" + request.params.tag + "]"});
        }
        else {
            var questionsFiltered= ut.filterByTag(result, request.params.tag);
            response.render("questions", { errorMsg: null, questions: questionsFiltered, title: "Preguntas con la etiqueta [" + request.params.tag + "]" });
        }
    })
};


exports.getMake = function (request, response) {
    response.status(200);
    response.render("make-question", { errorMsg: null });
};

exports.postMake = function (request, response) {
    let question = new Object();
    question.title = request.body.title;
    question.body = request.body.body;
    question.tags = ut.createQuestion(request.body.tags);
    daoQuestion.insertQuestion(request.session.currentUser, question, function (error) {
        if (error) { // error de acceso a la base de datos
            response.status(500);
            response.render("/make", { errorMsg: error.message });
        }
        else {
            response.status(200);
            response.redirect("/question");
        }
    })
};

exports.insertView = function (request, response, next) {
    daoQuestion.insertView(request.session.currentUser, request.params.id, function (err, result) {
        if (err) {
            response.render("question", { errorMsg: err.message, question: null, answers: null });
        }
        else {
            next();
        }
    })
};

exports.checkMedalsViews = function (request, response, next) {
    daoQuestion.checkMedalsViews(request.params.id, function (err, result) {
        if (err) {
            response.render("question", { errorMsg: err.message, question: null, answers: null });
        }
        else {
            next();
        }
    })
};

exports.getQuestionId = function (request, response, next) {
    daoQuestion.getQuestion(request.params.id, function (err, result) {
        if (err) {
            response.render("question", { errorMsg: err.message, question: null, answers: null });
        }
        else {
            request.question = result;
            next();
        }
    })
};

exports.getAnswers = function (request, response) {
    daoQuestion.getAnswers(request.params.id, function (err, result) {
        if (err) {
            response.render("question", { errorMsg: err.message, question: null, answers: null });
        }
        else {            
            response.render("question", { errorMsg: null, question: request.question, answers: result })
        }
    })
};

exports.insertAnswer = function (request, response) {
    daoQuestion.insertAnswer(request.session.currentUser, request.params.id, request.body.answer, function (err, result) {
        if (err) {
            //TODO FALTA CONTROL DE ESTE ERROR
            console.log(err);
        }
        response.redirect("/question");
    })
};

exports.likeQuestion = function (request, response, next) {
    daoQuestion.likeQuestion(request.session.currentUser, request.params.id, 1, function (err) {
        if (err) {
            //TODO FALTA CONTROL DE ESTE ERROR
            console.log(err);
        }
        next();
    })
};

exports.checkMedalsLikes = function (request, response) {
    daoQuestion.checkMedals(request.params.id, function (err) {
        if (err) {
            //TODO FALTA CONTROL DE ESTE ERROR
            console.log(err);
        }
        response.redirect("/question/" + request.params.id);
    })
};

exports.dislikeQuestion = function (request, response, next) {
    daoQuestion.likeQuestion(request.session.currentUser, request.params.id, -1, function (err) {
        if (err) {
            //TODO FALTA CONTROL DE ESTE ERROR
            console.log(err);
        }
        response.redirect("/question/" + request.params.id);
    })
};

exports.likeAnswer = function (request, response, next) {
    daoQuestion.likeAnswer(request.session.currentUser, request.params.idAns, 1, function (err) {
        if (err) {
            //TODO FALTA CONTROL DE ESTE ERROR
            console.log(err);
        }
        next();
    })
};

exports.checkMedalsAnswer = function (request, response) {
    daoQuestion.checkMedalsAnswer(request.params.idAns, function (err) {
        if (err) {
            //TODO FALTA CONTROL DE ESTE ERROR
            console.log(err);
        }
        response.redirect("/question/" + request.params.id);
    })
};

exports.dislikeAnswer = function (request, response) {
    daoQuestion.likeAnswer(request.session.currentUser, request.params.idAns, -1, function (err) {
        if (err) {
            //TODO FALTA CONTROL DE ESTE ERROR
            console.log(err);
        }
        response.redirect("/question/" + request.params.id);
    })
};

exports.checkId = function (request, response, next) {
    daoQuestion.checkId(request.params.id, function (err) {
        if (err) {
            response.render('error', { title: 404, body: "Parece que te has perdido... O quizás te estás confundiendo... Tranquilo te acompañamos a casa"});        
        }
        else {
            next();
        }
    })
};

exports.checkIdAns = function (request, response, next) {
    daoQuestion.checkIdAns(request.params.idAns, function (err) {
        if (err) {
            response.render('error', { title: 404, body: "Parece que te has perdido... O quizás te estás confundiendo... Tranquilo te acompañamos a casa"});        
        }
        else {
            next();
        }
    })
};