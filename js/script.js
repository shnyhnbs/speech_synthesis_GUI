'use strict';

var webdnn_runner_dur = null;
var webdnn_input_view_dur, webdnn_output_view_dur;

var webdnn_runner_feats = null;
var webdnn_input_view_feats, webdnn_output_view_feats;

var webdnn_runner_uv = null;
var webdnn_input_view_uv, webdnn_output_view_uv;

var webdnn_runner_diff = null;
var webdnn_input_view_diff, webdnn_output_view_diff;

// This function is called when the page is loaded
// この関数は、ページがロードされた時に実行されます
async function initialize() {
  console.log('Beginning of initialize()');
  // Load WebDNN model
  // WebDNNモデルをロードします
  webdnn_runner_dur = await WebDNN.load('./model/std/model_dur');
  webdnn_runner_feats = await WebDNN.load('./model/std/model_feats');
  webdnn_runner_uv = await WebDNN.load('./model/std/model_uv');
  webdnn_runner_diff = await WebDNN.load('./model/diff/model_diff');
  // Get view object for input / output variable of the model
  // There can be multiple variables for input / output, but there is only one for this model
  // モデルの入出力変数に対するビューを取得します
  // 入出力に対して複数の変数を持つことができますが、このモデルでは1つだけです
  webdnn_input_view_dur = webdnn_runner_dur.getInputViews()[0];
  webdnn_output_view_dur = webdnn_runner_dur.getOutputViews()[0];

  webdnn_input_view_feats = webdnn_runner_feats.getInputViews()[0];
  webdnn_output_view_feats = webdnn_runner_feats.getOutputViews()[0];

  webdnn_input_view_uv = webdnn_runner_uv.getInputViews()[0];
  webdnn_output_view_uv = webdnn_runner_uv.getOutputViews()[0];

  webdnn_input_view_diff = webdnn_runner_diff.getInputViews()[0];
  webdnn_output_view_diff = webdnn_runner_diff.getOutputViews()[0];

  console.log('End of initialize()');
}

async function calculate_dur(input) {
    console.log('Beginning of calculate_dur()');

    let inDim = 413; //引数で渡したい
    let outDim = 1;
    let frame = input.length/inDim;
    let featDim = outDim * frame;

    let tmp = new Float32Array(featDim);

    for (let i = 0; i < frame; i++)
    {
        webdnn_input_view_dur.set(input.slice(i * inDim, (i + 1) * inDim));
        await webdnn_runner_dur.run();
        tmp.set(webdnn_output_view_dur.toActual(), i );

    }
    parameters.dur = vscale(tmp, "dur", featDim);
    console.log('End of calculate_dur()');
    return(parameters.dur);
}

async function calculate_feats(input) {
    console.log('Beginning of calculate_feats()');

    let inDim = 414; //引数で渡したい
    let outDim = 138;
    parameters.frame = input.length / inDim;
    let featDim = outDim * parameters.frame;

    let output = new Float32Array(featDim);
    let tmp = new Float32Array(featDim);
    let uv = [];

    for (let i = 0; i < parameters.frame; i++)
    {
        webdnn_input_view_feats.set(input.slice(i * inDim, (i + 1) * inDim));
        await webdnn_runner_feats.run();
        tmp.set(webdnn_output_view_feats.toActual(), i * outDim);

        webdnn_input_view_uv.set(input.slice(i * inDim, (i + 1) * inDim));
        await webdnn_runner_uv.run();
        uv.push(webdnn_output_view_uv.toActual().indexOf(Math.max.apply(null,webdnn_output_view_uv.toActual())));

    }
    parameters.feats = vscale(tmp, "feats", featDim);
    parameters.uv = uv;
//    console.dir(uv);
    console.log('End of calculate_feats()');
    return(parameters.feats);
}

async function calculate_diff(input) {
    console.log('Beginning of calculate_diff()');

    let inDim = 417; //引数で渡したい
    let outDim = 138;
    parameters.frame = input.length / inDim;
    let featDim = outDim * parameters.frame;

    let output = new Float32Array(featDim);
    let tmp = new Float32Array(featDim);

    for (let i = 0; i < parameters.frame; i++)
    {
        webdnn_input_view_diff.set(input.slice(i * inDim, (i + 1) * inDim));
        await webdnn_runner_diff.run();
        tmp.set(webdnn_output_view_diff.toActual(), i * outDim);

    }
    diff_parameters.feats = diff_vscale(tmp, "feats", featDim);
    console.log('End of calculate_feats()');
    return(diff_parameters.feats);
}

