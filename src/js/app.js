'use strict';

var helpers = require('modules/helpers');
var monoFilter = require('mono-filter');

var app = {
    init: function() {
        monoFilter({
            numberOfColumns: 4, //Optional (default 4)
            animation: true, //Optional (default: false), Requires Velocity
            animationSettings: { // Optional
                show: {
                    duration: 700, // Default 800
                    easing: [ 0.71, 0.01, 0.34, 1], // Default linear
                    delay: 140 //Maximum delay, randomized between 0 and this number. Default 140
                },
                hide: {
                    duration: 700, // Default 800
                    easing: [ 0.71, 0.01, 0.34, 1], // Default linear
                    delay: 140 //Maximum delay, randomized between 0 and this number. Default 140
                }
            }
        });
    }
};

app.init();
