"use strict";

const mysql = require("mysql");


class DAOUsers {
    constructor(pool) {
        this.pool = pool;
    }
    isUserCorrect(email, password, callback) {
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(new Error("Error de conexión a la base de datos"));
            }
            else {
                connection.query("SELECT * FROM user WHERE email = ? AND password = ?",
                    [email, password],
                    function (err, rows) {
                        connection.release(); // devolver al pool la conexión
                        if (err) {
                            callback(new Error("Error de acceso a la base de datos"));
                        }
                        else {
                            if (rows.length === 0) {
                                callback(null, false); //no está el usuario con el password proporcionado
                            }
                            else {
                                callback(null, true);
                            }
                        }
                    });
            }
        }
        );
    }
    addUser(email, password, password2, name, callback) {

        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(new Error("Error de conexión a la base de datos"));
            }
            else {
                connection.query("SELECT * FROM user WHERE email = ?",
                    [email],
                    function (err, rows) {
                        connection.release(); // devolver al pool la conexión
                        if (err) {
                            callback(new Error("Error de acceso a la base de datos"));
                        }
                        else {
                            if (password == password2) {
                                console.log(rows.length);
                                if (rows.length === 0) {
                                    const sql = "INSERT INTO user(email, password, name) VALUES (?,?,?)";
                                    connection.query(sql, [email, password, name],
                                        function (err, rows) {
                                            if (err) {
                                                callback(new Error("Error en la insercción en la base de datos"));
                                            }
                                            else {
                                                callback(null, true);
                                            }
                                        }
                                    );
                                }
                                else {
                                    callback(new Error("El correo que ha introducido ya pertenece a un usuario de la aplicación.")); //ya está el usuario en la bd
                                }
                            }
                            else
                                callback(new Error("Las contraseñas no coinciden."));

                        }

                    });
            }
        }
        );
    }

    getUser(email, callback){
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(new Error("Error de conexión a la base de datos"));
            }
            else {
                connection.query("SELECT email, name, img, SignUpDate FROM user WHERE email = ?",
                    [email],
                    function (err, rows) {
                        connection.release(); // devolver al pool la conexión
                        if (err) {
                            callback(new Error("Error de acceso a la base de datos"));
                        }
                        else {
                            if (rows.length === 0) {
                                callback(new Error("No existe el usuario en la base de datos")); //no está el usuario con el password proporcionado
                            }
                            else {
                                var resultArray = Object.values(JSON.parse(JSON.stringify(rows)))
                                console.log(resultArray);
                                callback(null, resultArray);
                            }
                        }
                    });
            }
        }
        );
    }
}
module.exports = DAOUsers;