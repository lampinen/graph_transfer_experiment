// plugin for dragging and dropping letters 

jsPsych.plugins['drag-drop-letters'] = (function() {

    var plugin = {};

    plugin.info = {
        name: 'drag-drop',
        description: '',
        parameters: {
            letters: {
                type: jsPsych.plugins.parameterType.STRING,
                array: true,
                pretty_name: 'Letters',
                default: null,
                description: 'The letters to drag and drop.'
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
            target_locations: {
                type: jsPsych.plugins.parameterType.COMPLEX,
                array: true,
                pretty_name: 'TargetLocations',
                default: [],
                description: 'Where the target locations for dragging + dropping are.' 
            },
            background_images: {
                type: jsPsych.plugins.parameterType.STRING,
                array: true,
                pretty_name: 'BackgroundImages',
                default: [],
                description: 'Images to place in the background.'
            },
            background_image_locations: {
                type: jsPsych.plugins.parameterType.COMPLEX,
                array: true,
                pretty_name: 'BackgroundImageLocations',
                default: [],
                description: 'Where to place the background image(s).'
            },
            bg_image_width: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'BackgroundImageWidth',
                default: 500,
                description: 'The width of the background image(s).'
            },
            bg_image_height: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'BackgroundImageHeight',
                default: 500,
                description: 'The height of the background image(s).'
            },
            preplaced_draggable: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Preplaced',
                default: '',
                description: 'Letter (if any) to pre-place.'
            },
            preplaced_draggable_location: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Preplaced',
                default: 0,
                description: 'Snap location to pre-place it at.'
            },
            snap_padding: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'SnapPadding',
                default: 15,
                description: 'How forgiving snap locations are.'
            },
            shuffle_initial_locations: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'ShuffleInitialLocations',
                default: true,
                description: 'Whether to shuffle the initial locations draggables are assigned to.'
            },
            drag_drop_type: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'DragDropType',
                default: 'free',
                description: 'Whether "free" clustering or on "image"'
            }
        }
    }


    plugin.trial = function(display_element, trial) {

        var draggable_height = 50;
        var draggable_width = 50;
        var snap_padding = trial.snap_padding;
        if (trial.background_images.length > trial.background_image_locations.length) {
            if (trial.background_images.length === 1 && trial.background_image_locations.length === 0) {
                trial.background_image_locations = [{"x": trial.canvas_width - (trial.bg_image_width + 20), "y": 0}]; 
            } else {
                throw "Not enough background image locations provided!";
            }
        }


        var frame_freq = 50; // ms between frames

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
        html += "<br /><br /><button id='drag-drop-submit-btn' class='jspsych-btn'>Submit</button></div>"

        display_element.innerHTML = html;

        var canvas = display_element.querySelector('#graph-trial-canvas');
        var draw = canvas.getContext("2d");

        var action_history = [];

        var start_time = (new Date()).getTime();

        if (trial.letters.length > 20) {
            alert("Not enough initial locations, truncating to 10 images...")
            trial.letters = trial.letters.slice(0, 20);
        }

        var initial_locations = [
            {"x": 0, "y": 0, "width": 50, "height": 50}, {"x": 50, "y": 0, "width": 50, "height": 50},
            {"x": 0, "y": 50, "width": 50, "height": 50}, {"x": 50, "y": 50, "width": 50, "height": 50},
            {"x": 0, "y": 100, "width": 50, "height": 50}, {"x": 50, "y": 100, "width": 50, "height": 50},
            {"x": 0, "y": 150, "width": 50, "height": 50}, {"x": 50, "y": 150, "width": 50, "height": 50},
            {"x": 0, "y": 200, "width": 50, "height": 50}, {"x": 50, "y": 200, "width": 50, "height": 50},
            {"x": 0, "y": 250, "width": 50, "height": 50}, {"x": 50, "y": 250, "width": 50, "height": 50},
            {"x": 0, "y": 300, "width": 50, "height": 50}, {"x": 50, "y": 300, "width": 50, "height": 50},
            {"x": 0, "y": 350, "width": 50, "height": 50}, {"x": 50, "y": 350, "width": 50, "height": 50},
            {"x": 0, "y": 400, "width": 50, "height": 50}, {"x": 50, "y": 400, "width": 50, "height": 50},
            {"x": 0, "y": 450, "width": 50, "height": 50}, {"x": 50, "y": 450, "width": 50, "height": 50}
        ]; 

        initial_locations = initial_locations.slice(0, trial.letters.length);
        if (trial.shuffle_initial_locations) {
            shuffle(initial_locations); // So that there is no bias in what appears where
        }

        var bg_image_objects = trial.background_images.map(function(x) {
            var this_image = new Image(trial.bg_image_width, trial.bg_image_height);
            this_image.src = x;
            return this_image;
        });


        /////// the annoying part ////////////////////////////////////////////////////

        // "constructor" for the places the objects snap to 
        function snap_location(this_location) {
            this.x = this_location.x;
            this.y = this_location.y;
            this.width = this_location.width || draggable_width;
            this.height = this_location.height || draggable_height;
            this.occupied = false;
            this.draggable = null;

            this.contains = function(mouse) {
                var x = mouse.x;
                var y = mouse.y;
                return (x >= this.x - snap_padding) && (x <= this.x + this.width + snap_padding) && (y >= this.y - snap_padding) && (y <= this.y + this.width + snap_padding);
            }

            this.free = function() {
                this.occupied = false;
            };

            this.assign_draggable = function(draggable) {
                this.occupied = true;
                this.draggable = draggable;
                this.draggable.curr_location = this;
                this.draggable.position_x = this.x;
                this.draggable.position_y = this.y;
            }
        }

        // creating objects for all the necessary locations
        initial_locations = initial_locations.map(function(x) {var loc = new snap_location(x); return loc;});
        var target_locations;
        var all_locations = initial_locations;
        if (trial.drag_drop_type !== 'free') {
            target_locations = trial.target_locations.map(function(x) {var loc = new snap_location(x); return loc;});
            all_locations = initial_locations.concat(target_locations);
        }

        function any_targets_unoccupied() { // checks for completion
            if (trial.drag_drop_type === 'free') {
                for (var i = 0; i < draggables_array.length; i++) {
                    if (draggables_array[i].position_x < 100) {
                        return true;
                    }
                }
                return false;
            } else {
                for (var i = 0; i < target_locations.length; i++) {
                    if (!target_locations[i].occupied) {
                        return true;
                    }
                }
                return false; 
            }
        }

        function get_current_assignments() { // checks for completion
            var curr_assignments = [];
            if (trial.drag_drop_type === 'free') {
                curr_assignments = draggables_array.map(function(draggable) {
                    return {'label': draggable.label,
                            'position': [draggable.position_x, draggable.position_y]};

                });
            } else {
                for (var i = 0; i < target_locations.length; i++) {
                    if (!target_locations[i].occupied) {
                        curr_assignments.push(null);
                    }
                    curr_assignments.push(target_locations[i].draggable.label);
                }
            }
            return curr_assignments;
        }

        // "constructor" for draggable letter object
        function Draggable(letter, initial_location, label, width, height) {
            this.drawer = draw; // it would be so nice if I named things intelligently
            this.curr_location = initial_location;
            this.position_x = initial_location.x; //not strictly necessary given below
            this.position_y = initial_location.y;
            this.curr_location.assign_draggable(this);

            this.letter = letter;
            this.label = label || letter;
            this.width = width || draggable_width;
            this.height = height || draggable_height;
            this.dragging = false;
            this.drag_init_x = 0; //while dragging
            this.drag_init_y = 0;
            this.mouse_init_x = 0; //while dragging
            this.mouse_init_y = 0;
            this.draw = function() {
                this.drawer.strokeStyle = "black";
                this.drawer.fillStyle = "white";
    
                this.drawer.beginPath();
                this.drawer.rect(this.position_x,
                                 this.position_y,
                                 this.width,
                                 this.height);
                this.drawer.closePath();
                this.drawer.fill();
                this.drawer.stroke();

                this.drawer.textAlign = "center";
                this.drawer.fillStyle = "black";
                this.drawer.font = "40px Arial";
                this.drawer.fillText(letter, 
                                     this.position_x + this.width/2,
                                     this.position_y + this.height/2 + 15);

            };

            this.contains = function(mouse) {
                var x = mouse.x;
                var y = mouse.y;
                return (x >= this.position_x) && (x <= this.position_x + this.width) && (y >= this.position_y) && (y <= this.position_y + this.width)
            }
            
            this.mousedown_handler = function(e, mouse) {
                // presupposes containment
                this.dragging = true; 
                this.drag_init_x = this.position_x;
                this.drag_init_y = this.position_y;
                this.mouse_init_x = mouse.x; 
                this.mouse_init_y = mouse.y;
            }

            this.mousemove_handler = function(e, mouse) {
                this.position_x = this.drag_init_x + mouse.x - this.mouse_init_x;
                this.position_y = this.drag_init_y + mouse.y - this.mouse_init_y;
            }

            this.mouseup_handler = function(e, mouse) {
                this.dragging = false; 
                if (trial.drag_drop_type === 'free') {
                    var curr_assigned = false;
                    for (var i = 0; i < all_locations.length; i++ ) {

                        if (all_locations[i].contains(mouse)) {
                            if (this.curr_location) {
                                if (all_locations[i].occupied) {
                                    this.curr_location.assign_draggable(all_locations[i].draggable);
                                } else {
                                    this.curr_location.free();
                                }
                            } else {
                                if (all_locations[i].occupied) {
                                    all_locations[i].draggable.position_x = this.drag_init_x;
                                    all_locations[i].draggable.position_y = this.drag_init_y;
                                }
                            }
                            all_locations[i].assign_draggable(this);
                            curr_assigned = true;
                            return;
                        }
                    }
                    if (!curr_assigned) {
                        if (this.curr_location) {
                            this.curr_location.free();
                            this.curr_location = null;
                        }
                        if (this.position_x >= 75 && this.position_x <= 100) { // "snap" to within grey region
                            this.position_x = 100;
                        }
                    }
                } else { 
                    for (var i = 0; i < all_locations.length; i++ ) {
                        if (all_locations[i].contains(mouse)) {
                            if (all_locations[i].occupied) {
                                this.curr_location.assign_draggable(all_locations[i].draggable);
                            } else {
                                this.curr_location.free();
                            }
                            all_locations[i].assign_draggable(this);
                            return;
                        }
                    }
                    // otherwise, back to where we started... ugggh
                    this.curr_location.assign_draggable(this);
                }
            }
        }

        var draggables_array = []; 
        for (var i = 0; i < trial.letters.length; i++) {
            var this_draggable = new Draggable(trial.letters[i], initial_locations[i]);
            draggables_array.push(this_draggable);
            if (trial.preplaced_draggable !== "" && this_draggable.label == trial.preplaced_draggable) { 
                this_draggable.curr_location.free();
                target_locations[trial.preplaced_draggable_location].assign_draggable(this_draggable); 
            }
        }

        function redraw() {
            draw.clearRect(0, 0, canvas.width, canvas.height);
            // Gray area
            if (trial.drag_drop_type === 'free') {
                draw.beginPath();
    
                draw.beginPath();
                draw.rect(100, 0, canvas.width - 100, canvas.height);
                draw.closePath();
                draw.fillStyle = "gray";
                draw.fill();
            }
            // background image(s), if any
            for (var i = 0; i < bg_image_objects.length; i++) {
                draw.drawImage(bg_image_objects[i],
                               trial.background_image_locations[i].x,
                               trial.background_image_locations[i].y,
                               trial.bg_image_width,
                               trial.bg_image_height);
            }

            // Draggables
            for (var i = 0; i < draggables_array.length; i++) {
                draggables_array[i].draw();
            }
        }
        ////// event stuff /////////////////////////////

        var getMouse = function(e,canvas) { //Gets mouse location relative to canvas, code stolen from https://github.com/simonsarris/Canvas-tutorials/blob/master/shapes.js 
                var element = canvas;
                var offsetX = 0;
                var offsetY = 0;
                var html = document.body.parentNode;
                var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
                if (element.offsetParent !== undefined) {
                        do {
                                offsetX += element.offsetLeft;
                                offsetY += element.offsetTop;
                        } while ((element = element.offsetParent));
                }

                if (document.defaultView && document.defaultView.getComputedStyle) {
                        stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10) || 0;
                        stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10) || 0;
                        styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10) || 0;
                        styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10) || 0;
                }
                htmlTop = html.offsetTop;
                htmlLeft = html.offsetLeft;
                offsetX += stylePaddingLeft + styleBorderLeft + htmlLeft;
                offsetY += stylePaddingTop + styleBorderTop + htmlTop;

                mx = e.pageX - offsetX;
                my = e.pageY - offsetY;
                return {x: mx, y: my};
        };

        canvas.addEventListener('mousedown', function(e) {
            var mouse = getMouse(e, canvas);
            for (var i = draggables_array.length-1; i >= 0 ; i--) {
                if (draggables_array[i].contains(mouse)) {
                    var curr = draggables_array[i];
                    draggables_array.splice(i, 1); // remove
                    draggables_array.push(curr); // And put at top of stack
                    return curr.mousedown_handler(e, mouse);
                }
            }
        });

        canvas.addEventListener('mousemove', function(e) {
            var mouse = getMouse(e, canvas);
            var i = draggables_array.length - 1;
            if (draggables_array[i].dragging) {
                return draggables_array[i].mousemove_handler(e, mouse);
            }
        });

        canvas.addEventListener('mouseup', function(e) {
            var mouse = getMouse(e, canvas);
            var i = draggables_array.length - 1;
            if (draggables_array[i].dragging) {
                return draggables_array[i].mouseup_handler(e, mouse);
            }
        });

        ////// Ending/starting /////////////////////////////////////////////////////////

        function end_function() {
            if (any_targets_unoccupied()) {
                if (trial.drag_drop_type === 'free') {
                    alert("Please place every letter on the gray part of the display!");

                } else {
                    alert("Please place every letter somewhere!");
                }
                return;
            }
            display_element.innerHTML = '';

            var trial_data = {
                "rt": (new Date()).getTime() - start_time,
                "assignments": get_current_assignments() 
            };
            if (trial.background_order !== "") {
                trial_data.background_order = trial.background_order; // save order if images were permuted
            }
            //alert(JSON.stringify(trial_data))

            jsPsych.finishTrial(trial_data);
        }

        // start trial once images are loaded
        jsPsych.pluginAPI.preloadImages(trial.background_images, function() {
            display_element.querySelector('#drag-drop-submit-btn').addEventListener('click', end_function);
            setInterval(redraw, frame_freq);
        });
        };

    return plugin;
})();