function vscale(scaled_arr, conv, featDim){
    console.log('Beginning of vscale()');
    let unscaled_arr = new Float32Array(featDim);
    let vlen = window.model.scale[conv].length / 2;
    for (let i = 0; i < featDim; i++){
        let index = i % vlen;
        unscaled_arr[i] = scaled_arr[i] * (window.model.scale[conv][index] - window.model.scale[conv][index + vlen]);
        unscaled_arr[i] += window.model.scale[conv][index + vlen];
    }
    return unscaled_arr;
}

//上と統合
function diff_vscale(scaled_arr, conv, featDim){
    console.log('Beginning of vscale()');
    let unscaled_arr = new Float32Array(featDim);
    let vlen = window.diff_model.scale[conv].length / 2;
    for (let i = 0; i < featDim; i++){
        let index = i % vlen;
        unscaled_arr[i] = scaled_arr[i] * (window.diff_model.scale[conv][index] - window.diff_model.scale[conv][index + vlen]);
        unscaled_arr[i] += window.diff_model.scale[conv][index + vlen];
    }
    return unscaled_arr;
}

function mkFlab(plab, dur){
    let indim = 413;
    let frame = 0;
    let currnt_frame = 0;

//継続長マイナスで不具合
/*
    //flabの長さを計算 音素継続長の和 * (indim + 1)
    for (let i = 0; i < dur.length; i++){
        frame += Math.floor(dur[i]);
    }
    let flab = new Float32Array((indim + 1) * frame);

    for (let i = 0; i < dur.length; i++){
        for(let j = 0; j < Math.floor(dur[i]); j++){

            //flab[0,414,...,currnt_frame * (indim + 1)]:モーラ内相対位置
            flab[currnt_frame * (indim + 1)] = (j / (Math.floor(dur[i]) - 1))

            //plab.slice(i * indim, (i + 1) * indim) 当該フレームのplab
            flab.set(plab.slice(i * indim, (i + 1) * indim), currnt_frame * (indim + 1) + 1);
            currnt_frame += 1;
        }
    }
    return flab;
}
*/

//flabの長さを計算 音素継続長の和 * (indim + 1)
for (let i = 0; i < dur.length; i++){
    if(dur[i] >= 0){
        frame += Math.floor(dur[i]);
    }
    else{
        frame += 5;
    }
}
let flab = new Float32Array((indim + 1) * frame);

for (let i = 0; i < dur.length; i++){
    if(dur[i] < 0){
        dur[i] = 5;
    }
    for(let j = 0; j < Math.floor(dur[i]); j++){

        //flab[0,414,...,currnt_frame * (indim + 1)]:モーラ内相対位置
        flab[currnt_frame * (indim + 1)] = (j / (Math.floor(dur[i]) - 1))

        //plab.slice(i * indim, (i + 1) * indim) 当該フレームのplab
        flab.set(plab.slice(i * indim, (i + 1) * indim), currnt_frame * (indim + 1) + 1);
        currnt_frame += 1;
    }
}
return flab;
}


