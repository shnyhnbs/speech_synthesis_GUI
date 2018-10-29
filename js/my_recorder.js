
var rec_worldParameters;
var rec_output;
var rec_source;
var rec_out_buffer;

function startUserMedia(stream){

  var source = recContext.createMediaStreamSource(stream);
  recorder = new Recorder (source);
}

function record(){
  console.log(recorder)
  recorder && recorder.record();
  console.log("recording")
  //GUI log
  $('#status').html("録音中・・・");

}


function stop(){
  recorder && recorder.stop();
  console.log("stopped");
  window.rec_flag = true;
  //GUI log
  $('#status').html("録音完了");

//  createDownloadLink();
//  downSampling();
}

//buffer(バイナリ)で受け取る
function analyzeWav(buffer){
        rec_wav = new Uint8Array(buffer);
        let wavParameters = SPTK.SPTKWeb.GetWavParameter(rec_wav);

        if (wavParameters.fs !== 16000 || wavParameters.nbit !== 16) {
          console.error('Not supported format');
          return;
        }

          let x_world = SPTK.SPTKWeb.GetWavFormForWorld(rec_wav, wavParameters.samples);
          rec_worldParameters = SPTK.SPTKWeb.GetSpeechFeaturesAsync(x_world, wavParameters.fs);
}

function rec2mlf0(plab, flab, syn_dur, synLf0, recf0, rec_mdur){

    //recf0 -> recLf0
    let recLf0 = new Float32Array(recf0.length);
    let shift_recLf0i = new Float32Array(recf0.length);
    let synLf0i = new Float32Array(synLf0.length);

    for(let i = 0; i < recf0.length; i++){
        recLf0[i] = recf0[i] > 0 ? Math.log(recf0[i]) : -1e+10;
    }


    //録音音声の平均を合成音声と等しくなるようにシフト
    let shift_recLf0 = shift_lf0(synLf0, recLf0);

    //それぞれ無声区間を補完
    shift_recLf0i = LF0Interinterpolate(shift_recLf0);
    synLf0i = LF0Interinterpolate(synLf0);

    //plab + dur -> mdur
    //synLf0 + mdur -> mlf0
    let syn_mdur = mkMora_dur(plab, syn_dur);
    let syn_mlf0 = mora_avg(synLf0i, syn_mdur);

    //recLf0 + 録音音声のmdur -> rec_mlf0
    let rec_mlf0 = mora_avg(shift_recLf0i, rec_mdur);

    //モーラごとの差分
    let diff_mlf0 = new Float32Array(syn_mlf0.length);

    for(let i = 0; i < syn_mlf0.length; i++){
        diff_mlf0[i] = syn_mlf0[i] > 0 ? rec_mlf0[i] - syn_mlf0[i] : 0;
    }

    //平均0分散1に標準化
    let std_mlf0 = standardization(diff_mlf0);
    //let std_mlf0 = diff_mlf0;

    mod_parameters.mlf0 = std_mlf0;

    return 0;
}


// synthesize wav
function rec_synthesizeWav(rec_param){
  var p1 = new Promise(function(resolve, reject){
    rec_source = window.ana_recContext.createBufferSource();
    rec_output = SPTK.SPTKWeb.GetSynthesisForm(rec_param);
    resolve("Success!");
  }).then(()=>{
    rec_out_buffer = rec_output;
  }).then (() =>{
    console.dir(out_buffer);
    var myArrayBuffer = window.ana_recContext.createBuffer(1, rec_out_buffer.wav_length, 16000);
    var nowBuffering = myArrayBuffer.getChannelData(0);

    for (var i = 0; i < rec_out_buffer.wav_length; i++) {
      nowBuffering[i] = rec_out_buffer.wav[i];
    };

    rec_source.buffer = myArrayBuffer;
    rec_source.connect(window.ana_recContext.destination);
    rec_source.loop = false;
  }).then(()=>{
    console.log("resynthesis");
   });
};

function play (){
    console.log(this.rec_output);
    window.parameters.graphParamaters.next({is_initialize: true, data: rec_worldParameters.f0});
    rec_source.start(0);
}

function createDownloadLink()
	{
		recorder && recorder.exportWAV(function(blob) {
      console.log("a");
			var url = URL.createObjectURL(blob);
			var li = document.createElement('li');
			var au = document.createElement('audio');
			var hf = document.createElement('a');

			au.controls = true;
			au.src = url;
			hf.href = url;
			hf.download = new Date().toISOString() + '.wav';
			hf.innerHTML = hf.download;
			li.appendChild(au);
			li.appendChild(hf);
			recordingslist.appendChild(li);
		});
	}


window.onload = function(){

  navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
  			__log('No live audio input: ' + e);
  		});
}
