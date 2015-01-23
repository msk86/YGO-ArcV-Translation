fs = require('fs');
sqlite3 = require('sqlite3');
Q = require("q");
_ = require("underscore");

zhReady = Q.promise(function (resolve, reject) {
    var dbZh = new sqlite3.Database('./resources/cards-zh.cdb');

    dbZh.serialize(function () {

        var zh = {};
        dbZh.each("SELECT t.id, t.name, t.desc FROM texts t", function (err, row) {
            zh["" + row.id] = {zh: row.name, desc: row.desc};
        }, function () {
            resolve(zh);
        });
    });
    dbZh.close();
});

jpReady = Q.promise(function (resolve, reject) {
    var dbJp = new sqlite3.Database('./resources/cards-jp.cdb');

    dbJp.serialize(function () {
        var jp = {};
        dbJp.each("SELECT t.id, t.name FROM texts t", function (err, row) {
            jp["" + row.id] = {jp: row.name.replace(/ /g, '　').replace(/\./g, '．')};
        }, function () {
            resolve(jp);
        });
    });
    dbJp.close();
});

translationReady = Q.all([zhReady, jpReady]).then(function (datas) {
    var translation = {};
    var zh = datas[0], jp = datas[1];
    _.each(zh, function (v, k) {
        if (jp[k]) {
            translation[jp[k].jp] = _.extend({}, v);
        }
    });
    return translation;
});

var cardSerialReady = translationReady.then(function (translation) {
    return Q.promise(function (resolve) {
        fs.readFile('./resources/CARD_Name_R.bin.txt', {encoding: 'utf8'}, function (err, txt) {
            if (err) return console.log(err);

            var lines = txt.split('\r\n');
            var newLines = [];
            var cannotTranslate = [];
            var serial = [''];
            _.each(lines, function (line) {
                var m = line.trim().match(/^([0-9A-Z,]+),(.*?)$/);
                if (m) {
                    var code = m[1];
                    var cardName = m[2].replace(/\$R(.+?)\(.+?\)/g, function (all, $1) {
                        return $1;
                    });
                    serial.push(cardName);
                    var cardTranslation = translation[cardName];
                    if (cardTranslation) {
                        var translatedName = cardTranslation.zh;
                        var newLine = code + ',' + translatedName;
                        if (newLine.length > line.length) {
                            console.log('Warning:', translatedName, 'name is too long to translate', m[2]);
                        }
                        newLines.push(newLine);
                    } else {
                        cannotTranslate.push(code);
                        newLines.push(code + ',' + cardName);
                    }
                } else {
                    newLines.push('');
                }
            });

            console.log('Cannot translate card name:\n', cannotTranslate);

            resolve(serial);
        });
    });
});

Q.all([translationReady, cardSerialReady]).then(function (datas) {
    var translation = datas[0];
    var serials = datas[1];

    fs.readFile('./resources/CARD_Desc_J.txt', {encoding: 'UTF16LE'}, function (err, txt) {
        if (err) return console.log(err);
        txt = txt.replace(/\r\n/g, '').replace(/(\d+?＾)/g, '\r\n$1');
        var lines = txt.split('\r\n');

        var newLines = [];
        var cannotTranslate = [];

        _.each(lines, function (line) {
            var m = line.trim().match(/^(\d+)＾(.+)$/);
            if (m) {
                var cardNo = parseInt(m[1]);
                var cardDesc = m[2].replace(/\$R(.+?)\(.+?\)/g, function (all, $1) {
                    return $1;
                });
                var cardJpName = serials[cardNo];
                var cardTranslation = translation[cardJpName];
                if (cardTranslation) {
                    var translatedName = fullChar(cardTranslation.zh);
                    var translatedDesc = fullChar(cardTranslation.desc);
                    var newLine = cardNo + '＾' + translatedName + '＾' + translatedDesc;
                    if (newLine.length > line.length) {
                        console.log('Warning:', cardNo, translatedName, 'desc is too long to translate', cardJpName);
                    }
                    newLines.push(newLine);
                } else {
                    var newLine = cardNo + '＾' + cardJpName + '＾' + cardDesc;
                    cannotTranslate.push(cardNo);
                    newLines.push(newLine);
                }
            } else {
                newLines.push(line);
            }
        });

        console.log('Cannot translate card desc:\n', cannotTranslate);

        fs.writeFile('./out/CARD_Name_Desc_Zh.txt', newLines.join('\r\n'), {encoding: 'UTF16LE'}, function (err) {
            if (err) return console.log(err);
            console.log('done');
        });
    });
});

function fullChar(txt) {
    return txt.replace(/ /g, '　')
        .replace(/\./g, '．')
        .replace(/1/g, '１')
        .replace(/2/g, '２')
        .replace(/3/g, '３')
        .replace(/4/g, '４')
        .replace(/5/g, '５')
        .replace(/6/g, '６')
        .replace(/7/g, '７')
        .replace(/8/g, '８')
        .replace(/9/g, '９')
        .replace(/0/g, '０')
        .replace(/A/g, 'Ａ')
        .replace(/B/g, 'Ｂ')
        .replace(/C/g, 'Ｃ')
        .replace(/D/g, 'Ｄ')
        .replace(/E/g, 'Ｅ')
        .replace(/F/g, 'Ｆ')
        .replace(/G/g, 'Ｇ')
        .replace(/H/g, 'Ｈ')
        .replace(/I/g, 'Ｉ')
        .replace(/J/g, 'Ｊ')
        .replace(/K/g, 'Ｋ')
        .replace(/L/g, 'Ｌ')
        .replace(/M/g, 'Ｍ')
        .replace(/N/g, 'Ｎ')
        .replace(/O/g, 'Ｏ')
        .replace(/P/g, 'Ｐ')
        .replace(/Q/g, 'Ｑ')
        .replace(/R/g, 'Ｒ')
        .replace(/S/g, 'Ｓ')
        .replace(/T/g, 'Ｔ')
        .replace(/U/g, 'Ｕ')
        .replace(/V/g, 'Ｖ')
        .replace(/W/g, 'Ｗ')
        .replace(/X/g, 'Ｘ')
        .replace(/Y/g, 'Ｙ')
        .replace(/Z/g, 'Ｚ')
        .replace(/a/g, 'ａ')
        .replace(/b/g, 'ｂ')
        .replace(/c/g, 'ｃ')
        .replace(/d/g, 'ｄ')
        .replace(/e/g, 'ｅ')
        .replace(/f/g, 'ｆ')
        .replace(/g/g, 'ｇ')
        .replace(/h/g, 'ｈ')
        .replace(/i/g, 'ｉ')
        .replace(/j/g, 'ｊ')
        .replace(/k/g, 'ｋ')
        .replace(/l/g, 'ｌ')
        .replace(/m/g, 'ｍ')
        .replace(/n/g, 'ｎ')
        .replace(/o/g, 'ｏ')
        .replace(/p/g, 'ｐ')
        .replace(/q/g, 'ｑ')
        .replace(/r/g, 'ｒ')
        .replace(/s/g, 'ｓ')
        .replace(/t/g, 'ｔ')
        .replace(/u/g, 'ｕ')
        .replace(/v/g, 'ｖ')
        .replace(/w/g, 'ｗ')
        .replace(/x/g, 'ｘ')
        .replace(/y/g, 'ｙ')
        .replace(/z/g, 'ｚ')
        .replace(/\(/g, '（')
        .replace(/\)/g, '）')
        .replace(/-/g, '－')
        .replace(/\+/g, '＋')
        .replace(/\//g, '／');
}