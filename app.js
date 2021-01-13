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

//Añadimos la función de control de acceso
function accesscontrol(request, response, next) {
    if (typeof request.session.currentUser !== 'undefined') {
        response.locals.userEmail = request.session.userEmail;
        response.locals.userName = request.session.userName;
        response.locals.userId= request.session.currentUser;
        next();
    }
    else {
        response.redirect("/login");
    }
}

const storage = multer.diskStorage({
    destination: './public/user_imgs',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const fileFilter = function (req, file, cb) {
    if (
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/jpeg" ||
        file.mimetype === "image/gif"
    ) {
        cb(null, true);
    } else {
        cb(new Error("El formato de archivo debe de ser PNG, JPG, JPEG o GIF"), false); // if validation failed then generate error
    }
};

var upload = multer({ storage: storage, fileFilter: fileFilter });


//Manejador de ruta para mostrar la vista login
app.get("/login", function (request, response) {
    response.status(200);
    response.render("login", { errorMsg: null });
});


//crear una instancia de utils
const ut = new utils;

//Manejador para comprobar si el usuario existe en la base de datos
app.post("/login", function (request, response) {
    daoUser.isUserCorrect(request.body.user,
        request.body.password, function (error, user) {
            if (error) { // error de acceso a la base de datos
                response.status(500);
                response.render("login",
                    {
                        errorMsg: "Error interno de acceso a la base de datos"
                    });
            }
            else if (user) {
                request.session.currentUser = user.id;
                request.session.userName = user.name;
                request.session.userEmail = user.email;
                response.redirect("/main");
            } else {
                response.status(200);
                response.render("login",
                    { errorMsg: "Email y/o contraseña no válidos" });
            }
        });
});

//Manejador de cierre de sesión
app.get("/logout", accesscontrol);
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
app.post("/create-user", upload.single('file'), function (request, response) {
    if (typeof request.file === 'undefined') {
        var rand = Math.floor(Math.random() * 4);
        request.body.img = 'profile-' + rand + '.png';
        daoUser.addUser(request.body.email, request.body.password, request.body.password2, request.body.name, request.body.img, cb_addUser);
    }
    else daoUser.addUser(request.body.email, request.body.password, request.body.password2, request.body.name, request.file.filename, cb_addUser);
    function cb_addUser(err) {
        if (err) {
            if (typeof request.file !== 'undefined') fs.unlinkSync('./user_imgs/' + request.file.filename);
            response.render("create-account", { errorMsg: err.message });
        }
        else {
            response.redirect("/login");
        }
    }
});

app.get('/users/:id', accesscontrol);
app.get("/users/:id", function (request, response, next) {
    daoUser.getUser(request.params.id, function (err, result) {
        if (err) {
            response.render("users", { errorMsg: err.message });
        }
        else {
            request.user= result;
            next();
        }
    })
});


app.get("/users/:id", function (request, response, next) {
    daoUser.getQAFromUser(request.params.id, function (err, result) {
        if (err) {
            response.render("users", { errorMsg: err.message });
        }
        else {

            request.questionAnswer= result;
            next();
        }
    }
    )
});
app.get("/users/:id", function (request, response, next) {
    daoUser.getUserScore(request.params.id, function (err, result) {
        if (err) {
            response.render("users", { errorMsg: err.message });
        }
        else {
            request.score=result;
            next();
        }
    })
});

app.get("/users/:id", function (request, response) {
    daoUser.getMedals(request.params.id, function(err, result){
        if(err)
        response.render("users", { errorMsg: err.message , medals: null, score: null, questionAnswer: null, user: null});
    
    else{
        console.log(request.user.img)
        response.render("users", { errorMsg: null, medals: result, score: request.score, questionAnswer: request.questionAnswer, user: request.user });
    }
    })
});

/*
app.get("/users", function (request, response, next) {
    daoUser.getVisitedQuestions(request.session.currentUser, function (err, result) {
        if (err) {
            response.render("users", { errorMsg: err.message });
        }
        else {

            request.visited=result;
            next();
        }
    })
});

app.get("/users", function (request, response, next) {
    daoUser.getVotedQuestions(request.session.currentUser, function (err, result) {
        if (err) {
            response.render("users", { errorMsg: err.message });
        }
        else {

            request.qVoted=result;
            response.render("users", { errorMsg: null, qVoted: request.qVoted, visited: request.visited, score: request.score, questionAnswer: request.questionAnswer, user: request.user });
        }
    })
});
app.get("/users", function (request, response) {
    daoUser.getVotedAnswer(request.session.currentUser, function (err, result) {
        if (err) {
            response.render("users", { errorMsg: err.message, aVoted: null, qVoted: null, visited: null, score: null, numQuestion: null, numAnswer: null, name: null, email: null, sud: null });
        }
        else {
            console.log(result);
            response.render("users", { errorMsg: null, aVoted: result, qVoted: request.qVoted, visited: request.visited, score: request.score, questionAnswer: request.questionAnswer, user: request.user });
        }
    })
});*/
//Manejador para imagen de usuario
app.get('/imagenUsuario', accesscontrol);
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

app.get('/main', accesscontrol);
app.get('/main', function (request, response) {
    response.status(200);
    response.render("main");
})

app.get('/questions', accesscontrol);
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

app.get('/make-question', accesscontrol);
app.get('/make-question', function (request, response) {
    response.status(200);
    response.render("make-question", { errorMsg: null });
});

app.post('/make-question', accesscontrol);
app.post('/make-question', function (request, response) {

    let question = new Object();
    question.title = request.body.title;
    question.body = request.body.body;
    question.tags = ut.createQuestion(request.body.tags);
    console.log(question);
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

app.get('/user-search', accesscontrol);
app.get('/user-search', function (request, response) {
    daoUser.getAllUsers(function (err, result) {
        if (err) {
            response.render("user-search", { errorMsg: err.message, users: null, title: "Usuarios" });
        }
        else {
            response.render("user-search", { errorMsg: null, users: result, title: "Usuarios" });
        }
    })
});

app.get('/question/:id', accesscontrol);
app.get('/question/:id', function (request, response, next) {
    daoQuestion.insertView(request.session.currentUser, request.params.id, function (err, result) {
        if (err) {
            response.render("question", { errorMsg: err.message, question: null, answers: null });
        }
        else {
            console.log("hola1");
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
            console.log("hola4");
            
            response.render("question", { errorMsg: null, question: request.question, answers: result })
        }
    })
});



app.post('/question/:id', accesscontrol);
app.post('/question/:id', function (request, response) {
    console.log("/question/" + request.params.id);

    daoQuestion.insertAnswer(request.session.currentUser, request.params.id, request.body.answer, function (err, result) {
        if (err) {
            //TODO FALTA CONTROL DE ESTE ERROR
            console.log(err);
        }
        response.redirect("/question/" + request.params.id);
    })

});

app.get('/question/:id/like-question', accesscontrol);
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

app.get('/question/:id/dislike-question', accesscontrol);
app.get('/question/:id/dislike-question', function (request, response, next) {
    daoQuestion.likeQuestion(request.session.currentUser, request.params.id, -1, function (err) {
        if (err) {
            //TODO FALTA CONTROL DE ESTE ERROR
            console.log(err);
        }
        response.redirect("/question/" + request.params.id);
    })
});

app.get('/question/:id/like-answer/:idAns', accesscontrol);
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

app.get('/question/:id/dislike-answer/:idAns', accesscontrol);
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
app.post('/userFilter', accesscontrol);
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
app.post('/questionTextFilter', accesscontrol);
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
app.get('/questionNoAnswerFilter', accesscontrol);
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
app.get('/questionTagFilter/:tag', accesscontrol);
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

app.use(function(req, res, next){
    var err = new Error('No encontrado');
    err.status = 404;
    next(err);
});

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    if(err.status === 404) res.render('error', { title: 404, body: "Parece que te has perdido... O quizás te estás confundiendo... Tranquilo acompañamos a casa"});
    else res.render('error', { title: 500, body: "Nuestro servidor está hoy un poco travieso... Un par de informáticos están revisando el error."});
});