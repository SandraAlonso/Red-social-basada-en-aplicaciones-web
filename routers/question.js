//Manejador de cierre de sesión
var express = require('express');
var router = express.Router();

const mysql = require("mysql");
const config = require("../config");
const utils = require("../utils");

// Crear un pool de conexiones a la base de datos de MySQL
const pool = mysql.createPool(config.mysqlConfig);

const DAOQuestions = require("../DAOS/DAOQuestion");
const daoQuestion = new DAOQuestions(pool);


//crear una instancia de utils
const ut = new utils;

router.get('/', function (request, response) {
    daoQuestion.getAllQuestions(function (err, result) {
        if (err) {
            response.render("questions", { errorMsg: err.message, questions: null, title: "Todas las preguntas" });
        }
        else {
            response.render("questions", { errorMsg: null, questions: result, title: "Todas las preguntas" });
        }
    })
});

//Filtrado de preguntas sin respuesta
router.get('/filter-no-answer', function (request, response){
    daoQuestion.questionNoAnswerFilter(function(err, result){
        if (err) {
            response.render("questions", { errorMsg: err.message, questions: null, title: "Preguntas sin responder"});
        }
        else {
            response.render("questions", { errorMsg: null, questions: result, title: "Preguntas sin responder"});
        }
    })
});

router.post('/filter-text', function (request, response){
    daoQuestion.getAllQuestions(function(err, result){
        if (err) {
            response.render("questions", { errorMsg: err.message, questions: null, title: "Resultados de la búsqueda \"" + request.body.filter + "\"" });
        }
        else {
            var questionsFiltered = ut.filterByText(result, request.body.filter);
            response.render("questions", { errorMsg: null, questions: questionsFiltered, title: "Resultados de la búsqueda \"" + request.body.filter + "\""  });
        }
    })
});

//Filtrado de preguntas por texto
router.get('/filter-tag/:tag', function (request, response){
    daoQuestion.getAllQuestions(function(err, result){
        if (err) {
            response.render("questions", { errorMsg: err.message, questions: null, title: "Preguntas con la etiqueta [" + request.params.tag + "]"});
        }
        else {
            var questionsFiltered= ut.filterByTag(result, request.params.tag);
            response.render("questions", { errorMsg: null, questions: questionsFiltered, title: "Preguntas con la etiqueta [" + request.params.tag + "]" });
        }
    })
});


router.route('/make')
.get(function (request, response) {
    response.status(200);
    response.render("make-question", { errorMsg: null });
})
.post(function (request, response) {
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
});

router.route('/:id')
.get(function (request, response, next) {
    daoQuestion.insertView(request.session.currentUser, request.params.id, function (err, result) {
        if (err) {
            response.render("question", { errorMsg: err.message, question: null, answers: null });
        }
        else {
            next();
        }
    })
})
.get(function (request, response, next) {
    daoQuestion.checkMedalsViews(request.session.currentUser, request.params.id, function (err, result) {
        if (err) {
            response.render("question", { errorMsg: err.message, question: null, answers: null });
        }
        else {
            next();
        }
    })
})
.get(function (request, response, next) {
    daoQuestion.getQuestion(request.params.id, function (err, result) {
        if (err) {
            response.render("question", { errorMsg: err.message, question: null, answers: null });
        }
        else {
            request.question = result;
            next();
        }
    })
})
.get(function (request, response) {
    daoQuestion.getAnswers(request.params.id, function (err, result) {
        if (err) {
            response.render("question", { errorMsg: err.message, question: null, answers: null });
        }
        else {            
            response.render("question", { errorMsg: null, question: request.question, answers: result })
        }
    })
})
.post(function (request, response) {
    daoQuestion.insertAnswer(request.session.currentUser, request.params.id, request.body.answer, function (err, result) {
        if (err) {
            //TODO FALTA CONTROL DE ESTE ERROR
            console.log(err);
        }
        response.redirect("/question");
    })
});

router.route('/:id/like-question')
.get(function (request, response, next) {
    daoQuestion.likeQuestion(request.session.currentUser, request.params.id, 1, function (err) {
        if (err) {
            //TODO FALTA CONTROL DE ESTE ERROR
            console.log(err);
        }
        next();
    })
})
.get(function (request, response) {
    daoQuestion.checkMedals(request.session.currentUser, request.params.id, function (err) {
        if (err) {
            //TODO FALTA CONTROL DE ESTE ERROR
            console.log(err);
        }
        response.redirect("/question/" + request.params.id);
    })
});

router.get('/:id/dislike-question', function (request, response, next) {
    daoQuestion.likeQuestion(request.session.currentUser, request.params.id, -1, function (err) {
        if (err) {
            //TODO FALTA CONTROL DE ESTE ERROR
            console.log(err);
        }
        response.redirect("/question/" + request.params.id);
    })
});

router.route('/:id/like-answer/:idAns')
.get(function (request, response, next) {
    daoQuestion.likeAnswer(request.session.currentUser, request.params.idAns, 1, function (err) {
        if (err) {
            //TODO FALTA CONTROL DE ESTE ERROR
            console.log(err);
        }
        next();
    })
})
.get(function (request, response) {
    daoQuestion.checkMedals(request.session.currentUser, request.params.id, function (err) {
        if (err) {
            //TODO FALTA CONTROL DE ESTE ERROR
            console.log(err);
        }
        response.redirect("/question/" + request.params.id);
    })
});

router.get('/:id/dislike-answer/:idAns', function (request, response) {
    daoQuestion.likeAnswer(request.session.currentUser, request.params.idAns, -1, function (err) {
        if (err) {
            //TODO FALTA CONTROL DE ESTE ERROR
            console.log(err);
        }
        response.redirect("/question/" + request.params.id);
    })
});





module.exports = router;