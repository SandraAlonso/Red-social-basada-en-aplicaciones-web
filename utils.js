"use strict";

class utils {
    findByTag(questions, tag) {
        return questions.filter(o => o.tags == tag);
    }

    findByTags(questions, tag) {
        return questions.filter(o => o.tags.some(aux => tag.some(a => a == aux)));
    }

    createQuestion(texto) {
        var questions = new Object;
        //Reconocimiento de texto
        texto = texto.trim();

        //Reconocimiento de tags
        var tag = texto.match(/@[A-ü0-9]+/g);//busqueda de los elementos que empiecen por @
        if(tag !== null) {
            questions = tag.map(o => o.substring(1));//Recorremos el array y quitamos el primer caracter: "@"
        }
        else questions = null;
        return questions;
    }

    createDate(date) {
        var date_js = new Date(date * 1000);
        return date_js.getDate() + '/' + (date_js.getMonth() + 1) + '/' + date_js.getFullYear();
    }

    filterUserByName(users, str){
        return users.filter(n => n.name.toLowerCase().includes(str.toLowerCase()));
    }

    //Filtros de preguntas
    filterByTag(questions, tag){
        return questions.filter(o => o.tags.some(aux => tag.toLowerCase() == aux.toLowerCase()));
    }
    filterByText(questions, str){
        return questions.filter(n => n.title.includes(str) || n.body.includes(str));
    }
}

module.exports = utils
