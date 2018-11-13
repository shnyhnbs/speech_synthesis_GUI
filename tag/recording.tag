'use strict';
<recording>

    <body>
        <div id="rec-main-box">
            <div id="click">
                <!--    <button class="waves-effect waves-light btn" id="analyze">分析</button> -->
                <!--    <button class="waves-effect waves-light btn" id="rec_syn">合成</button> -->
                <!--    <button class="waves-effect waves-light btn" onclick="play()">音声確認</button> -->
                <!--    <button class="waves-effect waves-light btn" id="rec_submit">送信</button> -->
                <button id="rec" value="録音開始"　style="color: #028760;">録音開始</button>
                <label>
                    ファイル選択
                    <input type="file" name="file" id="rec_file">
                </label>
                <button id="reflect" class="waves-effect waves-light btn">反映</button>
            </div>
                <div>
                </div>
        </div>
    </body>

<script>

var reader;
var rec_array;

window.recorder;
window.rec_flag;
window.rec_flag = false; //rec_flag == false ; use file;

function rec_submit(){
    event.preventDefault();

    let params =  SPTK.SPTKWeb.GetWavParameter(rec_wav); //fs, nbit, samples
    let arr = SPTK.SPTKWeb.GetWavFormForWorld(rec_wav, params.samples); //getInt16


    let JSONdata = {
        qtype: 'record',
        text: arr
    };

    console.dir(arr);
    console.dir(JSONdata);
    console.dir(JSON.stringify(JSONdata))


    $.ajax({
        url: 'http://localhost:12121/cgi-bin/tailor/align.py',
        type: 'post',
        data: JSON.stringify(JSONdata),
        contentType: 'application/JSON',
        dataType : 'JSON',
        charset: 'utf-8'
        })
    .done(function(response) {
        window.rec_worldParameters.lab = response;

        //barを変更
        rec2mlf0(parameters.lab.plab, input, parameters.dur, parameters.lf0, window.rec_worldParameters.f0, window.rec_worldParameters.lab.mora_dur);
        loadMlf0(mod_parameters.mlf0, parameters.lab.mora);
        mkBarCss(mkMora_dur(parameters.lab.plab, parameters.dur), parameters.lab.mora);

    })
    .fail(function() {
        $('#status').html('失敗しました');
    });
};

//rec_flag == true ? use rec_wav : use file;
//buffer(バイナリ)で渡す
async function analyze(){
    if(window.rec_flag){
        analyzeWav(rec_array.buffer);
        return 'analyze finished';

    }else{

        analyzeWav(reader.result);;
        return 'analyze finished';
    }

}

this.on('mount', () => {

    navigator.getUserMedia = (navigator.getUserMedia ||
                              navigator.webkitGetUserMedia ||
                              navigator.mozGetUserMedia ||
                              navigator.msGetUserMedia);
    window.URL = window.URL || window.webkitURL;

    window.recContext = new window.AudioContext();
    window.ana_recContext = new window.AudioContext();

    navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
    			__log('No live audio input: ' + e);
    		});

jQuery('#click').on('click', "#rec", function() {
    if (this.value === "録音開始") {
        jQuery('#rec').replaceWith('<input type="button" id="rec" value="録音停止" style="color: #D30E1B;">');
        recorder && recorder.clear();
        record();
    } else {
        jQuery('#rec').replaceWith('<input type="button" id="rec" value="録音開始" style="color: #028760;">');
        stop();

        recorder && recorder.exportWAV(function(array) {
            rec_array = array;
        });

    }
});

//    document.getElementById('rec_syn').onclick = function (){
//        rec_synthesizeWav(rec_worldParameters);
//    }

//    document.getElementById('analyze').onclick = function (){
//        analyze();
//    }

//    document.getElementById('rec_submit').onclick = function (){
//            rec_submit();
//    };

document.getElementById('reflect').onclick = function (){
    analyzeAll();
};

async function analyzeAll(){
    await promise(analyze);
    await promise(rec_submit);
}

    //録音ファイルを選択して韻律制御

    // load waw file
    let file = document.getElementById('rec_file');
    if (window.File && window.FileReader && window.FileList) {
      function loadWavFile(e) {
          console.dir(e);
        let waveFile = e.target.files[0];
        console.log(e.target.files[0].name);
        reader = new FileReader();
        reader.readAsArrayBuffer(waveFile);
        window.rec_flag = false;
      }
      file.addEventListener('change', loadWavFile, false);
    } else {
      file.style.display = 'none';
      result.innerHTML = 'File APIを使用することが出来ません，対応ブラウザでご確認ください．';
    }
});

</script>
<style>
    #rec-main-box{
        display: flex;
    }
</style>
</recording>
