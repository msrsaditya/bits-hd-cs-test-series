$(document).ready(function(){
$("#exam_result_section_response").show();
$("#exam_result_section_stats").hide();

let statsPlotted = false;
$("#exam_result_section_choice_stats").click(function () {
	$("#exam_result_section_stats").show();
	if (!statsPlotted) {
        requestAnimationFrame(() => {
            plotStats(window.examStatsData);
            statsPlotted = true;
        });
    }
	$("#exam_result_section_response").hide();
	$("#exam_result_section_feedback").hide();
});

$("#exam_result_section_choice_response").click(function () {
	$("#exam_result_section_response").show();
	$("#exam_result_section_stats").hide();
	$("#exam_result_section_feedback").hide();
});

$("#exam_result_section_choice_feedback").click(function () {
	$("#exam_result_section_feedback").show();
	$("#exam_result_section_response").hide();
	$("#exam_result_section_stats").hide();
});
});

function generateColors(n, alpha = 0.85) {
    const palette20 = [
        "#4E79A7", "#59A14F", "#F28E2B", "#E15759", "#76B7B2",
        "#EDC948", "#B07AA1", "#FF9DA7", "#9C755F", "#BAB0AC",

        "#5DA5DA", "#60BD68", "#F17CB0", "#B2912F", "#B276B2",
        "#DECF3F", "#F15854", "#4D4D4D", "#8CD17D", "#FFBE7D"
    ];

    return palette20.slice(0, n).map(c =>
        alpha === 1 ? c : `rgba(${hexToRGB(c)}, ${alpha})`
    );
}

function hexToRGB(hex) {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return `${r}, ${g}, ${b}`;
}


