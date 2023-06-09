/**
 * delete-record.js
 *
 * 不正等した記録を消去する
 */

var exec = require('child_process').exec;

var contestRef = require('./contestref.js').ref;

var argv = require('argv');
argv.option([
    {
        name: 'contest',
        type: 'string',
        description: 'Target contest',
        example: "'delete-record.js --contest=2018101'"
    },
    {
        name: 'event',
        type: 'string',
        description: 'Target event',
        example: "'delete-record.js --event=333'"
    },
    {
        name: 'username',
        type: 'string',
        description: 'Target username',
        example: "'delete-record.js --username=kotarot'"
    },
    {
        name: 'email',
        type: 'string',
        description: 'Target email (TODO: To get this automatically)',
        example: "'delete-record.js --email=kotarot'"
    },
    {
        name: 'dryrun',
        type: 'boolean',
        description: 'Enable dryrun',
        example: "'delete-record.js --dryrun'"
    }
]);
var argvrun = argv.run();
console.log(argvrun);

// 対象コンテスト (c2016xxx)
var targetContest, targetContestObj;
// ユーザテーブル、ユーザシークレットテーブル
var Users, Usersecrets;


// 記録を削除する
var deleteRecord = function() {
    var targetEmail = argvrun.options.email;
    var targetUsername = argvrun.options.username;
    var targetEvent = argvrun.options.event;

    contestRef.child('users').once('value', function(snapUsers) {
        Users = snapUsers.val();
        //console.log(Users);

        // UID を調べる
        var targetUID = '';
        Object.keys(Users).forEach(function(uid) {
            if (Users[uid].username == targetUsername) {
                targetUID = uid;
            }
        });

        contestRef.child('results').child(targetContest).child('e' + targetEvent).child(targetUID).once('value', function(snapResults) {
            var targetResult = snapResults.val();

            // 消す記録
            console.log('');
            console.log('** NOTICE -- about to delete **');
            console.log('Email    : ' + targetEmail);
            console.log('Username : ' + targetUsername);
            console.log('Contest  : ' + targetContest);
            console.log('UID      : ' + targetUID);
            console.log('Event    : ' + targetEvent);
            console.log(targetResult);
            console.log('********************************');
            console.log('');

            if (argvrun.options.dryrun) {
                console.log('dryrun!!!!');
                process.exit(0);
            } else {
                contestRef.child('results').child(targetContest).child('e' + targetEvent).child(targetUID).remove(function() {
                    console.log('delete success!!!!');
                    // メール送信
                    var command = '/usr/bin/php ' + __dirname + '/send-deleteemail.php'
                                + ' "' + targetEmail + '"'
                                + ' "' + targetUsername + '"'
                                + ' "' + targetContest.substr(1) + '"'
                                + ' "' + targetEvent + '"';
                    exec(command, function(err, stdout, stderr) {
                        if (err) {
                            console.error(err);
                        } else {
                            console.error(stderr);
                            process.exit(0);
                        }
                    });
                });
            }

        });
    });
};


// 存在するコンテストか調べる
var checkExists = function() {
    contestRef.child('contests').child(targetContest).once('value', function(snap) {
        if (snap.exists()) {
            targetContestObj = snap.val();
            deleteRecord();
        } else {
            console.error('Contest does not exist');
            process.exit(1);
        }
    });
};


var main = function() {
    if (argvrun.options.contest) {
        targetContest = 'c' + argvrun.options.contest;
        checkExists();
    } else {
        console.error('Specify contest!');
        process.exit(1);
    }
};
main();