//feats -> mcep, lf0, bap
function splitFeats(feats){
    console.log('Beginning of splitFeats()');
    let mcep_dim = 40;
    let lf0_dim = 1;
    let bap_dim = 5;
    let feats_dim = mcep_dim + lf0_dim + bap_dim;

    let mcepd = new Float32Array(mcep_dim * 3 * parameters.frame);
    let lf0d = new Float32Array(lf0_dim * 3 * parameters.frame);
    let bapd = new Float32Array(bap_dim * 3 * parameters.frame);

    let mcepv = new Float32Array(parameters.frame * mcep_dim * 6);
    let lf0v = new Float32Array(parameters.frame * lf0_dim * 6);
    let bapv = new Float32Array(parameters.frame * bap_dim * 6);

    for(let i = 0; i < parameters.frame; i++){
        mcepd.set(feats.slice(i * feats_dim * 3, (i * feats_dim + mcep_dim) * 3), i * mcep_dim * 3);
        lf0d.set(feats.slice((i * feats_dim + mcep_dim) * 3, (i * feats_dim + mcep_dim + lf0_dim) * 3), i * lf0_dim * 3);
        bapd.set(feats.slice((i * feats_dim + mcep_dim + lf0_dim) * 3, (i * feats_dim + mcep_dim + lf0_dim + bap_dim) * 3), i * bap_dim * 3);
    }

        mcepv = insVar(mcepd, window.model.vars.mcep, mcep_dim);
        lf0v = insVar(lf0d, window.model.vars.lf0, lf0_dim);
        bapv = insVar(bapd, window.model.vars.bap, bap_dim);

        parameters.lf0i = SPTK.SPTKWeb.SPTK_mlpg(lf0v, lf0_dim);
        parameters.mcep = SPTK.SPTKWeb.SPTK_mlpg(mcepv, mcep_dim);
        parameters.bap = SPTK.SPTKWeb.SPTK_mlpg(bapv, bap_dim);

        //もっといい方法を考える
        parameters.mcep_original = SPTK.SPTKWeb.SPTK_mlpg(mcepv, mcep_dim);


        if(vcomp_bool){
            parameters.mcep = vcomp(window.parameters.mcep, 40, window.model.vcomp.mcep);
        //    parameters.lf0i = vcomp(window.parameters.lf0i, 1, window.model.vcomp.lf0);
        }

        parameters.lf0 = applyuv(parameters.lf0i, parameters.uv);
        parameters.f0 = lf02f0(parameters.lf0);
        parameters.sp = SPTK.SPTKWeb.SPTK_mgc2sp(parameters.mcep, 1024);
        parameters.ap = SPTK.SPTKWeb.bap2ap(parameters.bap, 1024);

}

//diff_feats -> mcep, lf0, bap ToDo:上の関数と統合
function splitDiff(feats){
    console.log('Beginning of splitDiff()');
    let mcep_dim = 40;
    let lf0_dim = 1;
    let bap_dim = 5;
    let feats_dim = mcep_dim + lf0_dim + bap_dim;

    let mcepd = new Float32Array(mcep_dim * 3 * parameters.frame);
    let lf0d = new Float32Array(lf0_dim * 3 * parameters.frame);
    let bapd = new Float32Array(bap_dim * 3 * parameters.frame);

    let mcepv = new Float32Array(parameters.frame * mcep_dim * 6);
    let lf0v = new Float32Array(parameters.frame * lf0_dim * 6);
    let bapv = new Float32Array(parameters.frame * bap_dim * 6);

    for(let i = 0; i < parameters.frame; i++){
        mcepd.set(feats.slice(i * feats_dim * 3, (i * feats_dim + mcep_dim) * 3), i * mcep_dim * 3);
        lf0d.set(feats.slice((i * feats_dim + mcep_dim) * 3, (i * feats_dim + mcep_dim + lf0_dim) * 3), i * lf0_dim * 3);
        bapd.set(feats.slice((i * feats_dim + mcep_dim + lf0_dim) * 3, (i * feats_dim + mcep_dim + lf0_dim + bap_dim) * 3), i * bap_dim * 3);
    }


        mcepv = insVar(mcepd, window.diff_model.vars.mcep, mcep_dim);
        lf0v = insVar(lf0d, window.diff_model.vars.lf0, lf0_dim);
        bapv = insVar(bapd, window.diff_model.vars.bap, bap_dim);

        diff_parameters.lf0i = SPTK.SPTKWeb.SPTK_mlpg(lf0v, lf0_dim);
        diff_parameters.mcep = SPTK.SPTKWeb.SPTK_mlpg(mcepv, mcep_dim);
        diff_parameters.bap = SPTK.SPTKWeb.SPTK_mlpg(bapv, bap_dim);

        addDiffFeats()

        mod_parameters.lf0 = applyuv(mod_parameters.lf0i, parameters.uv);
        mod_parameters.f0 = lf02f0(mod_parameters.lf0);
        mod_parameters.sp = SPTK.SPTKWeb.SPTK_mgc2sp(mod_parameters.mcep, 1024);
        mod_parameters.ap = SPTK.SPTKWeb.bap2ap(mod_parameters.bap, 1024);

}

