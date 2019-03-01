build_experiment = function(structure_a, structure_b) {
    var trial_type_a = 'key_combination'; 
    var trial_type_b = 'letter'; 
    var epsilon = 0.1; // random transition probability
    var walk_length = 4; // Note there will be length + 1 key presses

    var walk_a = noisy_random_walk(structure_a, walk_length, epsilon, 0); 
    var walk_b = noisy_random_walk(structure_b, walk_length, epsilon, 0); 

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
            'There will be two parts to this experiment, each of which should take approximately 30 minutes. Click next to proceed to the first part.'
        ],
        show_clickable_nav: true
    }
    timeline.push(general_instructions);


    // A trial instructions
    var key_combo_general_instructions = {
        type: 'instructions',
        pages: [
            'You will now begin the first part of the experiment. In this part, you will see five squares shown on the screen, which will light up as the experiment progresses. These squares correspond with keys on your keyboard, and your job is to watch the squares and press the corresponding key when that square lights up.<br/><br/>This part will take around 30 minutes, and then you will progress to the second part of the experiment.',
            'The amount of time the experiment takes is not fixed, but the number of responses you have to make is. We will also reward you with a $2 bonus if you get more than 90% of your responses correct across both parts. Therefore, you should make your responses both quickly and accurately.<br/><br/>Click next to begin.'
        ],
        show_clickable_nav: true
    }
    timeline.push(key_combo_general_instructions);

    var key_combo_trial_instructions = {
        type: "graph-trial",
        graph_trial_type: 'key_combination',
        preamble: 'First, we need to show you which key corresponds to each square. You will need to remember these keys during the experiment. Press the appropriate key to continue.',
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
            'Great, you are ready to begin! Remember, the amount of time the experiment takes is not fixed, but the number of responses you have to make is. We will also reward you with a $2 bonus if you get more than 90% of your responses correct across both parts. Therefore, you should make your responses both quickly and accurately.'
        ],
        show_clickable_nav: true
    }
    timeline.push(key_combo_start_instructions);

    // A trials
    var A_trials = {
        type: "graph-trial",
        trajectory: walk_a,
        graph_trial_type: trial_type_a,
        preamble: 'Press the indicated key(s) quickly and accurately.'
        nodes_to_keys: trial_type_a == 'letter' ? key_assignments : key_combo_assignments
    };
    timeline.push(A_trials);

    // B trial instructions 
    var key_press_instructions = {
        type: 'instructions',
        pages: [
            'You will now begin the second part of the experiment. In this part, you will see individual letters shown on the screen as the experiment progresses. Your job is to watch the display and type each letter. This part of the experiment will take around 30 minutes.',
            'As a reminder, the amount of time the experiment takes is not fixed, but the number of responses you have to make is. We will also reward you with a $2 bonus if you get more than 90% of your responses correct across both parts. Therefore, you should make your responses both quickly and accurately.<br/><br/>Click next to begin.'
        ],
        show_clickable_nav: true
    }
    timeline.push(key_press_instructions);


    // B trials

    var B_trials = {
        type: "graph-trial",
        trajectory: walk_b,
        graph_trial_type: trial_type_b,
        preamble: 'Type the displayed letter quickly and accurately.'
        nodes_to_keys: trial_type_b == 'letter' ? key_assignments : key_combo_assignments
    };
    timeline.push(B_trials);
    
    // Debrief 

    // D+D cluster

    var drag_drop_cluster = {
        type: 'drag-drop-letters',
        letters: key_assignments,
        drag_drop_type: 'free'
    }
    timeline.push(drag_drop_cluster);

    // Structure 2AFC
    var structure_images = ['<img src="images/three_rooms.png" width=500 height=500>',
                            '<img src="images/fixed_random.png" width=500 height=500>'];
    shuffle(structure_images);
    var structure_2AFC = {
        type: 'survey-multi-choice',
        questions: [
            {prompt: 'The letters you saw on the second part of the experiment were not generated randomly. Instead, each letter could only lead to a few other letters appearing next. The letters you saw came from one of the two structures below, where dots represent letters and lines represent possible transitions. Click the structure that you think you had, then click continue.',
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
        target_coords = get_three_rooms_coords(705, 225, 200); 
        true_structure_image = './images/three_rooms.png';
        snap_padding = 25;
    } else {
        target_coords = get_polygon_coords(15, 705, 225, 200); 
        true_structure_image = './images/fixed_random.png';
        snap_padding = 15;
    }
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
        preamble: 'The structure you actually had was shown below. Try to place the letters on the points you think they correspond to. One has been placed to get you started.',
        preplaced_draggable: key_assignments[0],
        preplaced_draggable_location: 0,
        drag_drop_type: 'image'
    }
    timeline.push(drag_drop_on_structure);

    // Demographics
    
    timeline = [];


    // start experiment
    jsPsych.init({
        timeline: timeline,
        on_finish: function() {
            jsPsych.data.displayData('json');
        }
    });
}
