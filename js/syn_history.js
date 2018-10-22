//合成履歴関連

//window.playAudio.history = new AudioContext();
//window.history_source = window.playAudio.history.createBufferSource();

//syn_historyに過去5回のwav(audiobuffer)とlf0を保存
function addHistory(array, type){

        syn_history[type].push(array); //末尾に追加

        if(syn_history[type].length > 5 ){//5以上なら先頭を除去
            syn_history[type].shift(); //先頭を削除
        }

}

function playAudioBuffer(audioBuffer){
    loadAudioBuffer(audioBuffer);
    hst_source.start(0);
}

function loadAudioBuffer(audioBuffer){
    hst_source = window.playAudio.history.createBufferSource();
    hst_source.buffer = audioBuffer;
    hst_source.connect(window.playAudio.history.destination);
    source.loop = false;
}

function displayHistory(){
    if(document.querySelectorAll('#history-date').length < 5){ //history < 5

        SetDate();
        console.log(window.date);

        let tmp_num = syn_history.lf0.length - 1
        let play_func = 'onclick={playAudioBuffer(syn_history.wav[' + tmp_num + '])}'
        let graph_func = 'onclick={switchVisible(' + tmp_num + ')}'
        $(  '<div id="history">' +
            '<button id="history-play"'
            + play_func +
            '>play</button>' +
            '<button id="history-graph"'
            + graph_func +
            '>graph</button>' +
            '<span id="history-date">' + window.date + '</span>' +
            '</div>'
        ).prependTo('div#history-box')
    }else{

        for(let i = 4; i > 0; i--){ //history >= 5
            let pre_date = document.querySelectorAll('#history-date')[i - 1].innerHTML; //一つ上の日付を下にコピー
            document.querySelectorAll('#history-date')[i].innerHTML = pre_date;
        }
        SetDate();
        document.querySelectorAll('#history-date')[0].innerHTML = window.date; //先頭を現在時刻に

    }
}
