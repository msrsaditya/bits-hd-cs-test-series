$(document).ready(function(){
	/*Calculator stuff*/
	$('#ec_calculator_instance').hide();
	/*on click*/
	$(document).on('click', '#ec_calculator', function(){
		$('#ec_calculator_instance').toggle();
	});
	/*close btn*/
	$('#closeButton').on('click',function(){
		$('#ec_calculator_instance').hide();
	});

	/*set draggable*/
	$('#ec_calculator_instance').draggable({
		containment: 'window',
	});
	$('select').css('cursor', 'url("/resources/images/BLACK.cur")');
});
