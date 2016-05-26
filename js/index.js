$(document).ready(function() {

	$('#start_game_button').on('click', handle_start_game);

});

function handle_start_game(event) {
	var name = $('#name_input').val();
	name = normalize_name(name);
	$('#name_holder').text("Playing as " + name);
	$('#start_game_form').hide();
	startGame();
}

function normalize_name(name) {
	// Ensures only the first letter is capitalized
	var letter_array = name.split('');
	var new_letter_array = [];
	letter_array.forEach(function(letter, index) {
		if (index == 0) {
			new_letter_array.push(letter.toUpperCase());
		}
		else {
			new_letter_array.push(letter.toLowerCase());
		}
	});
	return new_letter_array.join('');
}