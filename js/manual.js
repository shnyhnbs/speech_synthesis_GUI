
//lf0 mdur -> lf0のモーラ平均をrangeで出力
function displayMlf0(lf0, dur, plab){

    //無声区間を補完
    let lf0i = LF0Interinterpolate(lf0);

    //モーラ平均を求める
    let mdur = mkMora_dur(plab, dur);
    let mlf0 = mora_avg(lf0i, mdur);

    //バー表示
    loadMlf0(mlf0);

    return 0;
}

function loadMlf0(syn_lf0){
    resetBar();

    for(let i = 0; i < syn_lf0.length; i++){
        mkBar(i, syn_lf0[i], 'tmp');
    }
    return 0;
}

function resetBar(){
    $('#lf0Bar').empty();
}

function mkBar(num, value, mora){
    $(  '<input type="range" id="slider"' +
        'number=' + num +
        ' mora=' + mora +
        ' value=' + value +
        ' data-default=' + value +
        ' min="0" max="10" step="any">'
    ).appendTo('div#lf0Bar')
}

function getManual(){
    let length = document.querySelectorAll("#slider").length;
    let mod_mlf0 = new Float32Array(length);

    //値を直接出力
    //for(let i = 0; i < length; i++){
    //    mod_mlf0[i] = document.querySelectorAll("#slider")[i].value;
    //}

    //初期値との差分を出力
    for(let i = 0; i < length; i++){
        mod_mlf0[i] = document.querySelectorAll("#slider")[i].value - document.querySelectorAll("#slider")[i].dataset.default;
    }

    console.log(mod_mlf0);
    return mod_mlf0;
}

function mkMflabWithManual(plab, flab, syn_dur, synLf0, recf0, rec_mdur){

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


    //手修正を結果を利用

    let manual_mlf0 = new Float32Array(std_mlf0.length);
    let tmp_manual_mlf0 = getManual();

    for(let i = 0; i < std_mlf0.length; i++){
        manual_mlf0[i] = std_mlf0[i] + tmp_manual_mlf0[i];
    }

    //flab -> mkMflab
    let mflab = flab2mflab(flab, manual_mlf0, syn_mdur);

    return mflab;
}
