/**
 * graph-trial
 * jspsych plugin for graph learning experiment trials
 * (where "trial" here denotes a walk through the graph)
 */

jsPsych.plugins['graph-trial'] = (function() {

    var plugin = {};

    plugin.info = {
        name: 'graph-trial',
        description: '',
        parameters: {
            trajectory: {
                type: jsPsych.plugins.parameterType.INT,
                array: true,
                pretty_name: 'Trajectory',
                default: null,
                description: 'The trajectory (walk) through the graph.'
            },
            graph_trial_type: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'GraphTrialType',
                default: 'letter',
                description: 'Type of trial (letter or key_combination).'
            },
            keyboard_type: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'KeyboardType',
                default: 'abstract',
                description: 'Type of keyboard shown for combos (grounded or abstract).'
            },
            nodes_to_keys: {
                type: jsPsych.plugins.parameterType.COMPLEX,
                array: true,
                pretty_name: 'Keys',
                default: null,
                description: 'The key or key combination assigned to each node.'
            },
            canvas_width: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'CanvasWidth',
                default: 1000,
                description: 'The width of the canvas.'
            },
            canvas_height: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'CanvasHeight',
                default: 500,
                description: 'The height of the canvas.'
            },
            preamble: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Preamble',
                default: null,
                description: 'String to display at top of the page.'
            },
            instructions: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Instructions',
                array: true,
                default: null,
                description: 'Array of strings to show on each trial.'
            }
        }
    }

    plugin.trial = function(display_element, trial) {

        var html = "";

        // show preamble text
        if(trial.preamble !== null){
            html += '<div id="graph-trial-preamble" class="graph-trial-preamble">'+trial.preamble+'</div>';
        }

        html += '<div id="graph-trial-canvas-area">' 
        html += '<canvas ' + 
                'id="graph-trial-canvas"' + 
                'class="graph-trial-canvas"' + 
                'style="border:1px solid #000000;"' +
                'width=' + trial.canvas_width + ' ' +
                'height=' + trial.canvas_height +
                'tabindex="1"' + // focus hack
                '></canvas>';
        html += '</div>'; // graph-trial-canvas-area

        display_element.innerHTML = html;

        var canvas = display_element.querySelector('#graph-trial-canvas');
        var draw = canvas.getContext("2d");

        // state and event handling variables
        var current_node;
        var current_instructions;
        var current_start_time;
        var current_correct;
        var trajectory = trial.trajectory.slice();
        var nodes_to_keycodes;
        var keys_for_combos = [32, 72, 74, 75, 76] // space, H, J, K, L 
        var held_keys = {}; // Will indicate whether each of the above keys is
                            // currently depressed
        var combo_timing_out = false; // Whether part of a combo is pressed but
                                      // is waiting for rest.
        var partial_combo_timeout = 250; // ms until part is marked incorrect


        function reset_held_keys() {
            for (var i = 0; i < keys_for_combos.length; i++) {
                held_keys[keys_for_combos[i]] = false;
            }
        }

        function check_key_combo(desired_combo) {
            var positive_check = true;
            var negative_check = true;
            for (var i = 0; i < keys_for_combos.length; i++) {
                if (desired_combo.includes(keys_for_combos[i])) {
                    if (!held_keys[keys_for_combos[i]]) {
                        //console.log("failing on " + keys_for_combos[i])
                        positive_check = false;
                    }
                } else {
                    if (held_keys[keys_for_combos[i]]) {
                        //console.log("failing2 on " + keys_for_combos[i])
                        negative_check = false;
                    }
                }
            }
            return [positive_check, negative_check];
        }

        if (trial.graph_trial_type === 'letter') {
            nodes_to_keycodes = trial.nodes_to_keys.map(x => char_to_keycode(x));
        } else if (trial.graph_trial_type === 'key_combination') {
            nodes_to_keycodes = trial.nodes_to_keys.map(x => x.map(k => char_to_keycode(k)));
            reset_held_keys();
        }

        var keyboard_listener;
        var keyable = false;

        // logging variables
        var keypresses = [];
        var keyups = [];
        var keypress_rts = [];
        var keyup_rts = [];

        function start_keyboard_listener() {
            if (trial.graph_trial_type === 'key_combination') {
                reset_held_keys();
            }
            document.addEventListener('keydown', keydown_callback, false);
            if (trial.graph_trial_type === 'key_combination') {
                document.addEventListener('keyup', keyup_callback, false);
            }
            keyable = true;
        }

        function draw_rounded_rectangle(x, y, width, height, r) {
            draw.beginPath();
            draw.moveTo(x, y + r);
            draw.arcTo(x, y, x + r, y, r);
            draw.lineTo(x + width - r, y);
            draw.arcTo(x + width, y, x + width, y + r, r);
            draw.lineTo(x + width, y + height - r);
            draw.arcTo(x + width, y + height, x + width - r, y + height, r);
            draw.lineTo(x + r, y + height);
            draw.arcTo(x, y + height, x, y + height - r, r);
            draw.closePath()
        }

        function draw_letter_key(x, y, size, r, letter) {
            draw_rounded_rectangle(x, y, size, size, r);
            draw.stroke();
            draw.fillText(letter, x + size/4, y + size/2);
        }

        var letter_key_size = 70;
        var letter_key_r = 10;
        var space_key_width = 300;
        var letters;
        var let_x_pos;
        var key_y_offset;
        
        if (trial.keyboard_type == "grounded") {
            letters = ["H", "J", "K", "L"];
            let_x_pos= [-1.5, -0.25, 1, 2.25];
            key_y_offset = 1.5 * letter_key_size;
        } else { //abstract
//            letters = [" ", "H", "J", "K", "L"];
//            let_x_pos= [-3.25, -1.5, -0.25, 1, 2.25];
            letters = ["H", "J", "K", "L"];
            let_x_pos= [-2.375, -1.125, 0.125, 1.375];
            key_y_offset = letter_key_size;
        }

        function draw_keyboard(highlighted, highlight_color) {
            if (highlighted === undefined) {
                highlighted = [];
            } 
            if (highlight_color === undefined) {
                highlight_color = "#44FF44";
            }
            draw.lineWidth = 4;
            draw.font = "40px Arial";
            draw.textAlign = "center";
            for (var i = 0; i < letters.length; i++) {
                if (highlighted.includes(letters[i])) {
                    draw.strokeStyle = highlight_color;
                    draw.fillStyle = highlight_color;
                } else {
                    draw.strokeStyle = "black";
                    draw.fillStyle = "black";
                }
                draw_letter_key(canvas.width/2 + (let_x_pos[i]) * letter_key_size,
                                canvas.height/2 - key_y_offset,
                                letter_key_size,
                                letter_key_r,
                                trial.keyboard_type == "grounded" ? letters[i] : "");
            }

            // space
            if (trial.keyboard_type == "grounded") {
                if (highlighted.includes(' ')) {
                    draw.strokeStyle = highlight_color;
                    draw.fillStyle = highlight_color;
                } else {
                    draw.strokeStyle = "black";
                    draw.fillStyle = "black";
                }

                draw_rounded_rectangle(canvas.width/3 - 0.5 * space_key_width,
                                       canvas.height/2 + 0.5 * letter_key_size,
                                       space_key_width,
                                       letter_key_size,
                                       letter_key_r);
                draw.stroke();
                draw.fillText("space", 
                              canvas.width/3,
                              canvas.height/2 + letter_key_size);
            } else {
                if (highlighted.includes(' ')) {
                    draw.strokeStyle = highlight_color;
                    draw.fillStyle = highlight_color;
                } else {
                    draw.strokeStyle = "black";
                    draw.fillStyle = "black";
                }
                draw_letter_key(canvas.width/2 + (let_x_pos[0]) * letter_key_size,
                                canvas.height/2 + 0.25 * letter_key_size,
                                letter_key_size,
                                letter_key_r,
                                trial.keyboard_type == "grounded" ? letters[i] : "");

            }
            draw.strokeStyle = "black";
            draw.fillStyle = "black";


        }

        function display_node(node_index, incorrect) {
            if (trial.graph_trial_type === 'letter') {
                draw.clearRect(0, 0, canvas.width, canvas.height);
                draw.textAlign = "center";
                if (incorrect) {
                    draw.fillStyle = "red";
                } else {
                    draw.fillStyle = "black";
                }
                draw.font = "40px Arial";
                draw.fillText(trial.nodes_to_keys[node_index], canvas.width/2, canvas.height/2);
            } else if (trial.graph_trial_type === 'key_combination') {
                draw.clearRect(0, 0, canvas.width, canvas.height);
                draw_keyboard(trial.nodes_to_keys[node_index],
                              incorrect ? "red" : "#44FF44");
            } else {
                throw "Unknown trial type!";
            }
        }

        function display_instructions(instruction) {
            draw.textAlign = "center";
            draw.font = "30px Arial";
            draw.fillStyle = "black";
            draw.fillText(instruction, canvas.width/2, 40);
        }

        function advance_to_next() {
            //console.log("Advancing")
            keyable = false;
            combo_timing_out = false;
            if (trajectory.length == 0) {
                end_trial();
                return;
            }
            current_node = trajectory.shift();
            display_node(current_node);
            if (trial.instructions !== null) {
                current_instructions = trial.instructions.shift();
                display_instructions(current_instructions);
            }
            current_correct = nodes_to_keycodes[current_node];
            current_start_time = (new Date()).getTime();
            keypresses.push([]);
            keypress_rts.push([]);
            keyups.push([]);
            keyup_rts.push([]);
            reset_held_keys();
            keyable = true;
        }

        function end_trial() {
            document.removeEventListener('keydown', keydown_callback, false);
            if (trial.graph_trial_type === 'key_combination') {
                document.removeEventListener('keyup', keyup_callback, false);
            }
            var trial_data = {
                "trajectory": trial.trajectory,
                "graph_trial_type": trial.graph_trial_type,
                "nodes_to_keys": trial.nodes_to_keys,
                "canvas_width": trial.canvas_width,
                "canvas_height": trial.canvas_height,
                "keypresses": keypresses,
                "keypress_rts": keypress_rts,
                "keyups": keyups,
                "keyup_rts": keyup_rts
            };
            //console.log(trial_data);
            jsPsych.finishTrial(trial_data);
        }

        function keydown_callback(event_info) {
            if (!keyable) {
                return;
            }
            var event_time = (new Date()).getTime();
            keypresses[keypresses.length-1].push(event_info.keyCode);
            keypress_rts[keypresses.length-1].push(event_time - current_start_time);
            
            if (trial.graph_trial_type === 'letter') { 
                if (event_info.keyCode === current_correct) {
                    advance_to_next();
                } else {
                    display_node(current_node, true);
                    if (trial.instructions !== null) {
                        display_instructions(current_instructions);
                    }
//                    start_keyboard_listener();
                }
            } else if (trial.graph_trial_type === 'key_combination') {
                if (keys_for_combos.includes(event_info.keyCode)) {
                    held_keys[event_info.keyCode] = true;
                    var checks = check_key_combo(current_correct);
                    if (checks[0] && checks[1]) {
                        advance_to_next();
                    } else {
                        if (!checks[0] && checks[1]) { // incomplete combo
                            combo_timing_out = true;
                            setTimeout(function () {
                                if (combo_timing_out) {
                                    display_node(current_node, true);
                                    if (trial.instructions !== null) {
                                        display_instructions(current_instructions);
                                    }
                                }
                            }, partial_combo_timeout);
                        } else {
                            display_node(current_node, true);
                            if (trial.instructions !== null) {
                                display_instructions(current_instructions);
                            }
                        }
                    }
                }
            }
            return;
        }

        function keyup_callback(event_info) {
            if (!keyable) {
                return;
            }
            var event_time = (new Date()).getTime();
            keyups[keyups.length-1].push(event_info.keyCode);
            keyup_rts[keyup_rts.length-1].push(event_time - current_start_time);
            if (keys_for_combos.includes(event_info.keyCode)) {
                held_keys[event_info.keyCode] = false;
            }

            return;
        }

        
        // Start with first node 
        advance_to_next();
        start_keyboard_listener();
    };

    return plugin;
})();
