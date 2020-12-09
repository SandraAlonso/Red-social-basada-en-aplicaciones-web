"use strict";

class DAOTasks {
    constructor(pool) { this.pool = pool; }
    // getAllTasks(email, callback) {}
    insertTask(email, task, callback) {
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(new Error("Error de conexión a la base de datos"));
            }
            else {
                const sql = "INSERT INTO task(user, text, done) VALUES (?,?,?)";
                connection.query(sql, [email, task[0].text, task[0].done],

                    function (err, rows) {
                        if (err) {
                            callback(new Error("Error de acceso a la base de datos1"));
                        }
                        else {
                            const sql = "INSERT INTO tag(taskid, tag) VALUES ?";
                            var values = new Array;
                            for (var i = 0; i < task[0].tags.length; i++) {
                                values.push([rows.insertId, task[0].tags[i]]);
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
    getAllTasks(email, callback) {
        this.pool.getConnection(function(err, connection) {
            if(err) {
                callback(new Error("Error de conexión a la base de datos"));    
            }
            else {
                connection.query("SELECT * FROM task LEFT JOIN tag ON task.id = tag.taskId WHERE task.user = ?", 
                [email],
                function (err, rows) {
                    if (err) {
                        callback(new Error("Error de acceso a la base de datos"));
                    }
                    else {
                        var tasks = [];
                        if(rows.length != 0) {
                            var count = 0;
                            rows.forEach(function(value, index, array) {
                                if(index > 0 && array[index - 1].id === value.id) {
                                    count = count + 1;
                                    tasks[index - count].tags.push(value.tag);
                                }
                                else {
                                    var task = new Object();
                                    task.id = value.id;
                                    task.text = value.text;
                                    task.done = value.done;
                                    task.tags = [];
                                    if(value.tag != null) task.tags.push(value.tag);
                                    tasks.push(task);
                                }
                            })
                        }
                        callback(null, tasks);
                    }
                });
            }
        });
    }
}
module.exports = DAOTasks
