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
                description: 'Type of trial (letter or key-combination).'
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
                default: 600,
                description: 'The width of the canvas.'
            },
            canvas_height: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'CanvasHeight',
                default: 400,
                description: 'The height of the canvas.'
            },
            preamble: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Preamble',
                default: null,
                description: 'String to display at top of the page.'
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
        var keyable = false;
        var current_node;
        var current_correct;
        var trajectory = trial.trajectory.slice();
        var nodes_to_keycodes = trial.nodes_to_keys.map(x => char_to_keycode(x));
        var keyboard_listener;

        // logging variables
        var keypresses = [];
        var rts = [];

        function start_keyboard_listener() {
            jsPsych.pluginAPI.cancelAllKeyboardResponses();
            keyable = true;
            keyboard_listener = jsPsych.pluginAPI.getKeyboardResponse({
                callback_function: keyboard_callback,
                valid_responses: jsPsych.ALL_KEYS,
                rt_method: 'date',
                persist: true,
                allow_held_key: false
            });
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
            } else {
                throw "Unknown trial type!";
            }
        }

        function advance_to_next() {
            if (trajectory.length == 0) {
                end_trial();
                return;
            }
            current_node = trajectory.shift();
            display_node(current_node);
            current_correct = nodes_to_keycodes[current_node];
            keypresses.push([]);
            rts.push([]);
            start_keyboard_listener();
        }

        function end_trial() {
            var trial_data = {
                "trajectory": trial.trajectory,
                "graph_trial_type": trial.graph_trial_type,
                "nodes_to_keys": trial.nodes_to_keys,
                "canvas_width": trial.canvas_width,
                "canvas_height": trial.canvas_height,
                "keypresses": keypresses,
                "rts": rts

            };
            //console.log(trial_data);
            jsPsych.pluginAPI.cancelAllKeyboardResponses();
            jsPsych.finishTrial(trial_data);
        }

        function keyboard_callback(event_info) {
            if (!keyable) {
                return;
            }
            keyable = false;
            keypresses[keypresses.length-1].push(event_info.key);
            rts[keypresses.length-1].push(event_info.rt);

            if (event_info.key === current_correct) {
                advance_to_next();
            } else {
                display_node(current_node, true);
                start_keyboard_listener();
            }
            return;
        }
        
        // Start with first node 
        advance_to_next();
    };

    return plugin;
})();
