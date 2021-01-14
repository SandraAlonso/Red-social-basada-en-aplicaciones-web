var express = require('express');
var router = express.Router();

var questionController = require('../controllers/question');

router.get('/', questionController.getQuestion);

//Filtrado de preguntas sin respuesta
router.get('/filter-no-answer', questionController.getNoAnswerFilter);

router.post('/filter-text', questionController.postFilterText);

//Filtrado de preguntas por texto
router.get('/filter-tag/:tag', questionController.getFilterTag);


router.route('/make')
.get(questionController.getMake)
.post(questionController.postMake);

router.route('/:id')
.get(questionController.checkId)
.get(questionController.insertView)
.get(questionController.checkMedalsViews)
.get(questionController.getQuestionId)
.get(questionController.getAnswers)
.post(questionController.insertAnswer);

router.route('/:id/like-question')
.get(questionController.checkId)
.get(questionController.likeQuestion)
.get(questionController.checkMedalsLikes);

router.route('/:id/dislike-question')
.get(questionController.checkId)
.get(questionController.dislikeQuestion);

router.route('/:id/like-answer/:idAns')
.get(questionController.checkId)
.get(questionController.checkIdAns)
.get(questionController.likeAnswer)
.get(questionController.checkMedalsAnswer);

router.route('/:id/dislike-answer/:idAns')
.get(questionController.checkId)
.get(questionController.checkIdAns)
.get(questionController.dislikeAnswer);

module.exports = router;