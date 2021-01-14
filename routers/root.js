var express = require('express');
var router = express.Router();

const multer = require('multer');
const fs = require('fs');
const path = require("path");
const mysql = require("mysql");
const config = require("../config");
const DAOUsers = require("../DAOS/DAOUser");

//Añadir un middleware static para la entrega de los recursos estaticos al cliente
const ficherosEstaticos = path.join(__dirname, "public");
router.use("/", express.static(ficherosEstaticos));

// Crear un pool de conexiones a la base de datos de MySQL
const pool = mysql.createPool(config.mysqlConfig);

const daoUser = new DAOUsers(pool);

//Añadimos la función de control de acceso
router.all('*', function (request, response, next) {
    console.log(request.url);
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
});

//MULTER

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

// ROUTERS

router.route("/login")
    .get(function (request, response) {
    response.status(200);
    response.render("login", { errorMsg: null });
    })
    .post(function (request, response) {
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
                response.redirect("/main");
            } else {
                response.status(401);
                response.render("login", { errorMsg: "Email y/o contraseña no válidos" });
            }
        }
    );
});

//Manejador de crear cuenta
//TODO Revisar los status

router.route("/create-account")
    .get(function (request, response) {
        response.status(200);
        response.render("create-account", { errorMsg: null });
    })
    .post(upload.single('file'), function (request, response) {
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
});

router.get("/logout", function (request, response) {
    request.session.destroy();
    response.status(200);
    response.redirect("/login");
});

router.get('/main', function (request, response) {
    response.status(200);
    response.render("main");
})



module.exports = router;