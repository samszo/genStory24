import {auth} from './modules/auth.js';

let domainOmk = 'https://tdcw24.generateur.art',

a = new auth({
	apiOmk:domainOmk+'/api/',
	ident: 'kfB5UKuTy0H7F3S9bFsi6fc9kNVK6yb9',
	key:'a1nYdFlPxNeP80pmEpveOckdB4q1ViGc',        
});


let questions = 
[
["text1", -5, 0.9],
["text2", -5, 0.8],
["text3", -5, 0.7],
["text4", -4, 0.5],
["text5", -4, 0.5],
["text6", -4, 0.5],
["text7", -3, 0.5],
["text8", -3, 0.5],
["text9", -3, 0.5],
["text10", -2, 0.5],
["text11", -2, 0.5],
["text12", -2, 0.5],
["text12", -1, 0.5],
["text13", -1, 0.5],
["text14", -1, 0.5],
["text15", 0, 0.5],
["text16", 0, 0.5],
["text17", 0, 0.5],
["text18", 1, 0.5],
["text19", 1, 0.5],
["text20", 1, 0.5],
["text21", 2, 0.5],
["text22", 2, 0.5],
["text23", 2, 0.5],
["text24", 3, 0.5],
["text25", 3, 0.5],
["text26", 3, 0.5],
["text27", 4, 0.5],
["text28", 4, 0.5],
["text29", 4, 0.5],
["text30", 5, 0.5],
["text31", 5, 0.5],
["text32", 5, 0.5]];

// ["Description", "Pros/cons", "total plays", "total_Y", 5, 0.5]

function get_questions_in_range(state, list_questions){
	let questions_within_range = [];
	
	for (let i = 0; i < list_questions.length; i++) {
	  if(state - 1 <= list_questions[i][1] && list_questions[i][1] <= state + 1){
		  questions_within_range.push(list_questions[i])
	  }
	}
	
	return questions_within_range;
}

let current_state = 0;
let Y_N = "Y";


function get_next_state(Y_N, current_state, list_questions){
	let a_q = get_questions_in_range(current_state, list_questions);
	console.log("Y_N:", Y_N);
	console.log("Current state:", current_state);
	let random_question = a_q[Math.floor(Math.random()*a_q.length)];
	console.log(random_question);
	
	if(Y_N == "Y"){
		if(Math.random() < random_question[2]){
			current_state+=1;
		}
		else{
			current_state-=1;
		}
	}else{
		if(Math.random() < random_question[2]){
			current_state-=1;
		}
		else{
			current_state+=1;
		}
	}
	
	console.log("Next state", current_state);
}

get_next_state(Y_N, current_state, questions);

//get the questions from omeka
let omkQuestions = a.omk.searchItems('item_set_id=357');

d3.select("#spanQuestion").html(omkQuestions[0]["o:title"]);
d3.select("#button1").on('click',e=>{
	console.log(e);
})

