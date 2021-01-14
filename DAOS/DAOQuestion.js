"use strict";

const utils = require("../utils");
const ut = new utils;

class DAOTasks {
    constructor(pool) { this.pool = pool; }
    insertQuestion(id, question, callback) {
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(new Error("Error de conexión a la base de datos"));
            }
            else {
                const sql = "INSERT INTO question(idUser, title, body) VALUES (?,?,?)";
                connection.query(sql, [id, question.title, question.body],

                    function (err, rows) {
                        if (err) {
                            connection.release(); // devolver al pool la conexión
                            callback(new Error("Error de acceso a la base de datos1"));
                        }
                        else {
                            if(question.tags !== null) {
                                const sql = "INSERT INTO tags(idQuestion, tag) VALUES ?";
                                var values = new Array;
                                for (var i = 0; i < 5 && i< question.tags.length; i++) {
                                    values.push([rows.insertId, question.tags[i]]);
                                }
                                connection.query(sql, [values],
                                    function (err) {
                                        if (err) {
                                            connection.release();
                                            callback(new Error("Error de acceso a la base de datos2"));
                                        }
                                        else {
                                            connection.release();
                                            callback(null);
                                        }
                                    });
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
    getAllQuestions(callback) {
        this.pool.getConnection(function(err, connection) {
            if(err) {
                callback(new Error("Error de conexión a la base de datos"));    
            }
            else {
                connection.query("SELECT question.id, question.title, question.body, UNIX_TIMESTAMP(question.date) AS date, user.id AS userId, user.name, user.img, tags.tag FROM question LEFT JOIN tags ON question.id = tags.idQuestion JOIN user ON question.idUser = user.id ORDER BY question.date DESC",
                function (err, rows) {
                    if (err) {
                        connection.release();
                        callback(new Error("Error de acceso a la base de datos"));
                    }
                    else {
                        var questions = [];
                        if(rows.length != 0) {
                            var count = 0;
                            rows.forEach(function(value, index, array) {
                                if(index > 0 && array[index - 1].id === value.id) {
                                    count = count + 1;
                                    questions[index - count].tags.push(value.tag);
                                }
                                else {
                                    var question = new Object();
                                    question.id = value.id;
                                    question.title = value.title;
                                    question.body = value.body.substring(0, 150);
                                    question.date = ut.createDate(value.date);
                                    question.name = value.name;
                                    question.userId = value.userId;
                                    question.img = value.img;
                                    question.tags = [];
                                    if(value.tag !== null) question.tags.push(value.tag);
                                    questions.push(question);
                                }
                            })
                        }
                        connection.release();
                        callback(null, questions);
                    }
                });
            }
        });
    }
    getQuestion(id, callback) {
        this.pool.getConnection(function(err, connection) {
            if(err) {
                callback(new Error("Error de conexión a la base de datos"));    
            }
            else {
                connection.query("SELECT question.id, question.title, question.body, question.likes, question.dislikes, question.views, UNIX_TIMESTAMP(question.date) AS date, user.id AS userId, user.name, user.img, tags.tag FROM question LEFT JOIN tags ON question.id = tags.idQuestion JOIN user ON question.idUser = user.id WHERE question.id = ?",
                [id],
                function (err, rows) {
                    if (err) {
                        connection.release();
                        callback(new Error("Error de acceso a la base de datos"));
                    }
                    else {
                        var question = new Object();
                        if(rows.length != 0) {
                            var count = 0;
                            rows.forEach(function(value, index, array) {
                                if(index > 0 && array[index - 1].id === value.id) {
                                    count = count + 1;
                                    question.tags.push(value.tag);
                                }
                                else {
                                    question.id = value.id;
                                    question.title = value.title;
                                    question.body = value.body;
                                    var date_js = new Date(value.date * 1000);
                                    question.date = date_js.getDate() + '/' + (date_js.getMonth() + 1) + '/' + date_js.getFullYear();
                                    question.name = value.name;
                                    question.img = value.img;
                                    question.likes = value.likes;
                                    question.dislikes = value.dislikes;
                                    question.views = value.views;
                                    question.userId = value.userId;
                                    question.tags = [];
                                    if(value.tag !== null) question.tags.push(value.tag);
                                }
                            });
                        }
                        connection.release();
                        callback(null, question);
                    }
                });
            }
        });
    }
    getAnswers(id, callback) {
        this.pool.getConnection(function(err, connection) {
            if(err) {
                callback(new Error("Error de conexión a la base de datos"));    
            }
            else {
                connection.query("SELECT answer.id, answer.body, UNIX_TIMESTAMP(answer.date) AS date, answer.likes, answer.dislikes, user.name, user.id AS userId, user.img FROM answer JOIN user ON answer.idUser = user.id WHERE answer.idQuestion = ?",
                [id],
                function (err, rows) {
                    if (err) {
                        connection.release();
                        callback(new Error("Error de acceso a la base de datos"));
                    }
                    else {
                        var answers = [];
                        if(rows.length != 0) {
                            rows.forEach(function(value, index, array) {
                                var answer = new Object();
                                answer.id = value.id;
                                answer.body = value.body;
                                var date_js = new Date(value.date * 1000);
                                answer.date = date_js.getDate() + '/' + (date_js.getMonth() + 1) + '/' + date_js.getFullYear();
                                answer.name = value.name;
                                answer.likes = value.likes;
                                answer.userId = value.userId;
                                answer.dislikes = value.dislikes;
                                answer.img = value.img;
                                answers.push(answer);
                            });
                        }
                        connection.release();
                        callback(null, answers);
                    }
                });
            }
        });
    }
    insertAnswer(idUser, idQuestion, answer, callback) {
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(new Error("Error de conexión a la base de datos"));
            }
            else {
                const sql = "INSERT INTO answer(idQuestion, idUser, body) VALUES (?,?,?)";
                connection.query(sql, [idQuestion, idUser, answer],
                function (err) {
                    connection.release(); // devolver al pool la conexión
                    if (err) {
                        callback(new Error("Error de acceso a la base de datos1"));
                    }
                    else {
                        callback(null);
                    }
                });
            }
        });
    }
    likeQuestion(idUser, idQuestion, value, callback) {
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(new Error("Error de conexión a la base de datos"));
            }
            else {
                const sql ="SELECT type FROM votequestion WHERE idUser = ? AND idQuestion = ?";
                connection.query(sql, [idUser, idQuestion], 
                function(err, rows) {
                    if (err) {
                        connection.release();
                        callback(new Error("Error de acceso a la base de datos1"));
                    }
                    else {
                        if(typeof rows[0] === 'undefined' || rows[0].type !== value) {
                            const sql2 = "INSERT INTO votequestion(idQuestion, idUser, type) VALUES (?,?,?) ON DUPLICATE KEY UPDATE type = ?";
                            connection.query(sql2, [idQuestion, idUser, value, value],
                            function (err) {
                                if (err) {
                                    connection.release();
                                    callback(new Error("Error de acceso a la base de datos1"));
                                }
                                else {
                                    let sql3;
                                    let plus = typeof rows[0] === 'undefined' ? 0 : -Math.abs(value);
                                    if(value === 1) sql3 = "UPDATE question SET question.likes = question.likes + ?, question.dislikes = question.dislikes + ? WHERE question.id = ?";
                                    else sql3 = "UPDATE question SET question.dislikes = question.dislikes + ?, question.likes = question.likes + ? WHERE question.id = ?";
                                    connection.query(sql3, [Math.abs(value), plus, idQuestion], function(err) {
                                        if(err) {
                                            connection.release(); // devolver al pool la conexión
                                            callback(new Error("Error de acceso a la base de datos2"));
                                        }
                                    });
                                }
                            });
                        }
                            connection.release(); // devolver al pool la conexión
                            callback(null);
                    }
                });
            }
        });
    }
    checkMedals(idUser, idQuestion, callback) {
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(new Error("Error de conexión a la base de datos"));
            }
            else {
                const sql = "SELECT * FROM question WHERE question.id = ?";
                connection.query(sql, [idQuestion], function(err, rows) {
                    if(err) {
                        connection.release(); // devolver al pool la conexión
                        callback(new Error("Error de acceso a la base de datos1"));
                    }
                    else {
                        var type;
                        var description;
                        var add = true;
                        if(rows[0].likes === 1) {
                            type = "bronce";
                            description = "Estudiante";
                        }
                        else if(rows[0].likes === 2) {
                            type = "bronce";
                            description = "Pregunta interesante";
                        }
                        else if (rows[0].likes === 4) {
                            type = "plata";
                            description = "Buena pregunta";
                        }
                        else if (rows[0].likes === 6) {
                            type = "oro";
                            description = "Excelente pregunta";
                        }
                        else {
                            add = false;
                        }
                        if(add) {
                            const sql2 = "INSERT INTO medals(idUser, idElement, type, description) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE type = type";
                            connection.query(sql2, [idUser, idQuestion, type, description], function(err) {
                                if (err) {
                                    connection.release(); // devolver al pool la conexión
                                    callback(new Error("Error de conexión a la base de datos2"));
                                }
                            });
                        }
                        connection.release(); // devolver al pool la conexión
                        callback(null);
                    }
                });
            }
        });
    }
    likeAnswer(idUser, idAnswer, value, callback) {
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(new Error("Error de conexión a la base de datos"));
            }
            else {
                const sql ="SELECT type FROM voteanswer WHERE idUser = ? AND idAnswer = ?";
                connection.query(sql, [idUser, idAnswer], 
                function(err, rows) {
                    if (err) {
                        connection.release(); // devolver al pool la conexión
                        callback(new Error("Error de acceso a la base de datos1"));
                    }
                    else {
                        if(typeof rows[0] === 'undefined' || rows[0].type !== value) {
                            const sql2 = "INSERT INTO voteanswer(idAnswer, idUser, type) VALUES (?,?,?) ON DUPLICATE KEY UPDATE type = ?";
                            connection.query(sql2, [idAnswer, idUser, value, value],
                            function (err) {
                                if (err) {
                                    connection.release(); // devolver al pool la conexión
                                    callback(new Error("Error de acceso a la base de datos1"));
                                }
                                else {
                                    let sql3;
                                    let plus = typeof rows[0] === 'undefined' ? 0 : -Math.abs(value);
                                    if(value === 1) sql3 = "UPDATE answer SET answer.likes = answer.likes + ?, answer.dislikes = answer.dislikes + ? WHERE answer.id = ?";
                                    else sql3 = "UPDATE answer SET answer.dislikes = answer.dislikes + ?, answer.likes = answer.likes + ? WHERE answer.id = ?";
                                    connection.query(sql3, [Math.abs(value), plus, idAnswer], function(err) {
                                        if(err) {
                                            connection.release(); // devolver al pool la conexión
                                            callback(new Error("Error de acceso a la base de datos2"));
                                        }
                                    });
                                }
                            });
                        }
                        connection.release(); // devolver al pool la conexión
                        callback(null); 
                    }
                });
            }
        });
    }
    checkMedalsAnswer(idUser, idAnswer, callback) {
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(new Error("Error de conexión a la base de datos"));
            }
            else {
                const sql = "SELECT * FROM answer WHERE answer.id = ?";
                connection.query(sql, [idAnswer], function(err, rows) {
                    if(err) {
                        connection.release(); // devolver al pool la conexión
                        callback(new Error("Error de acceso a la base de datos1"));
                    }
                    else {
                        var type;
                        var description;
                        var add = true;
                        if(rows[0].likes === 2) {
                            type = "bronce";
                            description = "Respuesta interesante";
                        }
                        else if (rows[0].likes === 4) {
                            type = "plata";
                            description = "Buena respuesta";
                        }
                        else if (rows[0].likes === 6) {
                            type = "oro";
                            description = "Excelente respuesta";
                        }
                        else {
                            add = false;
                        }

                        if(add) {
                            const sql2 = "INSERT INTO medals(idUser, idElement, type, description) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE type = type";
                            connection.query(sql2, [idUser, idAnswer, type, description], function(err) {
                                connection.release(); // devolver al pool la conexión
                                if (err) {
                                    connection.release(); // devolver al pool la conexión
                                    callback(new Error("Error de conexión a la base de datos2"));
                                }
                            });
                        }
                        connection.release(); // devolver al pool la conexión
                        callback(null);
                    }
                });
            }
        });
    }
    insertView(idUser, idQuestion, callback) {
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(new Error("Error de conexión a la base de datos"));
            }
            else {
                const sql ="SELECT * FROM visit WHERE idUser = ? AND idQuestion = ?";
                connection.query(sql, [idUser, idQuestion], 
                function(err, rows) {
                    if (err) {
                        connection.release(); // devolver al pool la conexión
                        callback(new Error("Error en la base de datos 1"));
                    }
                    else {
                        if(typeof rows[0] !== 'undefined') {
                            const sql1 = "INSERT INTO visit(idUser, idQuestion) VALUES (?,?) ON DUPLICATE KEY UPDATE idUser = ?";
                            connection.query(sql1, [idUser, idQuestion, idUser], function(err){
                                if(err) {
                                    connection.release(); // devolver al pool la conexión
                                    callback(new Error("Error en la base de datos 1"));
                                }
                                else{
                                    const sql2 = "UPDATE question SET question.views = question.views + 1 WHERE question.id = ?";
                                    connection.query(sql2, [idQuestion], function (err) {
                                        if(err) {
                                            connection.release(); // devolver al pool la conexión
                                            callback(new Error("Error en la base de datos 2"));
                                        }

                                    })
                                }
                            });
                        }
                        connection.release(); // devolver al pool la conexión
                        callback(null);
                    }
                });
            }
        });
    }
    checkMedalsViews(idUser, idQuestion, callback) {
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(new Error("Error de conexión a la base de datos"));
            }
            else {
                const sql = "SELECT * FROM question WHERE question.id = ?";
                connection.query(sql, [idQuestion], 
                function(err, rows) {
                    if(err) {
                        connection.release(); // devolver al pool la conexión
                        callback(new Error("Error de acceso a la base de datos1"));
                    }
                    else {
                        var type;
                        var description;
                        var add = true;
                        if(rows[0].views === 2) {
                            type = "bronce";
                            description = "Pregunta popular";
                        }
                        else if (rows[0].views === 4) {
                            type = "plata";
                            description = "Pregunta destacada";
                        }
                        else if (rows[0].views === 6) {
                            type = "oro";
                            description = "Pregunta famosa";
                        }
                        else {
                            add = false;
                        }

                        if(add) {
                            const sql2 = "INSERT INTO medals(idUser, idElement, type, description) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE type = type";
                            connection.query(sql2, [idUser, idQuestion, type, description], function(err) {
                                if (err) {
                                    connection.release(); // devolver al pool la conexión
                                    callback(new Error("Error de conexión a la base de datos2"));
                                }
                            });
                        }
                        connection.release(); // devolver al pool la conexión
                        callback(null);
                    }
                });
            }
        });
    }


    questionNoAnswerFilter(callback) {
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(new Error("Error de conexión a la base de datos"));
            }
            else {
                const sql ="SELECT question.id, question.title, question.body, UNIX_TIMESTAMP(question.date) AS date, user.name, user.img, tags.tag FROM question LEFT JOIN tags ON question.id = tags.idQuestion JOIN user ON question.idUser = user.id WHERE NOT EXISTS (SELECT a.id FROM answer a where question.id = a.idQuestion) ORDER BY question.date DESC";
                connection.query(sql, 
                function(err, rows) {
                    if (err) {
                        connection.release(); // devolver al pool la conexión
                        callback(new Error("Error en la base de datos 1"));
                    }
                    else {
                        var questions = [];
                        if(rows.length != 0) {
                            var count = 0;
                            rows.forEach(function(value, index, array) {
                                if(index > 0 && array[index - 1].id === value.id) {
                                    count = count + 1;
                                    questions[index - count].tags.push(value.tag);
                                }
                                else {
                                    var question = new Object();
                                    question.id = value.id;
                                    question.title = value.title;
                                    question.body = value.body.substring(0, 150);
                                    question.date = ut.createDate(value.date);
                                    question.name = value.name;
                                    question.userId = value.userId;
                                    question.img = value.img;
                                    question.tags = [];
                                    if(value.tag !== null) question.tags.push(value.tag);
                                    questions.push(question);
                                }
                            })
                        }
                        connection.release();
                        callback(null, questions);                    }
                });
            }
        });
    }



}
module.exports = DAOTasks
