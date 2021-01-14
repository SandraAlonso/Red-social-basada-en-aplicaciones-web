var express = require('express');
var router = express.Router();

const path = require("path");
const multer = require('multer');

var rootController = require('../controllers/root');

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
        req.fileValidationError = "Extensión de archivo no permitida debe de ser PNG, JPG, JPEG o GIF";
        cb(null, false, req.fileValidationError);
    }
};

var upload = multer({ storage: storage, fileFilter: fileFilter });

//Añadimos la función de control de acceso
router.all('*', rootController.accesscontrol);

router.get("/", rootController.getMain);

router.route("/login")
    .get(rootController.getLogin)
    .post(rootController.postLogin);

router.route("/create-account")
    .get(rootController.getCreateAccount)
    .post(upload.single('file'), rootController.postCreateAccount);

router.get("/logout", rootController.getLogout);

module.exports = router;