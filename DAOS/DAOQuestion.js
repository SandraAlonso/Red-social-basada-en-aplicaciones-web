"use strict";

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
                            callback(new Error("Error de acceso a la base de datos1"));
                        }
                        else {
                            if(question.tags !== null) {
                                const sql = "INSERT INTO tags(idQuestion, tag) VALUES ?";
                                var values = new Array;
                                for (var i = 0; i < question.tags.length; i++) {
                                    values.push([rows.insertId, question.tags[i]]);
                                }
                                connection.query(sql, [values],
                                    function (err) {
                                        connection.release();
                                        if (err) {
                                            callback(new Error("Error de acceso a la base de datos2"));
                                        }
                                        else {
                                            callback(null);
                                        }
                                    });
                            }
                            else callback(null);
                        }
                    });
            }
        });
    }
    markTaskDone(idTask, callback) {  
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(new Error("Error de conexión a la base de datos"));
            }
            else {
                connection.query("UPDATE task SET done = 1 WHERE id = ?",
                    [idTask],
                    function (err) {
                        connection.release(); // devolver al pool la conexión
                        if (err) {
                            callback(new Error("Error de acceso a la base de datos"));
                        }
                        else {
                            callback(null);
                            
                        }
                    });
            }
        }
        );
      }
    deleteCompleted(email, callback) {  
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(new Error("Error de conexión a la base de datos"));
            }
            else {
                connection.query("DELETE FROM task WHERE user = ? AND done = 1",
                    [email],
                    function (err) {
                        connection.release(); // devolver al pool la conexión
                        if (err) {
                            callback(new Error("Error de acceso a la base de datos"));
                        }
                        else {
                            callback(null);
                            
                        }
                    });
            }
        }
        );
      }
    getAllQuestions(id, callback) {
        this.pool.getConnection(function(err, connection) {
            if(err) {
                callback(new Error("Error de conexión a la base de datos"));    
            }
            else {
                connection.query("SELECT question.id, question.title, question.body, UNIX_TIMESTAMP(question.date) AS date, user.name, user.img, tags.tag FROM question LEFT JOIN tags ON question.id = tags.idQuestion JOIN user ON question.idUser = user.id ORDER BY question.date ASC",
                function (err, rows) {
                    if (err) {
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
                                    var date_js = new Date(value.date * 1000);
                                    question.date = date_js.getDate() + '/' + (date_js.getMonth() + 1) + '/' + date_js.getFullYear();
                                    question.name = value.name;
                                    question.img = value.img;
                                    question.tags = [];
                                    if(value.tag !== null) question.tags.push(value.tag);
                                    questions.push(question);
                                }
                            })
                        }
                        callback(null, questions);
                    }
                });
            }
        });
    }
}
module.exports = DAOTasks
