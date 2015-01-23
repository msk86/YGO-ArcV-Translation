fs = require('fs');
sqlite3 = require('sqlite3');
Q = require("q");
_ = require("underscore");

zhReady = Q.promise(function(resolve, reject) {
    var dbZh = new sqlite3.Database('./resources/cards-zh.cdb');

    dbZh.serialize(function() {

        var zh = {};
        dbZh.each("SELECT t.id, t.name, t.desc FROM texts t", function(err, row) {
            zh[""+ row.id] = {zh: row.name, desc: row.desc};
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
        dbJp.each("SELECT t.id, t.name FROM texts t", function(err, row) {
            jp["" + row.id] = {jp: row.name};
        }, function() {
            resolve(jp);
        });
    });
    dbJp.close();
});

translationReady = Q.all([zhReady, jpReady]).then(function(datas) {
    var translation = {};
    var zh = datas[0], jp = datas[1];
    _.each(zh, function(v, k) {
        if(jp[k]) { translation[jp[k].jp] = _.extend({}, v); }
    });
    return translation;
});

var cardSerialReady = translationReady.then(function(translation) {
    return Q.promise(function(resolve) {
        fs.readFile('./resources/CARD_Name_R.bin.txt', {encoding: 'utf8'}, function(err, txt) {
            if(err) return console.log(err);

            var lines = txt.split('\r\n');
            var newLines = [];

            _.each(lines, function(line) {
                var m = line.trim().match(/^([0-9A-Z,]+)(.*)$/);
                if(m) {
                    var code = m[1];
                    var cardName = m[2].replace(/\$R(.+?)\(.+?\)/g, function(all, $1) { return $1; });
                    var cardTranslation = translation[cardName];
                    if(cardTranslation) {
                        var translatedName = cardTranslation.zh;
                        var newLine = code + translatedName;
                        if(newLine.length > line.length) {
                            console.log('Warning:', translatedName, 'name is too long to translate', m[2]);
                        }
                        newLines.push(newLine);
                    } else {
                        newLines.push(code + cardName);
                    }
                } else {
                    newLines.push('');
                }
            });

            resolve(_.filter(newLines, function(newLine) {return newLine.length > 0;}));

            fs.writeFile('./out/CARD_Name_Zh.bin.txt', newLines.join('\r\n'), {encoding: 'utf8'}, function(err) {
                if(err) return console.log(err);
            });
        });
    });
});
