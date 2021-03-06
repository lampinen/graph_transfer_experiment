build_experiment = function(structure_a, structure_b, walk_length_a, walk_length_b, epsilon, path) {
    var turk_info = jsPsych.turk.turkInfo(); 
    if (turk_info.previewMode) {
        document.getElementsByTagName('body')[0].innerHTML = "You must accept this HIT to work on it.<br /><br />This HIT is a psychology experiment on key-press learning. This experiment should take about 1 hour, and there will be a performance bonus of $2 for high performing subjects. (Note: if you completed a prior HIT posted by me, you cannot participate in this one, sorry.).";
        return;
    }
    var worker_id = turk_info.workerId;
    var trial_type_a = 'key_combination'; 
    var trial_type_b = 'letter'; 

    if (walk_length_a === undefined) {
        walk_length_a = 1499;
    } 
    if (walk_length_b === undefined) {
        walk_length_b = walk_length_a;
    } 
    if (epsilon === undefined) {
        epsilon = 0.1; // random transition probability
    }
    if (path === undefined) {
        path = './';
    }

    var walk_a = noisy_random_walk(structure_a, walk_length_a, epsilon, 0); 
    var walk_b = noisy_random_walk(structure_b, walk_length_b, epsilon, 0); 

    var key_assignments = [
        'B', 'C', 'D', 'F', 'G', 
        //'H', 'J', 'K', 'L',
        'M', 'N', 'P', 'Q', 'R',
        'S', 'T', 'V', 'W', 'X', 'Y', 'Z'
    ];
    shuffle(key_assignments);
    key_assignments = key_assignments.slice(0, structure_b.nodes.length);

    var key_combo_assignments = [
        [' '], ['H'], ['J'], ['K'], ['L'], [' ', 'H'], [' ', 'J'], [' ', 'K'], 
        [' ', 'L'],  ['H', 'J'], ['H', 'K'], ['H', 'L'], ['J', 'K'],
        ['J', 'L'], ['K', 'L']
    ];
    shuffle(key_combo_assignments);
    key_combo_assignments = key_combo_assignments.slice(0, structure_a.nodes.length);

    var timeline = [];

    // General instructions
    var general_instructions = {
        type: 'instructions',
        pages: [
            'Welcome to our experiment on key-press reactions. Click next to begin.',
            'There will be a few parts to this experiment, it should take about an hour total. Click next to proceed to the first part.'
        ],
        show_clickable_nav: true
    }
    timeline.push(general_instructions);


    // A trial instructions
    var key_combo_general_instructions = {
        type: 'instructions',
        pages: [
            'You will now begin the first part of the experiment. In this part, you will see five squares shown on the screen, which will light up as the experiment progresses. These squares correspond with keys on your keyboard, and your job is to watch the squares and press the corresponding key(s) when the square(s) light up.<br/><br/>This part will take around 25 minutes, and then you will progress to the second part of the experiment.',
            'The amount of time the experiment takes is not fixed, but the number of responses you have to make is. We will also reward you with a $2 bonus if you get more than 90% of your responses correct on your first try (across both parts of the experiment). Therefore, you should make your responses both quickly and accurately.<br/><br/>Click next to begin.'
        ],
        show_clickable_nav: true
    }
    timeline.push(key_combo_general_instructions);

    var key_combo_trial_instructions = {
        type: "graph-trial",
        graph_trial_type: 'key_combination',
        graph_name: 'instructions',
        preamble: 'First, we need to show you which key corresponds to each square. You will need to remember these keys during the experiment. Press the appropriate key to continue. If multiple squares light up, try to press the corresponding keys together. If you make an incorrect response, the squares will turn red until you correct it.',
        trajectory: [0, 1, 2, 3, 4, 5],
        nodes_to_keys: [[' '], ['H'], ['J'], ['K'], ['L'], [' ', 'K']],
        instructions: [
            "This square corresponds to the space bar",
            "This square corresponds to 'H'",
            "This square corresponds to 'J'",
            "This square corresponds to 'K'",
            "This square corresponds to 'L'",
            "Here is an example combination:"
        ]
    };
    timeline.push(key_combo_trial_instructions);

    var key_combo_start_instructions = {
        type: 'instructions',
        pages: [
            'Great, you are ready to begin! Remember, the amount of time the experiment takes is not fixed, but the number of responses you have to make is. We will also reward you with a $2 bonus if you get more than 90% of your responses correct on your first try (across both parts of the experiment). Therefore, you should make your responses both quickly and accurately.'
        ],
        show_clickable_nav: true
    }
    timeline.push(key_combo_start_instructions);

    // A trials
    var A_trials = {
        type: "graph-trial",
        trajectory: walk_a,
        graph_name: structure_a.name,
        graph_trial_type: trial_type_a,
        preamble: 'Press the indicated key(s) quickly and accurately. Remember that the',
        nodes_to_keys: key_combo_assignments //trial_type_a == 'letter' ? key_assignments : key_combo_assignments
    };
    timeline.push(A_trials);

    // B trial instructions 
    var key_press_instructions = {
        type: 'instructions',
        pages: [
            "Great, you've now completed the first part of the experiment!",
            'You will now begin the second part of the experiment. In this part, you will see individual letters shown on the screen as the experiment progresses. Your job is to watch the display and type each letter. This part of the experiment will take around 30 minutes.',
            'As before, the amount of time the experiment takes is not fixed, but the number of responses you have to make is. We will also reward you with a $2 bonus if you get more than 90% of your responses correct across both parts. Therefore, you should make your responses both quickly and accurately.<br/><br/>Click next to begin.'
        ],
        show_clickable_nav: true
    }
    timeline.push(key_press_instructions);


    // B trials

    var B_trials = {
        type: "graph-trial",
        trajectory: walk_b,
        graph_name: structure_b.name,
        graph_trial_type: trial_type_b,
        preamble: 'Type the displayed letter quickly and accurately.',
        nodes_to_keys: key_assignments //trial_type_b == 'letter' ? key_assignments : key_combo_assignments
    };
    timeline.push(B_trials);
    
    // Debrief 

    var debrief_instructions = {
        type: 'instructions',
        pages: [
            "Great, you've now completed the second part of the experiment!",
            'In the final part of the experiment, we will ask you a few questions. This should take about 5 minutes.'
        ],
        show_clickable_nav: true
    }
    timeline.push(debrief_instructions);

    // D+D cluster

    var drag_drop_cluster = {
        type: 'drag-drop-letters',
        letters: key_assignments,
        preamble: 'Drag the letters onto the gray area of the screen, so that the ones that you think go more together are closer toegether.',
        drag_drop_type: 'free'
    }
    timeline.push(drag_drop_cluster);

    // Structure 2AFC
    var structure_images = ['<img src="' + path +'images/three_rooms.png" width=440 height=440>',
                            '<img src="' + path +'images/fixed_random.png" width=440 height=440>'];
    shuffle(structure_images);
    var structure_2AFC = {
        type: 'survey-multi-choice',
        questions: [
            {prompt: 'The letters you saw in the second part of the experiment were not generated randomly. Instead, each letter could only lead to a few other letters appearing next. The letters you saw came from one of the two structures below, where dots represent letters and lines represent possible transitions. Click the structure that you think you had, then click continue.',
            options: structure_images,
            required: true,
            horizontal: true}
        ],
        show_clickable_nav: true
    }
    timeline.push(structure_2AFC);

    // D + D on structure 
    var target_coords, true_structure_image, snap_padding;
    if (structure_b.name === 'three_rooms') {
        true_structure_image = path + 'images/three_rooms.png';
        snap_padding = 25;
    } else {
        true_structure_image = path + 'images/fixed_random.png';
        snap_padding = 15;
    }
    target_coords = get_graph_coords(structure_b.name, 705, 225, 200);
    target_coords = target_coords.map(function(loc) {
        return {'x': loc[0], 'y': loc[1],
                'width': 50, 'height': 50};
    });

    var drag_drop_on_structure = {
        type: 'drag-drop-letters',
        letters: key_assignments,
        target_locations: target_coords,
        snap_padding: snap_padding,
        background_images: [true_structure_image], 
        preamble: 'The structure you actually had is shown below. Try to place the letters on the points you think they correspond to. One has been placed to get you started.',
        preplaced_draggable: key_assignments[0],
        preplaced_draggable_location: 0,
        drag_drop_type: 'image'
    }
    timeline.push(drag_drop_on_structure);

    // Did you notice
    var did_you_notice = {
        type: 'survey-multi-choice',
        questions: [
            {prompt: 'Did you notice a correspondence between the transitions between key combinations learned on the first task, and the transitions between letters on the second task?',
            options: ['Yes.', 'No.'],
            required: true}
        ]
    }
    timeline.push(did_you_notice);

    var did_you_find_helpful = {
        type: 'survey-likert',
        questions: [
            {prompt: 'Did you feel that what you learned in the first task was helpful for learning the second task?',
            labels: ["Not at all helpful", "Only a little helpful", "Moderately helpful", "Quite helpful", "Extremely helpful"],
            required: true}
        ]
    }
    timeline.push(did_you_find_helpful);

    var same_structure = {
        type: 'survey-multi-choice',
        questions: [
            {prompt: 'In our experiment, for some participants the key-combination experiment and the single-letter experiment had the same underlying structure, and for other participants they had different structures. Which do you think it was for you?',
            options: ['Same structure', 'Different structure'],
            required: true}
        ]
    }
    timeline.push(same_structure);

    // Demographics
    var demographics = {
        type: 'survey-multi-choice',
        questions: [
            {prompt: 'What is your age?',
            options: ["<25", "25-35", "35-45", "45-55", "55-65", ">65"]},
            {prompt: 'What is your level of education?',
            options: ["No high school degree", "High school degree or GED", "Some college", "Associates or other two-year degree", "Bachelor's degree", "Master's degree", "PhD, JD, MD or similar"]},
            {prompt: 'What is your gender?',
            options: ['Male', 'Female', 'Other', 'Decline to state']},
            {prompt: 'What is your race/ethnicity?',
            options: ["Asian","American Indian/Native American", "Black or African American", "Hispanic", "White", "Other", "Decline to state"]},
        ]
    }
    timeline.push(demographics);

    var debrief = {
        type: 'survey-text',
        questions: [{prompt: 'Do you have any comments on this HIT?',
                     rows: 5}] 
    }
    timeline.push(debrief);


    // start experiment
    jsPsych.init({
        timeline: timeline,
        preload_images: [path + "images/three_rooms.png", path + "images/fixed_random.png"],
        on_finish: function() {
                document.getElementsByTagName('body')[0].innerHTML = "Thank you for completing this HIT. Please do not leave this page. Your responses are being saved, and your completion will be recorded as soon as that is done (should be no more than 1-2 minutes).";
                var timestamp = (new Date().getTime());
                var final_submit = function() {
                    jsPsych.turk.submitToTurk({"completion_time": timestamp});
                };
                save_data("gl/ex0/" + worker_id + "_" + timestamp + ".json", jsPsych.data.get().json(), final_submit, final_submit);
        }
    });
}
