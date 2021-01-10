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
                                callback(null, rows[0]);
                            }
                        }
                    });
            }
        }
        );
    }
    addUser(email, password, password2, name, file, callback) {

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
                                if (rows.length === 0) {
                                    const sql = "INSERT INTO user(email, name, password, img) VALUES (?,?,?,?)";
                                    connection.query(sql, [email, name, password, file],
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

    getUser(id, callback) {
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(new Error("Error de conexión a la base de datos"));
            }
            else {
                connection.query("SELECT email, name, img, SignUpDate FROM user WHERE id = ?",
                    [id],
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
                                callback(null, resultArray);
                            }
                        }
                    });
            }
        }
        );
    }

    getUserImageName(id, callback) {
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(new Error("Error de conexión a la base de datos"));
            }
            else {
                connection.query("SELECT img FROM user WHERE id = ?",
                    [id],
                    function (err, rows) {
                        connection.release(); // devolver al pool la conexión
                        if (err) {
                            callback(new Error("Error de acceso a la base de datos"));
                        }
                        else {
                            if (rows.length === 0) {
                                callback(new Error("No existe el usuario"));
                            }
                            else {
                                callback(null, rows[0].img);
                            }
                        }
                    });
            }
        });
    }

   

    getAllUsers(id, callback) {
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(new Error("Error de conexión a la base de datos1"));
            }
            else {
                connection.query("SELECT u.name, u.img, q.likes, q.dislikes, t.tag FROM user u LEFT JOIN question q ON q.idUser = u.id LEFT JOIN tags t ON t.idQuestion = q.id WHERE u.id != ? ORDER BY u.name ASC",

                    [id],
                    function (err, rows) {
                        if (err) {
                            callback(new Error("Error de acceso a la base de dato2s"));
                        }
                        else {
                            var result = [];
                            var tags = [];
                            var contTags = [];
                            var resultArray = Object.values(JSON.parse(JSON.stringify(rows)))
                            var score = 1;
                            if (resultArray.resultArray != 0) {
                                var suma = 0;
                                var ant = resultArray[0];
                                for (let i of resultArray) {
                                    if (i.name != ant.name) {
                                        //Calculo de puntuacion
                                        if (suma == 0)
                                            suma = 1;
                                        ant.puntuacion = suma;
                                        delete ant.likes;
                                        delete ant.dislikes;
                                        suma = 0;

                                        //Calculo de tag mas usado
                                        var max = 0;
                                        var index = 0;
                                        for (let j of contTags) {
                                            if (j > max) {
                                                max = j.cont;
                                                index = contTags.indexOf(max);
                                            }
                                        }
                                        ant.tag = tags[index];
                                        tags = [];
                                        result.push(ant);
                                    }
                                    var index = tags.indexOf(i.tag);
                                    if (index == -1) {//nueva tag
                                        tags.push(i.tag);
                                        contTags[tags.length - 1]++;
                                    }
                                    else {
                                        contTags[index]++;
                                    }
                                    suma += (i.likes * 10 - i.dislikes * 2);
                                    ant = i;
                                }
                                callback(null, result);

                            }

                        }
                    });
            }
        });
    }


    getQAFromUser(id, callback) {
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(new Error("Error de conexión a la base de datos"));
            }
            else {
                connection.query("SELECT COUNT(*) AS quest FROM question q WHERE q.idUser = ?",
                    [id],
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

                                const sql = "SELECT COUNT(*) AS ans FROM answer a WHERE a.idUser = ?";
                                connection.query(sql, [id],
                                    function (err, rows2) {
                                        if (err) {
                                            callback(new Error("Error en el conteo de respuestas"));
                                        }
                                        else {
                                            var questions = Object.values(JSON.parse(JSON.stringify(rows)))
                                            var answers = Object.values(JSON.parse(JSON.stringify(rows2)))
                                            var o = new Object();
                                            o.q = questions;
                                            o.a= answers;
                                            callback(null, o);
                                        }
                                    }
                                );




                            }
                        }
                    });
            }
        }
        );
    }
    getUserScore(id, callback) {
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(new Error("Error de conexión a la base de datos1"));
            }
            else {
                connection.query("SELECT q.id, SUM(q.likes) AS likes, SUM(q.dislikes) AS dislikes FROM question q WHERE q.idUser = ? ",
                    [id],
                    function (err, rows) {
                        if (err) {
                            callback(new Error("Error de acceso a la base de dato2s"));
                        }
                        else {
                                var score = Object.values(JSON.parse(JSON.stringify(rows)))
                                let suma = 10*score[0].likes -2*score[0].dislikes
                                callback(null, suma);

                            }

                        });
            }
        });
    }
}

module.exports = DAOUsers;
