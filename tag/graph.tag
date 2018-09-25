<graph>
    <div>
        <button id="sp" class="button">LF0</button>
        <div id="container" style="height: 280px;"> </div>
    </div>

<script>

var input;

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
      marginTop: 60,
      marginBottom: 60,
      marginLeft:100
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

let displayLF0 = (f0) => {
    let lf0 = new Array(f0.length);

    for(let i = 0; i < f0.length; i++){
        lf0[i] = f0[i] > 0 ? Math.log(f0[i]) : -1e+10;
    }

  Highcharts.chart('container', {
    chart: {
      zoomType: 'x',
      marginTop: 60,
      marginBottom: 60,
      marginLeft:100
    },
    xAxis:{
        gridLineWidth: 1,
      title:{
      text: 'time [s]',
      style: {
          fontSize: '18px'
      }
    },
      tickInterval: 200, //worldParameters.fs/2,
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
        max:6,
        min:4,
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
      data: lf0,
      type: 'spline'
    }]
  });
}


this.on('mount', () => {

    window.parameters.graphParamaters.subscribe(
    (value) => {
        if (!value.is_initialize) return;
        input = value.data;

    });

    document.getElementById('sp').onclick = function (){
        console.log('clicked');
        displayLF0(input);
    }
});

</script>
</graph>
