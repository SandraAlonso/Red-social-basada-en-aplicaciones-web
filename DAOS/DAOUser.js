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
                connection.query("SELECT email, name, UNIX_TIMESTAMP(SignUpDate) AS date FROM user WHERE id = ?",
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
                                rows[0].date = ut.createDate(rows[0].date);
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



    getAllUsers( callback) {
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(new Error("Error de conexión a la base de datos1"));
            }
            else {
                connection.query("SELECT u.name, u.img, SUM(q.likes) over (PARTITION by q.idUser) AS likes, SUM(q.dislikes) over (PARTITION by q.idUser) AS dislikes, t.tag FROM user u LEFT JOIN question q ON q.idUser = u.id LEFT JOIN tags t ON t.idQuestion = q.id ORDER BY u.name ASC",
                    function (err, rows) {
                        if (err) {
                            callback(new Error("Error de acceso a la base de dato2s"));
                        }
                        else {
                            var result = [];
                            var tags = [];
                            var contTags = [];
                            var resultArray = Object.values(JSON.parse(JSON.stringify(rows)))
                            if (resultArray.length != 0) {
                                var suma = 0;
                                var i;
                                var ant = resultArray[0];
                                for (let a = 0; a <= resultArray.length; a++) {
                                    i = resultArray[a];
                                    if (typeof i === 'undefined' || i.name != ant.name) {
                                        //Calculo de puntuacion
                                        suma = (ant.likes * 10 - ant.dislikes * 2);
                                        if (suma <= 0)
                                            suma = 1;
                                        ant.score = suma;
                                        delete ant.likes;
                                        delete ant.dislikes;
                                        suma = 0;

                                        //Calculo de tag mas usado
                                        if (typeof i === 'undefined') {
                                            var index = tags.indexOf(ant.tag);
                                            if (index == -1) {//nueva tag
                                                tags.push(ant.tag);
                                                contTags[tags.length - 1]++;
                                            }
                                            else {
                                                contTags[index]++;
                                            }
                                        }
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
                                    else {
                                        var index = tags.indexOf(i.tag);
                                        if (index == -1) {//nueva tag
                                            tags.push(i.tag);
                                            contTags[tags.length - 1]++;
                                        }
                                        else {
                                            contTags[index]++;
                                        }
                                    }
                                    ant = i;
                                }
                            }
                            
                            callback(null, result);
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
                                            var o = new Object();
                                            o.q = rows[0];
                                            o.a = rows2[0];
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
                            let suma = 10 * rows[0].likes - 2 * rows[0].dislikes
                            if (suma <= 0)
                                suma = 1;
                            callback(null, suma);

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
                                
                                else if( i.type =="plata")
                                    medalsResult.silver.push(o);
                                
                                else
                                    medalsResult.gold.push(o);
                            }
                            callback(null, medalsResult);
                        }
                    }
                )
            }
        });
    }

    /* getVisitedQuestions(id, callback) {
         this.pool.getConnection(function (err, connection) {
             if (err) {
                 callback(new Error("Error de conexión a la base de datos1"));
             }
             else {
                 connection.query("SELECT q.id FROM question q LEFT JOIN visit v ON v.idQuestion = q.id WHERE q.idUser = ?  ORDER BY q.id ASC",
                     [id],
                     function (err, rows) {
                         if (err) {
                             callback(new Error("Error de acceso a la base de dato2s"));
                         }
                         else {
                             var result = new Object();
                             result.gold = 0;
                             result.silver = 0;
                             result.bronze = 0;
                             var v = 1;
                             var visitedQuestion = Object.values(JSON.parse(JSON.stringify(rows)));
                             var ant;
                             var i;
                             for (let a = 0; a<visitedQuestion.length ;a++) {
                                 i= visitedQuestion[a];
                                 if (typeof ant === 'undefined' || i.id == ant.id) {
                                     v++;
                                 }
                                 if((typeof ant !== 'undefined' && i.id != ant.id )|| a == visitedQuestion.length-1 ){ 
                                     if (v >= 2 && v < 4) {
                                         result.bronze++;
                                     }
                                     else if (v >= 4 && v < 6) {
                                         result.silver++;
 
                                     }
                                     else if (v >= 6) {
                                         result.gold++;
 
                                     }
                                     v = 1;
                                 }
                                 ant = i;
 
                             }
                             callback(null, result);
 
                         }
 
                     });
             }
         });
     }
     getVotedQuestions(id, callback) {
         this.pool.getConnection(function (err, connection) {
             if (err) {
                 callback(new Error("Error de conexión a la base de datos1"));
             }
             else {
                 connection.query("SELECT DISTINCT q.id, SUM(vq.type) over (PARTITION by q.id) as votes FROM votequestion vq RIGHT JOIN question q ON vq.idQuestion = q.id WHERE q.idUser = ?",
                     [id],
                     function (err, rows) {
                         if (err) {
                             callback(new Error("Error de acceso a la base de dato2s"));
                         }
                         else {
                             var result = new Object();
                             result.gold = 0;
                             result.silver = 0;
                             result.bronze1 = 0;
                             result.bronze2 = 0;
 
                             var votedQuestion = Object.values(JSON.parse(JSON.stringify(rows)));
                             for (let i of votedQuestion) {
                                 if (i.votes >= 1 && i.votes < 2) {
                                     result.bronze1++;
                                 }
                                 else if (i.votes >= 2 && i.votes < 4) {
                                     result.bronze2++;
 
                                 }
                                 else if (i.votes >= 4 && i.votes < 6) {
                                     result.silver++;
 
                                 }
                                 else if (i.votes >= 6) {
                                     result.gold++;
                                 }
                             }
 
                         }
                         callback(null, result);
 
                     });
 
                     }
     });
 
     }
     getVotedAnswer(id, callback) {
         this.pool.getConnection(function (err, connection) {
             if (err) {
                 callback(new Error("Error de conexión a la base de datos1"));
             }
             else {
                 connection.query("SELECT DISTINCT a.id, SUM(va.type) over (PARTITION by a.id) as votes FROM voteanwer va RIGHT JOIN answer a ON va.idAnswer = a.id WHERE a.idUser = ?",
                     [id],
                     function (err, rows) {
                         if (err) {
                             callback(new Error("Error de acceso a la base de dato2s"));
                         }
                         else {
                             var result = new Object();
                             result.gold = 0;
                             result.silver = 0;
                             result.bronze = 0;
 
                             var votedAnswer = Object.values(JSON.parse(JSON.stringify(rows)));
                             for (let i of votedAnswer) {
                                 if (i.votes >= 2 && i.votes < 4) {
                                     result.bronze++;
                                 }
                                 else if (i.votes >= 4 && i.votes < 6) {
                                     result.silver++;
 
                                 }
                                 else if (i.votes >= 6) {
                                     result.gold++;
                                 }
                             }
 
                         }
                          callback(null, result);
 
                     });
 
                     }
     });
 
     }*/
}

module.exports = DAOUsers;