function addDiffFeats(){

    let mcep = new Float32Array(diff_parameters.mcep.length);
    let lf0i = new Float32Array(diff_parameters.lf0i.length);
    let bap = new Float32Array(diff_parameters.bap.length);

    for(let i = 0; i < mcep.length; i++){
        mcep[i] = parameters.mcep_original[i] + diff_parameters.mcep[i];
    }

    for(let i = 0; i < lf0i.length; i++){
        lf0i[i] = parameters.lf0i[i] + diff_parameters.lf0i[i];
    }

    for(let i = 0; i < bap.length; i++){
        bap[i] = parameters.bap[i] + diff_parameters.bap[i];
    }

    if(vcomp_bool){
        mcep = vcomp(mcep, 40, window.model.vcomp.mcep);
    }

    mod_parameters.mcep = mcep
    mod_parameters.lf0i = lf0i
    mod_parameters.bap = bap

}


//featd, vars -> featv
function insVar(featd, vars, dim){
    let tmp = new Float32Array(parameters.frame * dim * 6);
    for(let i = 0; i < parameters.frame; i++){
        tmp.set(featd.slice(i * dim * 3, (i + 1) * dim * 3), i * dim * 6);
        tmp.set(vars, i * dim * 6 + dim * 3);
    }
    return tmp;
}

function applyuv(lf0i, uv){
    console.log('Beginning of applyuv()');
    let lf0 = new Float32Array(lf0i.length);
    for(let i = 0; i < lf0i.length; i++){
        lf0[i] = uv[i] === 1 ? lf0i[i] : -1e+10;
    }
    return lf0;
}

function lf02f0(lf0){
    console.log('Beginning of lf02f0()');
    let f0 = new Float32Array(lf0.length);
    for(let i = 0; i < lf0.length; i++){
        f0[i] = lf0[i] > 0 ? Math.exp(lf0[i]) : 0;
    }
    return f0;
}

// synthesize wav
var synthesizeWav = function(param){
  var p1 = new Promise(function(resolve, reject){
    source = window.playAudio.context.createBufferSource();
    output = SPTK.SPTKWeb.GetSynthesisForm(param);
    resolve("Success!");
  }).then(()=>{
    out_buffer = output;
  }).then (() =>{
    let myArrayBuffer = window.playAudio.context.createBuffer(1,out_buffer.wav_length,16000);
    let nowBuffering = myArrayBuffer.getChannelData(0);

    for (let i = 0; i < out_buffer.wav_length; i++) {
      nowBuffering[i] = out_buffer.wav[i];
    };

    //ひとまずバッファーを保存
    addHistory(myArrayBuffer, 'wav');

    source.buffer = myArrayBuffer;

    source.connect(window.playAudio.context.destination);
    source.loop = false;
  }).then(()=>{
    console.log("resynthesis");
   });
};

function vcomp(feat, feat_dim, vcomp){
    let frame = feat.length / feat_dim;
    let mean = new Float32Array(feat_dim);
    let output = new Float32Array(feat);

    //各次元の平均を計算
    for (let i = 0; i < feat_dim; i++){
        mean[i] = 0;
        for (let j = 0; j < frame; j++){
            mean[i] += feat[feat_dim * j + i];
        }
        mean[i] = mean[i] / frame;
    }

    //各次元の平均を引く
    //差分に係数を掛けて平均を足す
    for (let i = 0; i < frame; i++){
        for (let j = 0; j < feat_dim; j++){
            output[i * feat_dim + j] = feat[i * feat_dim + j] - mean[j];
            output[i * feat_dim + j] = output[i * feat_dim + j] * vcomp[j] + mean[j];

        }
    }
    return output;
}

function mkMflab(plab, flab, syn_dur, synLf0, recf0, rec_mdur){

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

    //flab -> mkMflab
    let mflab = flab2mflab(flab, std_mlf0, syn_mdur);

    return mflab;
}

