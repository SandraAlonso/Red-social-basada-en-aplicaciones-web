"use strict";

const mysql = require("mysql");
const config = require("./config");
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const DAOUsers = require("./DAOS/DAOUser");
const DAOQuestion = require("./DAOS/DAOQuestion");
const multer = require('multer');
const fs = require('fs');
const utils = require("./utils");




// Crear un servidor Express.js
const app = express();

// Crear un pool de conexiones a la base de datos de MySQL
const pool = mysql.createPool(config.mysqlConfig);

// Crear una instancia de DAOTasks
const daoQuestion = new DAOQuestion(pool);
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

//crear una instancia de utils
const ut = new utils;

/* Routers
----------------------------------------------------------------- */
var root = require('./routers/root');
var users = require('./routers/users');

app.use('/', root);
app.use('/user', users);


//Manejador para imagen de usuario
app.get('/imagenUsuario', function (request, response) {
    daoUser.getUserImageName(request.session.currentUser, function (error, value) {
        if (error) {
            response.sendFile(path.join(__dirname, 'public/img', "profile.png"));
            console.log(error.message);
        }
        else {
            if (value !== null) {
                response.sendFile(path.join(__dirname, 'public/user_imgs', value));
            }
            else {
                response.sendFile(path.join(__dirname, 'public/img', "profile.png"));
            }
        }
    })
})




app.get('/questions', function (request, response) {
    daoQuestion.getAllQuestions(function (err, result) {
        if (err) {
            response.render("questions", { errorMsg: err.message, questions: null, title: "Todas las preguntas" });
        }
        else {
            response.render("questions", { errorMsg: null, questions: result, title: "Todas las preguntas" });
        }
    })
});

app.get('/make-question', function (request, response) {
    response.status(200);
    response.render("make-question", { errorMsg: null });
});


app.post('/make-question', function (request, response) {

    let question = new Object();
    question.title = request.body.title;
    question.body = request.body.body;
    question.tags = ut.createQuestion(request.body.tags);
    daoQuestion.insertQuestion(request.session.currentUser, question, function (error) {
        if (error) { // error de acceso a la base de datos
            response.status(500);
            response.render("make-question", { errorMsg: error.message });
        }
        else {
            response.status(200);
            response.redirect("/questions");
        }
    });

})



app.get('/question/:id', function (request, response, next) {
    daoQuestion.insertView(request.session.currentUser, request.params.id, function (err, result) {
        if (err) {
            response.render("question", { errorMsg: err.message, question: null, answers: null });
        }
        else {
            next();
        }
    })
});

app.get('/question/:id', function (request, response, next) {
    daoQuestion.checkMedalsViews(request.session.currentUser, request.params.id, function (err, result) {
        if (err) {
            response.render("question", { errorMsg: err.message, question: null, answers: null });
        }
        else {
            next();
        }
    })
});
app.get('/question/:id', function (request, response, next) {
    daoQuestion.getQuestion(request.params.id, function (err, result) {
        if (err) {
            response.render("question", { errorMsg: err.message, question: null, answers: null });
        }
        else {
            request.question = result;
            next();
        }
    })
});

app.get('/question/:id', function (request, response) {
    daoQuestion.getAnswers(request.params.id, function (err, result) {
        if (err) {
            response.render("question", { errorMsg: err.message, question: null, answers: null });
        }
        else {            
            response.render("question", { errorMsg: null, question: request.question, answers: result })
        }
    })
});



app.post('/question/:id', function (request, response) {

    daoQuestion.insertAnswer(request.session.currentUser, request.params.id, request.body.answer, function (err, result) {
        if (err) {
            //TODO FALTA CONTROL DE ESTE ERROR
            console.log(err);
        }
        response.redirect("/questions");
    })

});

app.get('/question/:id/like-question', function (request, response, next) {
    daoQuestion.likeQuestion(request.session.currentUser, request.params.id, 1, function (err) {
        if (err) {
            //TODO FALTA CONTROL DE ESTE ERROR
            console.log(err);
        }
        next();
    })
});


app.get('/question/:id/like-question', function (request, response) {
    daoQuestion.checkMedals(request.session.currentUser, request.params.id, function (err) {
        if (err) {
            //TODO FALTA CONTROL DE ESTE ERROR
            console.log(err);
        }
        response.redirect("/question/" + request.params.id);
    })
});

app.get('/question/:id/dislike-question', function (request, response, next) {
    daoQuestion.likeQuestion(request.session.currentUser, request.params.id, -1, function (err) {
        if (err) {
            //TODO FALTA CONTROL DE ESTE ERROR
            console.log(err);
        }
        response.redirect("/question/" + request.params.id);
    })
});

app.get('/question/:id/like-answer/:idAns', function (request, response, next) {
    daoQuestion.likeAnswer(request.session.currentUser, request.params.idAns, 1, function (err) {
        if (err) {
            //TODO FALTA CONTROL DE ESTE ERROR
            console.log(err);
        }
        next();
    })
});

app.get('/question/:id/like-answer/:idAns', function (request, response) {
    daoQuestion.checkMedals(request.session.currentUser, request.params.id, function (err) {
        if (err) {
            //TODO FALTA CONTROL DE ESTE ERROR
            console.log(err);
        }
        response.redirect("/question/" + request.params.id);
    })
});

app.get('/question/:id/dislike-answer/:idAns', function (request, response) {
    daoQuestion.likeAnswer(request.session.currentUser, request.params.idAns, -1, function (err) {
        if (err) {
            //TODO FALTA CONTROL DE ESTE ERROR
            console.log(err);
        }
        response.redirect("/question/" + request.params.id);
    })
});


//Filtrado de usuario por nombre
	app.post('/userFilter', function (request, response){
    daoUser.getAllUsers(function(err, result){
        if (err) {
            response.render("user-search", { errorMsg: err.message, users: null, title: "Usuarios filtrados por [\"" + request.body.filter + "\"]"});
        }
        else {
            var usersFiltered= ut.filterUserByName(result, request.body.filter);
            response.render("user-search", { errorMsg: null, users: usersFiltered, title: "Usuarios filtrados por [\"" + request.body.filter + "\"]" });
        }
    })
});
//Filtrado de preguntas por texto
	app.post('/questionTextFilter', function (request, response){
    daoQuestion.getAllQuestions(function(err, result){
        if (err) {
            response.render("questions", { errorMsg: err.message, questions: null, title: "Resultados de la búsqueda \"" + request.body.filter + "\"" });
        }
        else {
            var questionsFiltered= ut.filterByText(result, request.body.filter);
            response.render("questions", { errorMsg: null, questions: questionsFiltered, title: "Resultados de la búsqueda \"" + request.body.filter + "\""  });
        }
    })
});

//Filtrado de preguntas sin respuesta
	app.get('/questionNoAnswerFilter', function (request, response){
    daoQuestion.questionNoAnswerFilter(function(err, result){
        if (err) {
            response.render("questions", { errorMsg: err.message, questions: null, title: "Preguntas sin responder"});
        }
        else {
            response.render("questions", { errorMsg: null, questions: result, title: "Preguntas sin responder"});
        }
    })
});

//Filtrado de preguntas por texto
	app.get('/questionTagFilter/:tag', function (request, response){
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

/*app.use(function(req, res, next){
    var err = new Error('No encontrado');
    err.status = 404;
    next(err);
});

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    if(err.status === 404) res.render('error', { title: 404, body: "Parece que te has perdido... O quizás te estás confundiendo... Tranquilo te acompañamos a casa"});
    else res.render('error', { title: 500, body: "Nuestro servidor está hoy un poco travieso... Un par de informáticos están revisando el error."});
});*/