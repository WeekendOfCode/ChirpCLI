var util = require('util'),
    colors = require('colors'),
    read = require('read'),
    id = 0,
    user = {},
    blessed = require('blessed');
twitter = require('twitter');
var twit = new twitter({
    consumer_key: '',
    consumer_secret: '',
    access_token_key: '',
    access_token_secret: ''
});
var options = {
    language: 'en',
    stall_warnings: 'true'
};
// Create a screen object.
var screen = blessed.screen();

// Create a box perfectly centered horizontally and vertically.
var main = blessed.list({
    top: 'center',
    left: 'center',
    width: '100%',
    height: '100%',
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    border: {
        type: 'line'
    }
});
var box = blessed.box({
    top: 'center',
    left: 'center',
    width: '50%',
    height: '50%',
    content: '{red-fg}Authenticating...{/red-fg}',
    tags: true,
    border: {
        type: 'line'
    },
    style: {
        fg: 'white',
        bg: 'black',
        border: {
            fg: '#f0f0f0'
        }
    }
});
screen.append(box);
screen.append(main);
screen.render();

function stream() {
    twit.stream('statuses/filter', options, function (stream) {
        stream.on('data', function (data) {
            if (data.user) {
                main.add('@'.blue + data.user.screen_name.blue + ': ' + data.text.replace(options.track, options.track.yellow));
                main.down();
                screen.render();
            }
            if (data.warning) {
                console.log(data.warning.message.red)
            }
        });
    });
}

function flood() {
    twit.stream('statuses/sample', function (stream) {
        stream.on('data', function (data) {
            if (data.user) {
                console.log('@'.blue + data.user.screen_name.blue, data.text);
            }
            if (data.warning) {
                console.log(data.warning.message.red)
            }
        });
    });
}
twit.verifyCredentials(function (data) {
    id = data.id_str;
    if (!data.screen_name) {
        console.log('Error.'.red);
        console.log('You need to create an application at https://dev.twitter.com/apps, generate keys and secrets, and put them in this file.');
        process.exit(1);
    }
    main.add('Logged in as @'.blue + data.screen_name.blue);
    main.down();
    box.setContent('{blue-fg}Logged in as @' + data.screen_name + '{/blue-fg}');
    screen.render();
    box.hide();
    var list = blessed.list({
        parent: screen,
        width: '75%',
        height: '75%',
        top: 'center',
        left: 'center',
        align: 'center',
        fg: 'blue',
        border: {
            type: 'line'
        },
        selectedBg: 'green',

        // Allow mouse support
        mouse: true,

        // Allow key support (arrow keys + enter)
        keys: true,

        // Use vi built-in keys
        vi: true
    });
    screen.append(list);
    list.add('Tweet - Send a tweet');
    list.add('Track - Track a keyword or hashtag');
    list.on('select', function (data) {
        if (data.content == 'Tweet - Send a tweet') {
            list.hide();
            main.add('Tweet selected');
            main.down();
            var form = blessed.form({
                parent: screen,
                width: '50%',
                height: '50%',
                top: 'center',
                left: 'center',
                content: 'Enter a tweet:',
                align: 'center',
                keys: true,
                border: {
                    type: 'line'
                }
            });
            var input = blessed.textarea({
                parent: form,
                width: '50%',
                height: '30%',
                top: 'center',
                left: 'center',
                keys: true,
                border: {
                    type: 'line'
                }
            });
            screen.append(form);
            screen.append(input);
            screen.render();
            input.focus();
            input.readInput();
            input.key('enter', function () {
                form.hide();
                input.hide();
                screen.render();
                main.add('tweeting '.blue + input.value);
                main.down();
                screen.render();
                twit.updateStatus(input.value, function(result) {
                    if (result.id) {
                        main.add('tweet sent!'.green);
                        main.down();
                    }
                    else {
                        main.add('failed to send'.red);
                        main.down();
                    }
                    screen.render();
                    setTimeout(function() {
                        process.exit(0);
                    }, 3000);
                })
            });
        }
        if (data.content == 'Track - Track a keyword or hashtag') {
            list.hide();
            main.add('Track selected');
            main.down();
            var form = blessed.form({
                parent: screen,
                width: '50%',
                height: '50%',
                top: 'center',
                left: 'center',
                content: 'Please enter a keyword:',
                align: 'center',
                keys: true,
                border: {
                    type: 'line'
                }
            });
            var input = blessed.textarea({
                parent: form,
                width: '30%',
                height: '15%',
                top: 'center',
                left: 'center',
                keys: true,
                border: {
                    type: 'line'
                }
            });
            screen.append(form);
            screen.append(input);
            screen.render();
            input.focus();
            input.readInput();
            input.key('enter', function () {
                options.track = input.value;
                main.add('Tracking ' + options.track.bold + ' (ESC, Q or Ctrl-C to quit)');
                main.down();
                form.hide();
                input.hide();
                stream();
                screen.render();
            });
        }
        screen.render();
    });
    screen.render();
});
screen.key(['escape', 'q', 'C-c'], function (ch, key) {
    return process.exit(0);
});