function flab2mflab(flab, std_mlf0, syn_mdur){

    let dim = 414; //あとで修正
    let frame = flab.length / dim;
    let currnt_frame = 0;

    let mflab = new Float32Array((dim + 3) * frame); //先行、当該、後続の差分F0コンテキスト付与

    //最初のモーラ
    let pre_mlf0 = std_mlf0[0];
    let current_mlf0 = std_mlf0[0];
    let next_mlf0 = std_mlf0[1];

    for(let j = 0; j < syn_mdur[0]; j++){
        mflab.set(flab.slice(currnt_frame * dim, (currnt_frame + 1) * dim), currnt_frame * (dim + 3));

        currnt_frame += 1;

        mflab[currnt_frame * (dim + 3) - 3] = pre_mlf0;
        mflab[currnt_frame * (dim + 3) - 2] = current_mlf0;
        mflab[currnt_frame * (dim + 3) - 1] = next_mlf0;

    }

    //ループ
    for (let i = 1; i < syn_mdur.length - 1; i++){

        pre_mlf0 = current_mlf0;
        current_mlf0 = next_mlf0;
        next_mlf0 = std_mlf0[i + 1];

        for(let j = 0; j < syn_mdur[i]; j++){
            mflab.set(flab.slice(currnt_frame * dim, (currnt_frame + 1) * dim), currnt_frame * (dim + 3));

            currnt_frame += 1;

            mflab[currnt_frame * (dim + 3) - 3] = pre_mlf0;
            mflab[currnt_frame * (dim + 3) - 2] = current_mlf0;
            mflab[currnt_frame * (dim + 3) - 1] = next_mlf0;

        }

    }

    //最後のモーラ
    for(let j = 0; j < syn_mdur[syn_mdur.length - 1]; j++){

        pre_mlf0 = current_mlf0;
        current_mlf0 = next_mlf0;//next_mlf0はそのまま

        mflab.set(flab.slice(currnt_frame * dim, (currnt_frame + 1) * dim), currnt_frame * (dim + 3));

        currnt_frame += 1;

        mflab[currnt_frame * (dim + 3) - 3] = pre_mlf0;
        mflab[currnt_frame * (dim + 3) - 2] = current_mlf0;
        mflab[currnt_frame * (dim + 3) - 1] = next_mlf0;
    }

    return mflab;

}

function standardization(array){

    let sum = 0;
    let sumsum = 0;
    let count = 0;

    //平均
    for(let i = 0; i < array.length; i++){
        if(array[i] != 0){
            sum += array[i];
            count++;
        }
    }

    let avg = sum / count;

    //分散
    for(let i = 0; i < array.length; i++){
        if(array[i] != 0){
            sumsum += Math.pow(array[i] - avg, 2);
        }
    }

    let varia = sumsum / count;

    //標準化
    let std_array = new Float32Array(array.length);

    for(let i = 0; i < array.length; i++){
        std_array[i] = array[i] != 0 ? (array[i] - avg) / Math.sqrt(varia) : 0;
    }

    return std_array;

}

//lf0 + mdur ->モーラごとのF0の平均
function mora_avg(lf0, mdur){

    let avg = new Float32Array(mdur.length)

    let sum = 0
    let count = 0
    let currnt_frame = 0

    for(let i = 0; i < mdur.length; i++){
        for(let j = 0; j < mdur[i]; j++){
            if(lf0[currnt_frame] > 0){
                sum += lf0[currnt_frame];
                count += 1;
                currnt_frame += 1;
            }else{
                currnt_frame += 1;
            }
        }
        if(count != 0){
            avg[i] = sum / count;
        }else{
            avg[i] = 0;
        }
        sum = 0;
        count = 0;
    }

    return avg;
}
//plab + dur -> mdur
function mkMora_dur(plab, dur){

    let dim = plab.length / dur.length; //413
    let mdur = [];

    let tmp_dur = 0;
    let i = 0;

    while (i < dur.length){
        if(plab[dim * i + 59] == 1 || plab[dim * i + 76] == 1){ //59 = C_single_mora, 76 = C_muon
            mdur.push(Math.floor(dur[i] + tmp_dur));
            tmp_dur = 0;
            i++;
        }else{
            tmp_dur += Math.floor(dur[i]);
            i++;
        }
    }
    return mdur;

}

//synLf0 + recLf0 -> shift_recLf0
function shift_lf0(synLf0, recLf0){

    let count = 0;
    let sum = 0;

    //合成音声のlf0の平均
    for(let i = 0; i < synLf0.length; i++){
        if(synLf0[i] > 0){
            sum += synLf0[i];
            count += 1;
        }
    }

    let synAvg = sum / count;


    count = 0;
    sum = 0;

    //録音音声のlf0の平均
    for(let i = 0; i < recLf0.length; i++){
        if(recLf0[i] > 0){
            sum += recLf0[i];
            count += 1;
        }
    }

    let recAvg = sum / count;

    let diffAvg = synAvg - recAvg;

    //録音音声のlf0シフト

    let shift_recLf0 =  new Float32Array(recLf0.length);

    for(let i = 0; i < recLf0.length; i++){
        if(recLf0[i] > 0){
            shift_recLf0[i] = recLf0[i] + diffAvg;
        }else{
            shift_recLf0[i] = -1e+10;
        }
    }

    return shift_recLf0;


}

