"use strict";

var _ = require('underscore');

var AnimationDefaults = {
    // Default duration 1 second
    duration: 1000,
    // Default easing - linear
    easing: function(t) { return t; }
};

var Animate = function(defaults) {
    this.defaults=_.extend({}, AnimationDefaults, defaults);
};

Animate.prototype.start = function(givenArgs) {
    var args=_.extend({}, this.defaults, givenArgs);
    args.delta=args.to - args.from;

    var startTime=new Date().getTime();

    var animationLoop=_.bind(function() {
        var now=new Date().getTime();
        // Calculate the delta
        var delta=(now-startTime)/args.duration;
        if(delta>1) delta=1;
        
        args.step(args.from + (args.delta*args.easing(delta)));
        
        if(delta<1) {
            this.id=window.requestAnimationFrame(animationLoop);
        } else {
            this.id=undefined;
            if(args.complete) {
                args.complete();
            }
        }
    },this);

    animationLoop();

    return this;
};

Animate.prototype.stop = function() {
    if(this.id!==undefined) {
        window.cancelAnimationFrame(this.id);
        this.id=undefined;
    }
    return this;
};

Animate.prototype.running = function() {
    return this.id!==undefined;
};

module.exports = Animate;
