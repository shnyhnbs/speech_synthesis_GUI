//合成履歴関連

//window.playAudio.history = new AudioContext();
//window.history_source = window.playAudio.history.createBufferSource();

//syn_historyに過去5回のwav(audiobuffer)とlf0を保存
function addHistory(array, type){

        syn_history[type].push(array);

        if(syn_history[type].length > 5 ){//5以上なら先頭を除去
            syn_history[type].shift();
        }

}

function playAudioBuffer(audioBuffer){
    loadHistory(audioBuffer);
    hst_source.start(0);
}

function loadAudioBuffer(audioBuffer){
    hst_source = window.playAudio.history.createBufferSource();
    hst_source.buffer = audioBuffer;
    hst_source.connect(window.playAudio.history.destination);
    source.loop = false;
}