//Lf0 interpolate
//lf0 -> lf0i
function LF0Interinterpolate(lf0){

    let lf0i = new Float32Array(lf0.length);
    let tmp = 1e-10;
    var flag = 0;

    //fill  head
    for(var i = 0; i < lf0.length; i++){
        if(lf0[i] >= 0){ //find the first non-negative value
            tmp = lf0[i];
            break;
        }
    }

    var mstart = i;
    for(let i = mstart - 1; i >= 0; i--){
        lf0i[i] = tmp; //fill unvoiced time at the head by the first non-negative value
    }

    //fill  tail
    for(var i = lf0.length - 1; i >= 0; i--){
        if(lf0[i] >= 0){ //find the first non-negative value
            tmp = lf0[i];
            break;
        }
    }

    var mend = i;
    for(let i = lf0.length - 1; i >= mend; i--){
        lf0i[i] = tmp; //fill unvoiced time at the tail by the last non-negative value
    }
    //fill middle(mstart to mend)
    	for(let i = mstart; i <= mend; i++){

            lf0i[i] = lf0[i]; //とりあえず代入

    		if(flag == 0 && lf0[i] < 0){
    			var istart = i;	//position to start interpolating
    			flag = 1;
    		}
    		else if(flag == 1 && lf0[i] >= 0){
    			flag = 0;
    			var iend = i-1;
    			for(let j = istart; j <= iend; j++){	//linear interpolation
    				//[istart-1](>=0) { [istart](<0) ... interpolate ... [iend](<0) } [iend+1](>=0)
    				lf0i[j] = (lf0[iend+1]-lf0[istart-1])*(j-(istart-1))/((iend+1)-(istart-1)) + lf0[istart-1];
    			}
    		}
        }
        return lf0i
}

function synthesizeWavWithUsersDuration(){

    if(window.vcomp_bool){ //一時的に分散補償off
        window.vcomp_bool = false;
        window.vcomp_bool_tmp = true;
    }

    //音声入力のdurを使ってFlabを作成
    let dur_input = mkFlab(window.parameters.lab.plab, window.rec_worldParameters.lab.phone_dur);

    calculate_feats(dur_input) //webdnn + unscaling
    .then(value=>{
        splitFeats(value);
    }).then(()=>{
        synthesizeWav(parameters);
    }).then(()=>{
        $('#status').html("合成完了");
        //        window.parameters.graphParamaters.next({is_initialize: true, data: out_buffer.wav});
    }).then(()=>{

    if(window.vcomp_bool_tmp){//一時的に分散補償offだったものを戻す
        window.vcomp_bool = true;
        window.vcomp_bool_tmp = false;
    }

    //mkMflab(plab, flab, syn_dur, synLf0, recf0, rec_mdur)
    mod_parameters.mflab = mkMflab(parameters.lab.plab, dur_input, window.rec_worldParameters.lab.phone_dur, parameters.lf0, window.rec_worldParameters.f0, window.rec_worldParameters.lab.mora_dur);
    }).then(()=>{
        calculate_diff(mod_parameters.mflab) //webdnn + unscaling
        .then(value=>{
            $('#status').html("合成中・・・");
            splitDiff(value);
        }).then(()=>{
            synthesizeWav(mod_parameters);
        }).then(()=>{
            //GUI log
            $('#status').html("合成完了");
        })
    })

}



//DownloadWave
function DownloadWave(e){
    let dataview = GetWaveFileFromBuffer(GetShortRangeFromAudioBuffer(output.wav));
    let blob = new Blob([dataview], { type: 'audio/wav' });

//    let buffer = new ArrayBuffer(parameters.sp.length * 4);
//    let view = new DataView(buffer);

//    for (let i = 0; i < parameters.sp.length; i++) {
//        let v = parameters.sp[i];
//        view.setFloat32(i * 4, v, true);
//    }
//    let blob = new Blob([view]);

    let url = window.URL.createObjectURL(blob);

    let a = document.createElement('a');
    document.body.appendChild(a);
    a.href = url;
    a.download = 'output.wav';
    a.click();
    document.body.removeChild(a);
}

