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
function accesscontrol(request, response, next){
    if(typeof request.session.currentUser !== 'undefined') {
        response.locals.userEmail = request.session.userEmail;
        response.locals.userName = request.session.userName;
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

const fileFilter = function(req, file, cb) {
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
    if(typeof request.file === 'undefined') {
        var rand = Math.floor(Math.random() * 4);  
        request.body.img = 'profile-' + rand + '.png';
    }
    daoUser.addUser(request.body.email, request.body.password,request.body.password2, request.body.name, request.body.img, cb_addUser);
    function cb_addUser(err) {
        if (err) {
            if(typeof request.file !== 'undefined') fs.unlinkSync('./user_imgs/' + request.file.filename);
            response.render("create-account", { errorMsg: err.message });
        }
        else {
            response.redirect("/login");
        }
    }
});

app.get("/users", function(request, response){
    daoUser.getUser(request.session.currentUser, function(err, result){
        if (err) {
            response.render("users", { errorMsg: err.message });
        }
        else {
            daoUser.getMoreAboutUser(request.session.currentUser, function(err, result2){
                if (err) {
                    response.render("users", { errorMsg: err.message });
                }
                else{
                    console.log(result2);
                response.render("users", { errorMsg: null, name: result[0].name, email: result[0].name, img:result[0].img, sud: result[0].SignUpDate.substring(0,10)});
            }
            }
            )
    }})
});

//Manejador para imagen de usuario
app.get('/imagenUsuario', accesscontrol);
app.get('/imagenUsuario', function(request, response) {
        daoUser.getUserImageName(request.session.currentUser, function(error, value) {
        if(error) {
            response.sendFile(path.join(__dirname, 'public/img', "profile.png"));
            console.log(error.message);
        }
        else {
            if(value !== null) {
                response.sendFile(path.join(__dirname, 'public/user_imgs', value));
            }
            else {
                response.sendFile(path.join(__dirname, 'public/img', "profile.png"));
            }
        }
    })
})

app.get('/main', accesscontrol);
app.get('/main', function(request, response) {
    response.status(200);
    response.render("main");
})

app.get('/questions', accesscontrol);
app.get('/questions', function(request, response) {
    daoQuestion.getAllQuestions(request.session.currentUser, function(err, result) {
        if(err) {
            response.render("questions", { errorMsg: err.message, questions: null });
        }
        else {
            response.render("questions", { errorMsg: null, questions: result});
        }
    })
});

app.get('/make-question', accesscontrol);
app.get('/make-question', function(request, response) {
    response.status(200);
    response.render("make-question", {errorMsg: null});
});

app.post('/make-question', accesscontrol);
app.post('/make-question', function(request, response) {

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
                response.render("make-question",
                    { errorMsg: "Correcto" });
            }
        });
})

app.get('/user-search', accesscontrol);
app.get('/user-search', function(request, response) {
    daoUser.getAllUsers(request.session.currentUser, function(err, result) {
        if(err) {
            response.render("user-search", { errorMsg: err.message, users: null });
        }
        else {
            response.render("user-search", { errorMsg: null, users: result});
        }
    })
});