function plotStats(data) {
	/*plot data*/
	var category_data = data;
	var category_names = [];
	var pie_total_questions = [];
	var pie_total_marks = [];

	var bar_correct_num_questions = [];
	var bar_incorrect_num_questions = [];
	var bar_unattempted_num_questions = [];
	var bar_free_num_questions = [];
	//var category_names_with_num_correct_vs_total = [];

	var bar_total_questions = [];
	var bar_total_marks = [];
	var bar_correct_marks = [];
	var bar_incorrect_marks = [];
	var bar_unattempted_marks = [];
	var bar_free_marks = [];
	//var category_names_with_marks_correct_vs_total = [];

	var num_categories = 0;

	var max_questions = 0;
	var max_marks = 0;

	for (const cat of Object.keys(category_data)) {
		category_names.push(cat);

		let cat_data = category_data[cat];

		num_categories++;

		max_marks = Math.max(max_marks, cat_data.total_marks);
		max_questions = Math.max(max_questions, cat_data.total_questions);

		let total_num_questions = cat_data.total_questions;
		let total_marks = cat_data.total_marks;

		pie_total_questions.push(total_num_questions);
		pie_total_marks.push(total_marks);

		/* data for correct vs incorrect number of questions per subject*/
		/*correct_perc_num_questions = (cat_data.total_correct_questions/cat_data.total_questions)*100;
		incorrect_perc_num_questions = 100  - correct_perc_num_questions;*/

		let correct_num_questions = cat_data.total_correct_questions;
		let attempted_num_questions = cat_data.total_attempted_questions;
		let unattempted_num_questions =
			total_num_questions - attempted_num_questions;
		let free_num_questions = cat_data.total_free_questions;

		let incorrect_num_questions = total_num_questions - (correct_num_questions + unattempted_num_questions);

		bar_total_marks.push(total_marks);
		bar_total_questions.push(total_num_questions);
		bar_correct_num_questions.push(correct_num_questions);
		bar_incorrect_num_questions.push(incorrect_num_questions);
		bar_unattempted_num_questions.push(unattempted_num_questions);
		bar_free_num_questions.push(free_num_questions);

		//category_names_with_num_correct_vs_total.push(cat+" ( "+ cat_data.total_correct_questions + "/" + cat_data.total_questions +" )");

		/* data for correct vs incorrect marks per subject */
		/*correct_perc_marks = (cat_data.total_correct_marks/cat_data.total_marks)*100;
		incorrect_perc_marks = 100 - correct_perc_marks;*/

		let correct_marks = cat_data.total_correct_marks;
		let attempted_marks = cat_data.total_attempted_marks;
		let unattempted_marks = total_marks - attempted_marks;
		let free_marks = cat_data.total_free_marks;
		let incorrect_marks = cat_data.total_penalty_marks.toFixed(2);
		// console.log("incorrect_marks:", incorrect_marks);
		// console.log("cat data:", cat_data);

		bar_correct_marks.push(correct_marks);
		bar_incorrect_marks.push(incorrect_marks);
		bar_unattempted_marks.push(unattempted_marks);
		bar_free_marks.push(free_marks);

		//category_names_with_marks_correct_vs_total.push(cat+" ( "+ cat_data.total_correct_marks + "/" + cat_data.total_marks +" )");
	}

	const subjectCount = category_names.length;
	const widthPerSubject = 120; // Width allocated per subject
	const canvas = document.getElementById("correct_vs_num_questions_stacked_bar_plot");
	canvas.width = subjectCount * widthPerSubject;

	const canvas2 = document.getElementById("correct_vs_total_marks_stacked_bar_plot");
	canvas2.width = subjectCount * widthPerSubject;

	// console.log(category_data);

	// ----- DONUT CHART: Number of Questions -----
	new Chart(
		document
		.getElementById("num_questions_subject_pie_plot")
		.getContext("2d"),
		{
			type: "doughnut",
			data: {
				labels: category_names.map(
					(label, i) => `${label} (${pie_total_questions[i]})`
				),
				datasets: [
					{
						label: " Number of Questions",
						data: pie_total_questions,
						backgroundColor: generateColors(pie_total_questions.length, 0.85),
                		borderColor: "rgba(255,255,255,0.9)",
						borderWidth: 2,
                		hoverOffset: 15
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				cutout: "35%",
				animation: {
					animateRotate: true,
					animateScale: true,
					duration: 1200,
					easing: "easeOutQuart"
				},
				plugins: {
					legend: { position: "right" , font: { size: 14 } },
					title: {
						display: true,
						text: "Questions Distribution",
						align: "center",
						font: { size: 30, weight: "500" },
						color: "black",
						padding: { top: 10, bottom: 15 }
					},
				}
			}
		},
	);

	// ----- PIE CHART: Marks per Subject -----
	new Chart(
		document.getElementById("marks_subject_pie_plot").getContext("2d"),
		{
			type: "doughnut",
			data: {
				labels: category_names.map(
					(label, i) => `${label} ( ${(bar_correct_marks[i] - bar_incorrect_marks[i] + bar_free_marks[i]).toFixed(2)} / ${pie_total_marks[i]} ) [ ${(((bar_correct_marks[i]- bar_incorrect_marks[i] + bar_free_marks[i])/pie_total_marks[i])*100).toFixed(2)}% ]`
				),
				datasets: [
					{
						label: " Marks",
						data: pie_total_marks,
						backgroundColor: generateColors(pie_total_marks.length, 0.85),
						borderColor: "rgba(255,255,255,0.9)",
						borderWidth: 2,
                		hoverOffset: 15
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				cutout: "35%",
				animation: {
					animateRotate: true,
					animateScale: true,
					duration: 1200,
					easing: "easeOutQuart"
				},
				plugins: {
					legend: { position: "right", font: { size: 14 } },
					title: { 
						display: true, 
						text: "Marks Distribution",
						align: "center",
						font: { size: 30, weight: "500" },
						color: "black",
						padding: { top: 10, bottom: 15 }
					},
				},
			},
		},
	);

	// ----- VERTICAL BAR: Correct vs Questions -----
	new Chart(
		document
		.getElementById("correct_vs_num_questions_stacked_bar_plot")
		.getContext("2d"),
		{
			type: "bar",
			data: {
				labels: category_names,
				datasets: [
					{
						label: "Total Questions",
						data: bar_total_questions,
						backgroundColor: "rgba(90, 120, 160, 0.35)",
						borderColor: "rgba(90, 120, 160, 0.8)",
						borderWidth: 2,
						borderRadius: 4,
						borderSkipped: false,
					},
					{
						label: "Correct",
						data: bar_correct_num_questions,
						backgroundColor: "#b0e671",
						borderColor: "#7fc144",
						borderWidth: 2,
						borderRadius: 4,
						borderSkipped: false,
					},
					{
						label: "Incorrect",
						data: bar_incorrect_num_questions,
						backgroundColor: "#FF6384",
						borderColor: "#e0304c",
						borderWidth: 2,
						borderRadius: 4,
						borderSkipped: false,
					},
					{
						label: "Skipped",
						data: bar_unattempted_num_questions,
						backgroundColor: "#a1d0f6",
						borderColor: "#6cb1f2",
						borderWidth: 2,
						borderRadius: 4,
						borderSkipped: false,
					},
					{
						label: "MTA",
						data: bar_free_num_questions,
						backgroundColor: "#4BC0C0",
						borderColor: "#4BC0C0",
						borderWidth: 2,
						borderRadius: 4,
						borderSkipped: false,
					}
				],
			},
			options: {
				indexAxis: "x", // vertical bars
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { position: "bottom" },
					title: {
						display: true,
						text: "Questions Stats",
						align: "center",
						font: { size: 30, weight: "500" },
						color: "black",
						padding: { top: 10, bottom: 15 }
					},
				},
				scales: {
					x: {
						stacked: false,
						ticks: {
							font: {
								size: 14
							},
							color: "#6b7280"
						},
						grid: {
							display: false,
							drawBorder: false
						}
					},
					y: {
						stacked: false,
						beginAtZero: true,
						ticks: {
							stepSize: Math.ceil(max_questions / 3) || 1,
							font: {
                                        size: 14
                                    },
							color: "#6b7280"
						},
						grid: {
							color: "rgba(229, 231, 235, 0.8)",
						}
					}
				},
				datasets: {
					bar: {
						categoryPercentage: 1.0,
						barPercentage: 1.0
					}
				}
			},
		},
	);

	// ----- VERTICAL BAR: Correct vs Marks -----
	new Chart(
		document
		.getElementById("correct_vs_total_marks_stacked_bar_plot")
		.getContext("2d"),
		{
			type: "bar",
			data: {
				labels: category_names,
				datasets: [
					{
						label: "Total Marks",
						data: bar_total_marks,
						backgroundColor: "rgba(90, 120, 160, 0.35)",
						borderColor: "rgba(90, 120, 160, 0.8)",
						borderWidth: 2,
						borderRadius: 4,
						borderSkipped: false,
					},
					{
						label: "Marks Obtained",
						data: bar_correct_marks,
						backgroundColor: "#b0e671",
						borderColor: "#7fc144",
						borderWidth: 2,
						borderRadius: 4,
						borderSkipped: false,

					},
					{
						label: "Negative Marks",
						data: bar_incorrect_marks,
						backgroundColor: "#FF6384",
						borderColor: "#e0304c",
						borderWidth: 2,
						borderRadius: 4,
						borderSkipped: false,
					},
					{
						label: "MTA",
						data: bar_free_marks,
						backgroundColor: "#4BC0C0",
						borderColor: "#4BC0C0",
						borderWidth: 2,
						borderRadius: 4,
						borderSkipped: false,
					},
				],
			},
			options: {
				indexAxis: "x", // vertical bars
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { position: "bottom" },
					title: {
						display: true,
						text: "Marks Stats",
						align: "center",
						font: { size: 30, weight: "500" },
						color: "black",
						padding: { top: 10, bottom: 15 }
					},
				},
				scales: {
					x: {
						stacked: false,
						ticks: {
							font: {
								size: 14
							},
							color: "#6b7280"
						},
						grid: {
							display: false,
							drawBorder: false
						}
					},
					y: {
						stacked: false,
						beginAtZero: true,
						ticks: {
							stepSize: Math.ceil(max_marks / 3) || 1,
							font: {
                                        size: 14
                                    },
							color: "#6b7280"
						},
						grid: {
							color: "rgba(229, 231, 235, 0.8)",
						}
					}
				},
				datasets: {
					bar: {
						categoryPercentage: 1.0,
						barPercentage: 1.0
					}
				}
			},
		}
	);
}

/*
Useful links:
http://www.jqplot.com/examples/bar-charts.php
http://www.jqplot.com/examples/pieTest.php
http://stackoverflow.com/questions/6204496/jqplot-barrenderer-y-axis-values-start-from-negative-values
http://stackoverflow.com/questions/17928868/jqplot-force-static-minimum-and-maximum-values-on-y-axis
http://stackoverflow.com/questions/8004087/how-to-display-y-axis-value-to-integers-only-in-jqplot
http://stackoverflow.com/questions/8749892/how-to-change-label-on-jqplot-stacked-horizontal-bar-chart
http://stackoverflow.com/questions/24015777/hide-0-valued-stack-bar-in-stacked-bar-chart-of-jqplot
http://stackoverflow.com/questions/9819245/background-color-for-jqplot-pie-chart
http://stackoverflow.com/questions/10412439/jqplot-stacked-horizontal-bar-chart-no-bars-when-stacked

http://stackoverflow.com/questions/442404/retrieve-the-position-x-y-of-an-html-element
*/

function positionElements() {
	//Position Print button
	return; //no print button now
	res_elem = $(".res_content")[0];
	var boundingRect = res_elem.getBoundingClientRect();
	top = boundingRect.top;
	left = boundingRect.left;

	print_elem = $("#results_print_button")[0];

	print_elem_width = print_elem.getBoundingClientRect().width;

	$(print_elem).css("left", left - print_elem_width * 1.02);
}

function submitPrintForm() {
	var el = document.getElementById("html");
	el.value = $("html")[0].innerHTML;
	document.forms["res_print_form"].submit();
}
