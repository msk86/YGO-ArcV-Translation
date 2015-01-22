fs = require('fs');
sqlite3 = require('sqlite3');
Q = require("q");
_ = require("underscore");

zhReady = Q.promise(function(resolve, reject) {
    var dbZh = new sqlite3.Database('./resources/cards-zh.cdb');

    dbZh.serialize(function() {

        var zh = {};
        dbZh.each("SELECT t.id, t.name FROM texts t where id =32864", function(err, row) {
            zh[""+ row.id] = {zh: row.name};
        }, function() {
            resolve(zh);
        });
    });
    dbZh.close();
});

jpReady = Q.promise(function(resolve, reject) {
    var dbJp = new sqlite3.Database('./resources/cards-jp.cdb');

    dbJp.serialize(function() {
        var jp = {};
        dbJp.each("SELECT t.id, t.name FROM texts t where id =32864", function(err, row) {
            jp["" + row.id] = {jp: row.name};
        }, function() {
            resolve(jp);
        });
    });
    dbJp.close();
});

zhReady.then(function(data) {
    console.log(data);
});

jpReady.then(function(data) {
    console.log(data);
});

translationReady = Q.all([zhReady, jpReady]).then(function(datas) {
    var translation = {};
    var zh = datas[0], jp = datas[1];
    _.each(zh, function(v, k) {
        if(jp[k]) { translation[k] = _.extend({}, v, jp[k]); }
    });
    return translation;
});

fs.readFile('./resources/CARD_Name_R.bin.txt', {encoding: 'utf8'}, function(err, txt) {
    if(err) return console.log(err);

    console.log(txt.substr(0, 200));


});