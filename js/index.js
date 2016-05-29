$(document).ready(function() {

	$('#start_game_button').on('click', handle_start_game);
	if ($.cookie('display_name')) {
		$('#name_holder').text("Welcome back " + normalize_name($.cookie('display_name')));
		$('#start_game_form').hide();
		$('#game_actions').show();
		startGame();
	}
});

function handle_start_game(event) {
	var name = $('#name_input').val();
	name = normalize_name(name);
	$('#name_holder').text("Playing as " + name);
	$('#start_game_form').hide();
	$('#game_actions').show();
	$.cookie('display_name', name);
	startGame();
	event.preventDefault();
}

function normalize_name(name) {
	// Ensures only the first letter is capitalized
	var letter_array = name.split('');
	var new_letter_array = [];
	var char_limit = 10
	letter_array.forEach(function(letter, index) {
		if (index == 0) {
			new_letter_array.push(letter.toUpperCase());
		}
		else if (index <= char_limit) {
			new_letter_array.push(letter.toLowerCase());
		}
	});
	return new_letter_array.join('');
}