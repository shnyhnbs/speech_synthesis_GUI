//logを出力する関連

//mcep, lf0, bap, durを一度に保存
function DownloadFeats(){

    let date = SetDate();

    if(manual_bool){
        Save(mod_parameters.lf0, 'lf0', date, 'download');
        Save(mod_parameters.mcep, 'mcep', date, 'download');
        Save(mod_parameters.bap, 'bap', date, 'download');
        Save(parameters.dur, 'dur', date, 'download');
        Save(mod_parameters.mlf0, 'mlf0', date, 'download');
        Save(output.wav, 'wav', date, 'downloadWav');

    }else{
        Save(parameters.lf0, 'lf0', date, 'download');
        Save(parameters.mcep, 'mcep', date, 'download');
        Save(parameters.bap, 'bap', date, 'download');
        Save(parameters.dur, 'dur', date, 'download');
        Save(output.wav, 'wav', date, 'downloadWav');

    }
}

//data(配列), feat(拡張子), name(ファイル名) を入力
function Save(in_data, in_feat, in_name, in_qtype){
//    event.preventDefault();

    let qtype = in_qtype;
    let feat = in_feat;
    let name = in_name;
    let data = in_data;

    let JSONdata = {
        qtype: qtype,
        data: data,
        feat: feat,
        name: name
    };

    $.ajax({
        url: 'http://localhost:12121/cgi-bin/DownloadFeats/download.py',
        type: 'post',
        data: JSON.stringify(JSONdata),
        contentType: 'application/JSON',
        dataType : 'JSON',
        charset: 'utf-8'
        })
    .done(function() {
        console.log('Download is Success');
    })
    .fail(function() {
        console.log('Download is Failed');
    });

}

function writeLog(in_text, in_name){

    let text = in_text;
    let name = in_name;
    let date = SetDate();

    let JSONdata = {
        qtype: 'log',
        feat: date, //日付を格納
        data: text,
        name: name
    };

    $.ajax({
        url: 'http://localhost:12121/cgi-bin/DownloadFeats/download.py',
        type: 'post',
        data: JSON.stringify(JSONdata),
        contentType: 'application/JSON',
        dataType : 'JSON',
        charset: 'utf-8'
        })
    .done(function() {
        console.log('writeLog is Success');
    })
    .fail(function() {
        console.log('writeLog is Failed');
    });

}
