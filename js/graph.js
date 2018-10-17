/*
    function displaySP(){
    console.log("displaySP")
  //make Multi-dimensional array
    let y = 1024 / 2 + 1;
    let ary = parameters.sp;
    let idx = 0;
    let data = [];
    let length = ary.length;
    let max_value = ary[0];

    for (var i = 0; i < ary.length; i++) {
        max_value = Math.max(max_value, ary[i]);
    }

    console.log(max_value);

    for (let i=0;i<parameters.f0.length;i++){
        for(let j=0;j<y;j++){
            let tmp_ary =[i, j, 20 * Math.LOG10E * Math.log(ary[idx]/max_value)];
            data.push(tmp_ary);
            idx++;
        }
    }

  Highcharts.chart('container',{

    chart: {
        type: 'heatmap',
        marginTop: 60,
        marginBottom: 60
    },
    title: {
        text: ''
    },
    xAxis:{
        title:{
        text: 'time [s]',
        style: {
            fontSize: '18px'
        }
    },
        tickInterval: 100,
        labels: { //目盛りの数値の設定
            formatter: function () {
            return Highcharts.numberFormat(this.value * 0.005, 1, '.', ',')

        },
        style: {
            fontSize: '16px'
        }
      }
    },
    yAxis:{
        title:{
            text: 'frequency [Hz]',
            style: {
                fontSize: '18px'
            }
        },
        tickInterval: y/8,
        labels: { //目盛りの数値の設定
            formatter: function () {
            return this.value / y * 8000;
        },
        style: {
            fontSize: '16px'
        }
      }

    },
    boost: {
        useGPUTranslations: true
    },

    colorAxis: {
        stops: [
            [0, '#ffffff'],
            [1, '#ff0000']
        ],
//            min: -100,
//            max: 0,
        startOnTick: false,
        endOnTick: false
    },

    legend: {
        align: 'right',
        layout: 'vertical',
        margin: 0,
        verticalAlign: 'top',
        y: 25,
        symbolHeight: 320,
        enabled:false
    },

    series: [{
        data:data,
        turboThreshold: Number.MAX_VALUE // #3404, remove after 4.0.5 release
    }]

});


}


let displayWAVE = () => {
  Highcharts.chart('container', {
    chart: {
      zoomType: 'x',
      marginTop: 10,
      marginBottom: 10,
      marginLeft:10
    },
    xAxis:{
        gridLineWidth: 1,
      title:{
      text: 'time [s]',
      style: {
          fontSize: '18px'
      }
    },
      tickInterval: 8000, //worldParameters.fs/2,
      labels: { //目盛りの数値の設定
        formatter: function () {
            if(this.value == 0){
                return 0;
            }
            //return Highcharts.numberFormat(this.value / worldParameters.fs, 1, '.', ',');
            return Highcharts.numberFormat(this.value / 16000, 1, '.', ',');

    },
    style: {
        fontSize: '18px'
    }
      }
    },
    yAxis:{
        max:1,
        min:-1,
      title:{
        text:''
    },
    labels:{
        style: {
            fontSize: '18px'
        }
    }
    },
    title: {
      text: ''
    },
    legend: {
      enabled: false,
    },
    series: [{
      name: 'wave',
      data: parameters,
      type: 'spline'
    }]
  });
}

*/

var pre_lf0 //一つ前のlf0

function displayLF0(lf0, mdur, mora){

    if(manual_bool == false && speech_bool == false){
        pre_lf0 = null;
    }

    //get max and min
    let max = 7;
    let min = 5;

    for(let i = 0; i < lf0.length; i++){
        max = lf0[i] > max ? lf0[i] : max;
        min = ( lf0[i] >0 && lf0[i] < min) ? lf0[i] : min;
    }
    console.log(min,max);

    window.options = {
    chart: {
      zoomType: 'x',
      marginTop: 30,
      marginBottom: 60,
    },
    xAxis:{
        gridLineWidth: 1,
        title:{
            text: 'time [s]',
            style: {
                fontSize: '18px'
            }
        },
        plotBands:[{
            from:100,
            to:200,
            color:'#00FF00'
        }],

        tickInterval: 200, //worldParameters.fs/2,
        gridLineWidth: 0, //目盛りの線を非表示
        labels: { //目盛りの数値の設定
            formatter: function () {
                if(this.value == 0){
                    return 0;
                }
                //return Highcharts.numberFormat(this.value / worldParameters.fs, 1, '.', ',');
                return Highcharts.numberFormat( this.value / 200, 1, '.', ',');
            },
            style: {
                fontSize: '18px'
            }
        }
    },
    yAxis:{
        max:max,
        min:min,
      title:{
        text:''
    },
    labels:{
        style: {
            fontSize: '18px'
        }
    }
    },
    title: {
      text: ''
    },
    legend: {
      enabled: false,
    },
    series: [{
      name: 'wave',
      data: pre_lf0,
      type: 'spline',
      color: 'rgba(0,0,255,1)'
    },
    {
      name: 'wave',
      data: lf0,
      type: 'spline',
      color: 'rgba(255,0,0,1)'
    }],
    tooltip:{
        enabled: false
    },
    exporting:{
      enabled: false,
    },
    credits: {
        enabled: false
    }
  };

  let currnt_frame = 0

  for (let i = 0; i < mdur.length; i++){
      options.xAxis.plotBands.push({
          from: currnt_frame,
          to: currnt_frame + mdur[i],
          color: i % 2 == 0 ? '#FFFFFF' : '#E0E0E0',
          label: {
              text: mora[i],
              y:    -5
          }
      })
      currnt_frame = currnt_frame + mdur[i];
  }

  window.lf0_graph = Highcharts.chart('graph_container',options);

  pre_lf0 = lf0;

}
