/**
Various useful functions
**/

// Python-like range runction
function range(start, end) {
    if (end === undefined) {
        end = start;
        start = 0;
    }
    if (start === end) {
        return [];
    }
    var result = [];
    for (var i = start; i < end; i++) {
        result.push(i);
    }
    return result;
}

// handles negative numbers in a better way for my use
function mod(n, m) {
  return ((n % m) + m) % m;
}


// Stolen from the internet, shuffles array in place
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
}

// Permute array according to index sequence
function permute(a, indices) {
    var i;
    var res = [];
    for (i = 0; i < indices.length; i ++) {
        res[i] = a[indices[i]];
    }
    return res;
}

// chooses a random element from an array 
function choice(a) {
    return a[Math.floor(Math.random() * a.length)];
}

//Returns an array of [x,y] pairs, for the vertices of a regular n-sided polygon
// with the first point at the top, and the points preceeding counterclockwise
// unless an offset angle (in radians) is specified
function get_polygon_coords(n_sides,cent_x,cent_y,radius, offset) {
    if (offset === undefined) {
        offset = 0;
    }
    var points = [];
    for (var i=0; i < n_sides; i++) {
        points.push([cent_x+radius*Math.sin(2*i*Math.PI/n_sides + offset),
                     cent_y-radius*Math.cos(2*i*Math.PI/n_sides + offset)]);
    }
    return points;
}


// stolen from the internet, gets keycodes for letters regardless of case
function char_to_keycode(character) {
    return character.toUpperCase().charCodeAt(0);
}

//data/server communication
function save_data(filename, filedata, callback, error_callback){
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4)
        {
            if (xhr.status == 200) {
                callback(); 
            } else {
                error_callback(); 
            }
        }
    }
    xhr.open('POST', 'https://web.stanford.edu/~lampinen/cgi-bin/save_data.php'); 
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({filename: name, filedata: data}));
}

//// Needs to be rewritten to not us jQuery
//function load_data(filename, callback, error_callback){
//   $.ajax({
//      type: "post",
//      url: 'https://web.stanford.edu/~lampinen/cgi-bin/recover_auxiliary_data.php', 
//      cache: false,
//      data: {filename: filename},
//      dataType: 'json',
//      success: callback,
//      error: error_callback});
//}
//
