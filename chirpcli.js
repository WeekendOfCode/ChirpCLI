var util = require('util'),
    colors = require('colors'),
    read = require('read'),
    id = 0,
    user = {};
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
console.log('Authenticating..'.red)

function stream() {
    twit.stream('statuses/filter', options, function (stream) {
        console.log('Now streaming Tweets containing', options.track.bold)
        stream.on('data', function (data) {
            if (data.user) {
                console.log('@'.blue + data.user.screen_name.blue, data.text.replace(options.track, options.track.yellow));
            }
            if (data.warning) {
                console.log(data.warning.message.red)
            }
        });
    });
}
function flood() {
    twit.stream('statuses/sample', function (stream) {
        console.log('Now streaming a random sample of all tweets');
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
    console.log('Welcome back, @'.blue + data.screen_name.blue);
    console.log('What would you like to do? [tweet, stream, flood]'.green);
    read({
    prompt: '>'
    }, function (err, result) {
        if (result == 'tweet') {
            console.log('Enter tweet:'.blue);
            read({
                prompt: 'tweet>'
            }, function (err, result) {
                twit.updateStatus(result, function (data) {
                    if (data.id) {
                        console.log('tweet sent!'.green);
                        console.log('@'.blue + data.user.screen_name.blue, data.text);
                    } else {
                        console.log(util.inspect(data));
                        console.log('error sending tweet'.red);
                    }
                    process.exit(0);
                });
            })
        } else {
            if (result == 'stream') {
                console.log('Enter a keyword to stream:'.green);
                read({
                    prompt: 'stream>'
                }, function (err, result) {
                    options.track = result;
                    stream();
                })
            } else {
                if (result == 'flood') {
                    flood();
                } else {
                    console.log('Please enter tweet, flood or stream!'.red)
                    process.exit(1);
                }
            }
        }
    });
});
