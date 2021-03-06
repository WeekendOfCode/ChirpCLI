var util = require('util'),
    colors = require('colors'),
    read = require('read'),
    id = 0,
    form = {},
    input = {},
    user = {},
    irc = require('slate-irc');
blessed = require('blessed');
twitter = require('twitter');
var json = require('./settings.js');
var twit = new twitter(json);
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
    keys: true,
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
main.add('Logging in...');
main.down();
if (json.irc) {
    var net = require('net');

    var stream = net.connect({
        port: 6667,
        host: 'irc.freenode.org'
    });
    main.add('Connecting to Freenode...');
    main.down();
    var client = irc(stream);
    client.pass(json['irc-pass'])
    client.nick(json['irc-nick']);
    client.user(json['irc-user'], 'ChirpCLI')
    client.join(json['irc-channel']);
    client.names(json['irc-channel'], function () {
        main.add('Connected');
        main.down();
    });
}
screen.render();

function track(irc) {
    twit.stream('statuses/filter', options, function (stream) {
        stream.on('data', function (data) {
            if (data.user) {
                main.add('@'.blue + data.user.screen_name.blue + ': ' + data.text.replace(options.track, options.track.yellow));
                main.down();
                if (irc) {
                    client.send(json['irc-channel'], '@' + data.user.screen_name + ': ' + data.text);
                }
                screen.render();
            }
            if (data.warning) {
                console.log(data.warning.message.red)
            }
        });
    });
}

function self() {
    twit.stream('user', function (stream) {
        main.add('Now streaming your home timeline - scroll with arrow keys'.blue);
        main.down();
        screen.render();
        main.focus();
        stream.on('data', function (data) {
            if (data.user) {
                main.add('@'.blue + data.user.screen_name.blue + ': ' + data.text);
                main.down();
                screen.render();
            }
            if (data.warning) {
                console.log(data.warning.message.red)
            }
        });
    });
}

function home() {
    twit.get('/statuses/home_timeline.json', {
        include_entities: true
    }, function (data) {
        main.add('Fetched home data');
        main.down();
        screen.render();
        data.reverse();
        data.forEach(function (tweet) {
            if (tweet.user) {
                main.add('@'.blue + tweet.user.screen_name.blue + ': ' + tweet.text);
                main.down();
                screen.render();
            }
        });
        self();
    });
}

function userfeed() {
    twit.get('/statuses/user_timeline.json', options, function (data) {
        main.add('Fetched data');
        main.down();
        screen.render();
        data.reverse();
        data.forEach(function (tweet) {
            if (tweet.user) {
                main.add('@'.blue + tweet.user.screen_name.blue + ': ' + tweet.text);
                main.down();
                screen.render();
            }
        });
    });
}
twit.verifyCredentials(start);

function start(data) {
    id = data.id_str;
    if (!data.screen_name) {
        main.add('Failed to login.'.bold.red);
        if (!json.consumer_key) {
            main.add('Please fill settings.js with application keys.'.bold.red)
            main.down();
        }
        main.add('Press Q to exit');
        main.down();
        main.down();
        screen.render();
    } else {
        main.add('Logged in as @'.blue + data.screen_name.blue);
        main.add('Tip: Use CTRL-T to launch the tweet box whilst streaming');
        main.down();
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
            content: 'Menu',
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
        list.focus();
        list.add('Tweet - Send a tweet');
        list.add('Track - Track a keyword or hashtag');
        if (json.irc) {
            list.add('Relay - Relay tracking data to IRC')
        }
        list.add('Home - View & stream home timeline');
        list.add('User - View a user timeline');
        list.add('Help - View the help')
        list.on('select', function (data) {
            if (data.content == 'Help - View the help') {
                list.hide();
                main.add('Help'.bold);
                main.add('ChirpCLI is a twitter client for terminals.')
                main.add('http://blog.whiskers75.com/chirpcli-twitter-cli-in-node-js-weekend-of-code-1/')
                main.add('Controls:')
                main.add('Press Q to quit | CTRL-T to quicktweet | CTRL-R to return to main menu');
                main.down()
            }
            if (data.content == 'User - View a user timeline') {
                list.hide();
                main.add('User selected');
                main.down();
                var form = blessed.form({
                    parent: screen,
                    width: '50%',
                    height: '50%',
                    top: 'center',
                    left: 'center',
                    content: 'Enter a username (without the @):',
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
                    form.hide();
                    input.hide();
                    screen.render();
                    options.screen_name = input.value;
                    userfeed();
                });
            }
            if (data.content == 'Home - View & stream home timeline') {
                list.hide();
                home();
                main.add('Fetching data...')
                main.down();
                screen.render();
            }
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
                    twit.updateStatus(input.value, function (result) {
                        if (result.id) {
                            main.add('tweet sent!'.green);
                            main.down();
                        } else {
                            main.add('failed to send'.red);
                            main.down();
                        }
                        screen.render();
                        setTimeout(function () {
                            process.exit(0);
                        }, 3000);
                    })
                });
            }
            if (data.content == 'Track - Track a keyword or hashtag' || data.content == 'Relay - Relay tracking data to IRC') {
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
                    if (data.content == 'Relay - Relay tracking data to IRC') {
                        main.add('Relaying to IRC');
                        main.down();
                    }
                    main.down();
                    form.hide();
                    input.hide();
                    track(data.content == 'Relay - Relay tracking data to IRC');
                    screen.render();
                });
            }
            screen.render();
        });
        screen.render();
    }

};
screen.key(['escape', 'q', 'C-c'], function (ch, key) {
    return process.exit(0);
});
    screen.key('C-t', function () {
        main.add('Quick-Tweet activated!'.blue);
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
            twit.updateStatus(input.value, function (result) {
                if (result.id) {
                    main.add('tweet sent!'.green);
                    main.down();
                } else {
                    main.add('failed to send'.red);
                    main.down();
                }
                screen.render();
            })
        });
        input.key('escape', function () {
            form.hide();
            input.hide();
            screen.render();
        })
    });
screen.key('C-r', function() {
    twit.verifyCredentials(start);
});