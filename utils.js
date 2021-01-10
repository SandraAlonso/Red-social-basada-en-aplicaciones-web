"use strict";

class utils {
    getToDoQuestions(questions) {
        return questions.filter(n => n.done === false || n.done === undefined).map(n => n.text)
    }

    findByTag(questions, tag) {
        return questions.filter(o => o.tags == tag);
    }

    findByTags(questions, tag) {
        return questions.filter(o => o.tags.some(aux => tag.some(a => a == aux)));
    }


    countDone(questions) {
        return (questions.filter(n => n.done === false)).length;
    }


    createQuestion(texto) {
        var questions = new Object;
        //Reconocimiento de texto
        texto = texto.trim();

        //Reconocimiento de tags
        var tag = texto.match(/@[A-ü]+/g);//busqueda de los elementos que empiecen por @
        if(tag !== null) {
            questions = tag.map(o => o.substring(1));//Recorremos el array y quitamos el primer caracter: "@"
        }
        else questions = null;
        return questions;
    }
}

module.exports = utils