//mcep, lf0, bap, durを一度に保存
function DownloadFeats (){

    SetDate();

    if(speech_bool){
        Save(mod_parameters.lf0, 'lf0', window.date);
        Save(mod_parameters.mcep, 'mcep', window.date);
        Save(mod_parameters.bap, 'bap', window.date);
    //    let dur = new Float32Array(rec_worldParameters.lab.phone_dur);
    //    Save(dur, 'dur', window.date);
        Save(parameters.dur, 'dur', window.date);
    }else{
        Save(parameters.lf0, 'lf0', window.date);
        Save(parameters.mcep, 'mcep', window.date);
        Save(parameters.bap, 'bap', window.date);
        Save(parameters.dur, 'dur', window.date);
    }
}

//data(配列), feat(拡張子), name(ファイル名) を入力
function Save(in_data, in_feat, in_name){
    event.preventDefault();

    let feat = in_feat;
    let name = in_name;
    let data = in_data;

    let JSONdata = {
        qtype: 'download',
        feat: feat,
        name: name,
        data: data
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

//consoleから特徴量をDLする用
//DownloadWave
function Download(feat){

    let buffer = new ArrayBuffer(feat.length * 4);
    let view = new DataView(buffer);

    for (let i = 0; i < feat.length; i++) {
        let v = feat[i];
        view.setFloat32(i * 4, v, true);
    }
    let blob = new Blob([view]);

    let url = window.URL.createObjectURL(blob);

    let a = document.createElement('a');
    document.body.appendChild(a);
    a.href = url;
    a.download = 'feat.dat';
    a.click();
    document.body.removeChild(a);
}

//window.dateを更新
function SetDate(){
    //日付を取得
    let DD = new Date();
    let Year = DD.getYear();
    let Month = DD.getMonth() + 1;
    let Day = DD.getDate();
    let Hours = DD.getHours();
    let Minutes = DD.getMinutes();
    let Seconds = DD.getSeconds();

    window.date = 1900 + Year + '-' + Month + '-' + Day + '-' + Hours + '-' + Minutes + '-' + Seconds;
    console.log(window.date);

}


//exportToWAVE
function GetWaveFileFromBuffer(wav_byte) {
    let writeChars = (buf, start, chars) => {
        for (let i = 0; i < chars.length; i++)
            buf.setUint8(start + i, chars.charCodeAt(i));
    }

    let buffer = new ArrayBuffer(44 + wav_byte.length * 2); // 16bit => 2byte
    let view = new DataView(buffer);

    writeChars(view, 0, 'RIFF');
    view.setUint32(4, 32 + wav_byte.length * 2, true);
    writeChars(view, 8, 'WAVE');
    writeChars(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 16000, true);
    view.setUint32(28, 16000 * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeChars(view, 36, 'data');
    view.setUint32(40, wav_byte.length * 2, true);

    for (let i = 0; i < wav_byte.length; i++) {
        let v = wav_byte[i] | 0;
        view.setInt16(44 + i * 2, v, true);
    }
    console.dir(buffer);
    return view;
}

function GetShortRangeFromAudioBuffer(buf) {
    for (let  i = 0; i < buf.length; i++)
        buf[i] = buf[i] > 0 ? buf[i] * 32767.0 : buf[i] * 32768.0;
    return buf;
}

window.addEventListener('load', function () {
  initialize().then(() => { }).catch((reason) => {
    console.error('Failed to initialize', reason);
  });
});

async function synthesis (plab){

    window.speech_bool = false;
    window.manual_bool = false;

    let feats;

    await calculate_dur(plab)
    .then((value) => {new Promise(function(resolve, reject){
                input = mkFlab(window.parameters.lab.plab, value);
                resolve();
            });
    })
    await calculate_feats(input)
    .then((value)=>{new Promise(function(resolve, reject){
                    splitFeats(value);
                    resolve();
                });
    })

    await new Promise(function(resolve, reject){
                synthesizeWav(parameters);
                resolve();
            });

    //displayMlf0(parameters.lf0, parameters.dur, parameters.lab.plab);

    addHistory(parameters.lf0, 'lf0');
    displayHistory();

    displayFlatMlf0(parameters.dur, parameters.lab.plab);
    displayLF0(syn_history.lf0, mkMora_dur(parameters.lab.plab, parameters.dur), parameters.lab.mora);

}

function resetHistory(){
    //それぞれ空にする
    window.syn_history.wav = [];
    window.syn_history.lf0 = [];
    $("#history-box").empty();
}
