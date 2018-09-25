
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
