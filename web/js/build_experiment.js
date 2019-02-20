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
    key_assignments = key_assignments.slice(0, structure_a.num_nodes);
    var key_combo_assignments = [
        [' '], ['H'], ['J'], ['K'], ['L'], [' ', 'H'], [' ', 'J'], [' ', 'K'], 
        [' ', 'L'],  ['H', 'J'], ['H', 'K'], ['H', 'L'], ['J', 'K'],
        ['J', 'L'], ['K', 'L']
    ];
    shuffle(key_combo_assignments);
    key_combo_assignments = key_combo_assignments.slice(0, structure_a.num_nodes);

    var timeline = [];

    var demo_a = {
        type: "graph-trial",
        trajectory: walk_a,
        graph_trial_type: trial_type_a,
        nodes_to_keys: trial_type_a == 'letter' ? key_assignments : key_combo_assignments,
        preamble: 'Blah blah blah'
    };
    timeline.push(demo_a);

    var demo_b = {
        type: "graph-trial",
        trajectory: walk_b,
        graph_trial_type: trial_type_b,
        nodes_to_keys: trial_type_b == 'letter' ? key_assignments : key_combo_assignments,
        preamble: 'Blah blah blah'
    };
    timeline.push(demo_b);

    // start experiment
    jsPsych.init({
        timeline: timeline,
        on_finish: function() {
            jsPsych.data.displayData('json');
        }
    });
}
