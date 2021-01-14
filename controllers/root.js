const fs = require('fs');
const mysql = require("mysql");
const config = require("../config");

// Crear un pool de conexiones a la base de datos de MySQL
const pool = mysql.createPool(config.mysqlConfig);

const DAOUsers = require("../models/DAOUser");
const daoUser = new DAOUsers(pool);

//Añadimos la función de control de acceso
exports.accesscontrol = function (request, response, next) {
    if(request.url === '/login' || request.url === '/create-account') {
        next();
    }
    else {
        if (typeof request.session.currentUser !== 'undefined') {
            response.locals.userEmail = request.session.userEmail;
            response.locals.userName = request.session.userName;
            response.locals.userId= request.session.currentUser;
            response.locals.userImage = request.session.userImage;
            next();
        }
        else {
            response.redirect("/login");
        }
    }
};

// ROUTERS

exports.getLogin = function (request, response) {
    response.status(200);
    response.render("login", { errorMsg: null });
};

exports.postLogin = function (request, response) {
    daoUser.isUserCorrect(request.body.user,
        request.body.password, function (error, user) {
            if (error) {
                response.status(500);
                response.render("login", {errorMsg: "Error interno de acceso a la base de datos"});
            }
            else if (user) {
                request.session.currentUser = user.id;
                request.session.userName = user.name;
                request.session.userEmail = user.email;
                request.session.userImage = user.img;
                response.status(200);
                response.redirect("/");
            } else {
                response.status(401);
                response.render("login", { errorMsg: "Email y/o contraseña no válidos" });
            }
        }
    );
};

//Manejador de crear cuenta
//TODO Revisar los status

exports.getCreateAccount = function (request, response) {
        response.status(200);
        response.render("create-account", { errorMsg: null });
};

exports.postCreateAccount = function (request, response) {
    if(request.fileValidationError) {
        response.render("create-account", { errorMsg: request.fileValidationError });
    }
    else {
        if (typeof request.file === 'undefined') {
            var rand = Math.floor(Math.random() * 2) + 1;
            request.body.img = 'defecto' + rand + '.png';
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
    }
};

exports.getLogout = function (request, response) {
    request.session.destroy();
    response.status(200);
    response.redirect("/login");
};

exports.getMain = function (request, response) {
    response.status(200);
    response.render("main");
};