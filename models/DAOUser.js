"use strict";

const utils = require("../utils");
const ut = new utils;

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
                        if (err) {
                            connection.release(); // devolver al pool la conexión
                            callback(new Error("Error de acceso a la base de datos"));
                        }
                        else {
                            if (rows.length === 0) {
                                connection.release(); // devolver al pool la conexión
                                callback(null, false); //no está el usuario con el password proporcionado
                            }
                            else {
                                connection.release(); // devolver al pool la conexión
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
                        if (err) {
                            connection.release(); // devolver al pool la conexión
                            callback(new Error("Error de acceso a la base de datos"));
                        }
                        else {
                            if (password == password2) {
                                if (rows.length === 0) {
                                    const sql = "INSERT INTO user(email, name, password, img) VALUES (?,?,?,?)";
                                    connection.query(sql, [email, name, password, file],
                                        function (err) {
                                            if (err) {
                                                connection.release(); // devolver al pool la conexión
                                                callback(new Error("Error en la insercción en la base de datos"));
                                            }
                                            else {
                                                connection.release(); // devolver al pool la conexión
                                                callback(null, true);
                                            }
                                        }
                                    );
                                }
                                else {
                                    connection.release(); // devolver al pool la conexión
                                    callback(new Error("El correo que ha introducido ya pertenece a un usuario de la aplicación.")); //ya está el usuario en la bd
                                }
                            }
                            else {
                                connection.release(); // devolver al pool la conexión
                                callback(new Error("Las contraseñas no coinciden."));
                            }

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
                connection.query("SELECT id, email, img, name, UNIX_TIMESTAMP(SignUpDate) AS date FROM user WHERE id = ?",
                    [id],
                    function (err, rows) {
                        if (err) {
                            connection.release(); // devolver al pool la conexión
                            callback(new Error("Error de acceso a la base de datos"));
                        }
                        else {
                            if (rows.length === 0) {
                                connection.release(); // devolver al pool la conexión
                                callback(new Error("No existe el usuario en la base de datos")); //no está el usuario con el password proporcionado
                            }
                            else {
                                rows[0].date = ut.createDate(rows[0].date);
                                connection.release(); // devolver al pool la conexión
                                callback(null, rows[0]);
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
                        if (err) {
                            connection.release(); // devolver al pool la conexión
                            callback(new Error("Error de acceso a la base de datos"));
                        }
                        else {
                            if (rows.length === 0) {
                                connection.release(); // devolver al pool la conexión
                                callback(new Error("No existe el usuario"));
                            }
                            else {
                                connection.release(); // devolver al pool la conexión
                                callback(null, rows[0].img);
                            }
                        }
                    });
            }
        });
    }



    getAllUsers(callback) {
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(new Error("Error de conexión a la base de datos1"));
            }
            else {
                connection.query("SELECT DISTINCT u.id, u.name, u.img, SUM(q.likes) AS qlikes, SUM(q.dislikes) AS qdislikes FROM user u, question q WHERE q.idUser = u.id GROUP BY u.id",
                    function (err, rows) {
                        if (err) {
                            connection.release(); // devolver al pool la conexión
                            callback(new Error("Error de acceso a la base de dato2s"));
                        }
                        else {
                            //scoreQuestion
                            var map = new Map();
                            for (let i of rows) {
                                var o = new Object();
                                o.score = 10 * i.qlikes - 2 * i.qdislikes + 1;
                                if (o.score <= 0)
                                    o.score = 1;
                                o.id= i.id;
                                o.img = i.img;
                                o.name = i.name;
                                map.set(i.id, o);
                            }
                            const sql = "SELECT DISTINCT u.id,u.name, u.img, SUM(a.likes) AS alikes, SUM(a.dislikes) AS adislikes FROM user u, answer a WHERE a.idUser = u.id GROUP BY u.id";
                            connection.query(sql,
                                function (err, rows2) {
                                    if (err) {
                                        connection.release(); // devolver al pool la conexión
                                        callback(new Error("Error en el conteo de respuestas"));
                                    }
                                    else {
                                        //scoreAnswer
                                        for (let i of rows2) {
                                            var a = map.get(i.id);
                                            if (typeof a === 'undefined') {
                                                var o = new Object();
                                                o.score = 10 * i.alikes - 2 * i.adislikes + 1;
                                                if (o.score <= 0)
                                                    o.score = 1;
                                                o.img = i.img;
                                                o.name = i.name;
                                                o.id=i.id;
                                                map.set(i.id, o);
                                            }
                                            else {
                                                a.score += 10 * i.alikes - 2 * i.adislikes;
                                                map.set(i.id, a);

                                                if (a.score <= 0)
                                                    a.score = 1;
                                            }

                                        }
                                        const sql2 = "select distinct table1.id, tag FROM (SELECT user.id, tags.tag AS tag, count(*) as _count FROM user JOIN question ON user.id = question.idUser JOIN tags ON question.id = tags.idQuestion GROUP BY user.id, tags.tag) AS table1 GROUP BY table1.id ORDER BY table1.id, _count DESC";
                                        connection.query(sql2,
                                            function (err, rows3) {
                                                if (err) {
                                                    connection.release(); // devolver al pool la conexión
                                                    callback(new Error("Error en el conteo de respuestas"));
                                                }
                                                else {
                                                    //tagMasUSado
                                                    for (let i of rows3) {
                                                        var a = map.get(i.id);
                                                        a.tag= i.tag;
                                                        map.set(i.id, a);                                                    
            
                                                    }
                                                    var resultArray = [];
                                                    for (var [key, value] of map) {
                                                        resultArray.push(value);
                                                    }
                                                    connection.release(); // devolver al pool la conexión
                                                    callback(null, resultArray);
                                                }
                                            }
                                        );
                                       
                                    }
                                }
                            );
                        }
                    }


                );
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
                        if (err) {
                            connection.release(); // devolver al pool la conexión
                            callback(new Error("Error de acceso a la base de datos"));
                        }
                        else {
                            if (rows.length === 0) {
                                connection.release(); // devolver al pool la conexión
                                callback(new Error("No existe el usuario en la base de datos")); //no está el usuario con el password proporcionado
                            }
                            else {

                                const sql = "SELECT COUNT(*) AS ans FROM answer a WHERE a.idUser = ?";
                                connection.query(sql, [id],
                                    function (err, rows2) {
                                        if (err) {
                                            connection.release(); // devolver al pool la conexión
                                            callback(new Error("Error en el conteo de respuestas"));
                                        }
                                        else {
                                            var o = new Object();
                                            o.q = rows[0];
                                            o.a = rows2[0];
                                            connection.release(); // devolver al pool la conexión
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
                            connection.release(); // devolver al pool la conexión
                            callback(new Error("Error de acceso a la base de dato2s"));
                        }
                        else {
                            let suma = 10 * rows[0].likes - 2 * rows[0].dislikes + 1;

                            const sql = "SELECT a.id, SUM(a.likes) AS likes, SUM(a.dislikes) AS dislikes FROM answer a WHERE a.idUser = ?";
                            connection.query(sql, [id],
                                function (err, rows2) {
                                    if (err) {
                                        connection.release(); // devolver al pool la conexión
                                        callback(new Error("Error en el conteo de respuestas"));
                                    }
                                    else {
                                        suma += 10 * rows2[0].likes - 2 * rows2[0].dislikes;
                                        if (suma <= 0)
                                            suma = 1;
                                        connection.release(); // devolver al pool la conexión
                                        callback(null, suma);
                                    }
                                }
                            );



                        }

                    });
            }
        });
    }



    getMedals(id, callback) {
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(new Error("Error de conexión a la base de datos1"));
            }
            else {
                connection.query("SELECT DISTINCT m.type, m.description, COUNT(*) over (PARTITION by m.type) AS numMedalType, COUNT(*) over (PARTITION by m.description) AS cont FROM medals m WHERE m.idUser = ?",
                    [id],
                    function (err, rows) {
                        if (err) {
                            connection.release(); // devolver al pool la conexión
                            callback(new Error("Error de acceso a la base de dato2s"));
                        }
                        else {
                            var medals = Object.values(JSON.parse(JSON.stringify(rows)));
                            var medalsResult = new Object();
                            medalsResult.gold = [];
                            medalsResult.bronze = [];
                            medalsResult.silver = [];

                            for (let i of medals) {
                                var o = new Object();
                                o.description = i.description;
                                o.cont = i.cont;
                                if (i.type == "bronce")
                                    medalsResult.bronze.push(o);

                                else if (i.type == "plata")
                                    medalsResult.silver.push(o);

                                else
                                    medalsResult.gold.push(o);
                            }
                            connection.release(); // devolver al pool la conexión
                            callback(null, medalsResult);
                        }
                    }
                )
            }
        });
    }

    checkId(id, callback) {
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(new Error("Error de conexión a la base de datos"));
            }
            else {
                const sql = "SELECT * FROM user WHERE user.id = ?"
                connection.query(sql,
                    [id],
                    function (err, rows) {
                        if (err) {
                            connection.release(); // devolver al pool la conexión
                            callback(new Error("Error en la base de datos 1"));
                        }
                        else {
                            if (rows.length === 0) {
                                connection.release();
                                callback(new Error("Usuario no existente"));
                            }
                            else {
                                connection.release();
                                callback(null);
                            }
                        }
                    });
            }
        });
    }

}

module.exports = DAOUsers;
