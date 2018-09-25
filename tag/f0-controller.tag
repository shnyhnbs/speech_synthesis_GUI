<f0-controller>
    <div id="graph_container" style="width: 100%; height: 400px; overflow-x: scroll">
        <div id="canvas_container" style="width: 100%; height: 90%; padding-right: 16px; padding-left: 38px;" >
            <canvas id="lineChart" style="cursor: {isEditMode ? 'pointer': 'default' }; width: 100%; height: 100%;"></canvas>
        </div>
        <div id="button-container-f0" style="display:none" >
            <button class="waves-effect waves-light btn" onclick={resynthesis} style="font-size:16px;"><i class="material-icons left"></i>F0修正</a>
        </div>
    </div>

    <script>

//    isEditMode = false;
//    isEditMode = true;
    this.myBar = undefined;
    this.currentLabel = [];
    let self = this;

    resynthesis() {
        let f0 = new Array(this.myBar.data.datasets[1].data.length);
        console.log(f0)

        this.myBar.data.datasets[1].data.forEach((value, idx) => {
            f0[idx] = value.y // > 0 ? Math.log(value.y) : -1e+10;
        })

        window.playAudio.audioLF0.next({is_initialize: false, data: f0});
    }

    function generateDataSets(f0_array)
    {
        let value_dict_array_base = Array(f0_array.length);
        let value_dict_array_mod = Array(f0_array.length);

//        let expConverter = (value) => {
//            return value > 0 ? Math.exp(value) : 0.0;
//        }

        f0_array.forEach((value, index) => {
            value_dict_array_base[index] = {x: index, y: value};
            value_dict_array_mod[index] = {x: index, y: value};
        });

        return [
            {
                type: 'line',
                label: 'base_f0',
                borderColor : "rgba(254,97,132,0.8)",
                //pointBackgroundColor    : "rgba(254,97,132,0.8)",
                fill: false,
                data: value_dict_array_base,
                yAxisID: "base_f0",
            },
            {
                type: 'line',
                label: 'modify_f0',
                borderColor: "rgba(10,97,132,0.8)",
                //pointBackgroundColor: "rgba(10,97,132,0.8)",
                fill: false,
                data: value_dict_array_mod,
                yAxisID: "modify_f0",
            }
        ];
    }

    function generateLabels()
    {
        let org = window.playAudio.defaultContext;
        let mora_idx_array = [];

        let mora_start_idx = 0;
        let before_a = 'A:xx+xx+xx'; // sil
        let before_f = 'F:xx_xx#xx_xx@xx_xx|xx_xx'; // sil
        for (let i = 0; i < org.length; i++) {
            let spl = org[i].split(' ')[2].split('/');
            let a = spl[1];
            let f = spl[6];

            if (a == before_a && f == before_f) continue;

            mora_idx_array.push({begin: mora_start_idx, end: i - 1});
            mora_start_idx = i;
            before_a = a;
            before_f = f;
        }

        mora_idx_array.push({begin: mora_start_idx, end: mora_start_idx});

        let result = Array(Math.floor(parseInt(org[org.length - 1].split(' ')[1]) / 50000) - 1);

        mora_idx_array.forEach((value, idx) => {
            let tmp = [];
            let start_idx = 0;
            let end_idx = 0;
            for (let i = value.begin; i <= value.end; i++) {
                if (i == value.begin) {
                    start_idx = Math.floor(parseInt(org[i].split(' ')[0]) / 50000);
                    result[start_idx] = '_';
                }
                if (i == value.end) {
                    end_idx = Math.floor(parseInt(org[i].split(' ')[1]) / 50000);
                    result[Math.floor(parseInt(org[i].split(' ')[1]) / 50000)] = '_';
                }
                tmp.push(org[i].split(' ')[2].split('/')[0].match(/.*-(.*)\+.*/)[1]);
            }
            result[Math.floor(end_idx - (end_idx - start_idx) / 2)] = tmp.join(' ');
        });

        return result;
    }

    function getMoraDevidedColorGrid(label)
    {
        return label.map((value, idx, arr) => {
            return value == '_' ? 'black' : 'white';
        });
    }

    function displayLineChart(labels, datasets) {
        let barChartData = {
            labels: labels,
            datasets: datasets
        };

        let complexChartOption =
        {
            elements: { point: { radius: 0, hitRadius: 0, hoverRadius: 0 } },
            responsive: false,
            maintainAspectRatio: false,
            legend: {
                labels:{
                    fontSize:18
                }
            },
            scales:
            {
                xAxes: [
                    {
                        type: 'linear',
                        position: 'bottom',
                        gridLines:{
                            zeroLineColor:'rgba(0, 0, 0)',
                            color:'rgba(0, 0, 0, 0.3)',
                            zeroLineWidth:2,
                            drawBorder:false
                        },
                        ticks:
                        {
//                            callback: function (value, index) {
//                                return ( (value % 100) == 0 ? (value / 200) : '');
//                            }, // per 200ms (5 is frame shift... do parameter modify interface)

                            callback: function (value, index) {
                                if(value == 0){
                                    return 0;
                                }
                                else if ((value%100) == 0){
                                    return Highcharts.numberFormat(value/200, 1, '.', ',')
                                }
                                else{
                                    return "";
                                }
                            }, // per 200ms (5 is frame shift... do parameter modify interface)

                            min: 0,
                            max: datasets[0].data.length,
                            stepSize: 100, // per 10ms
                            autoSkip: false,
                            fontSize:18
                        },
                        labels: { //目盛りの数値の設定
                            formatter: function () {
                                return value / 200;
                            }
                        },
                        spanGaps: false,
                        scaleLabel: {                 //軸ラベル設定
                           display: true,             //表示設定
                           labelString: 'time [s]',  //ラベル
                           fontSize: 18
                       }
                   }
                ],
                yAxes: [
                    {
                        scaleLabel: {                 //軸ラベル設定
                            display: true,             //表示設定
                            labelString: 'F0 [Hz]',  //ラベル
                            fontSize: 18
                     },
                        id: "base_f0",
                        type: "linear",
                        position: "left",
                        gridLines:{
                            zeroLineColor:'rgba(0, 0, 0)',
                            color:'rgba(0, 0, 0, 0.3)',
                            zeroLineWidth:2
                        },
                        ticks:
                        {
                            max: 800,
                            min: 0,
                            stepSize: 100,
                            fontSize: 18
                        }
                    },
                    {
                        id: "modify_f0",
                        type: "linear",
                        gridLines:{
                            zeroLineColor:'rgba(0, 0, 0)',
                            color:'rgba(0, 0, 0, 0.3)',
                            zeroLineWidth:2
                        },
                        display: false,
                        ticks:
                        {
                            max: 800,
                            min: 0,
                            stepSize: 100
                        }
                    }

                ],
            },
            tooltips :
            {
                enabled: false
            },
            hover:
            {
                mode: 'x',
                intersect: false,
                onHover: function(event) {
                    /* it will {"", "default", "pointer"} */
                    let current_cursor = document.getElementById("lineChart").style.cursor;

                    if (current_cursor === "default" || current_cursor === "") {
                        return;
                    }

                    //console.log('Hover');

                    var relative_pos = Chart.helpers.getRelativePosition(event, self.myBar.chart);
                    //console.log("RelativePos");
                    //console.dir(relative_pos);
                    /* ticksは自分で設定したほうがいい */
                    var base_scale = (self.myBar.config.options.scales.yAxes[0].ticks.max - self.myBar.config.options.scales.yAxes[0].ticks.min);
                    /* 0ベースじゃないとヤバイ？ */
                    // var base_scale = (self.myBar.scales['base_f0'].max - self.myBar.scales['base_f0'].min);
                    //console.log("BaseScale");
                    //console.dir(base_scale);

                    var chartarea_height = self.myBar.chartArea.bottom - self.myBar.chartArea.top;
                    //console.log("ChartAreaHeight => bottom - top");
                    //console.dir(self.myBar.chartArea);

                    // var new_value = base_scale - base_scale / chartarea_height * (relative_pos.y - self.myBar.chartArea.top);
                    var new_value = self.myBar.config.options.scales.yAxes[0].ticks.max - base_scale / chartarea_height * (relative_pos.y - self.myBar.chartArea.top);

                    /* safe guard for minimum value */
                    if (new_value <= self.myBar.config.options.scales.yAxes[0].ticks.min || new_value == NaN) {
                        console.log("Cannot voiced area change to 0");
                        return;
                    }
                    /* safe guard for maximum value */
                    if (new_value > self.myBar.config.options.scales.yAxes[0].ticks.max) {
                        console.log("Cannot set value over range");
                        return;
                    }

                    // console.dir(relative_pos);
                    var target_indexs = self.myBar.getElementsAtXAxis(event);

                    let target_data = self.myBar.data.datasets.find((elm, idx, arr) => {
                        return elm.label === 'modify_f0';
                    }).data;

                    if (target_data[target_indexs[0]._index].y < self.myBar.config.options.scales.yAxes[0].ticks.min || target_data[target_indexs[0]._index].y > self.myBar.scales['base_f0'].max) {
                        console.log('Cannot unvoiced area change to voiced');
                        return;
                    }

                    //console.dir(new_value);
                    target_data[target_indexs[0]._index].y = new_value;

                    clearTimeout(updateQueue);
                    updateQueue = setTimeout(() => {
                        self.myBar.update();
                    }, 50);
                }
            },
        };

        let updateQueue;
        self.root.addEventListener('resize', () => {
            clearTimeout(resizeQueue);
            resizeQueue = setTimeout(() => {
                if (self.myBar != undefined)
                    self.myBar.resize();
            }, 200);
        }, false);

        ctx = self.root.querySelector("#lineChart").getContext("2d");

        if (self.myBar !== undefined) {
            self.myBar.destroy();
        }
        console.dir(complexChartOption);
        self.myBar = new Chart(ctx, {
            type: 'bar',
            data: barChartData,
            options: complexChartOption,
            pointDot: false
        });
    }

    let resizeQueue;
    window.addEventListener('resize', () => {
        clearTimeout(resizeQueue);
        resizeQueue = setTimeout(() => {
            if (self.myBar != undefined)
                self.myBar.resize();
        }, 200);
    }, false);

    this.root.addEventListener('resize', () => {
        clearTimeout(resizeQueue);
        resizeQueue = setTimeout(() => {
            if (self.myBar != undefined)
                self.myBar.resize();
        }, 200);
    }, false);

    function valueJudgeAndScaling(event)
    {
        console.log('Judge');
        let relative_pos = Chart.helpers.getRelativePosition(event, self.myBar.chart);
        let base_scale = (self.myBar.config.options.scales.yAxes[0].ticks.max - self.myBar.config.options.scales.yAxes[0].ticks.min);

        let chartarea_height = self.myBar.chartArea.bottom - self.myBar.chartArea.top;

        let new_value = self.myBar.config.options.scales.yAxes[0].ticks.max - base_scale / chartarea_height * (relative_pos.y - self.myBar.chartArea.top);
        console.log(new_value);

        /* safe guard for minimum value */
        if (new_value <= self.myBar.config.options.scales.yAxes[0].ticks.min || new_value == NaN) {
            console.log("Cannot voiced area change to 0");
            return;
        }
        /* safe guard for maximum value */
        if (new_value > self.myBar.config.options.scales.yAxes[0].ticks.max) {
            console.log("Cannot set value over range");
            return;
        }

        let aaa = self.myBar.getElementsAtXAxis(event);
        let target_indexs = self.myBar.getElementsAtXAxis(event)[0]._index; // tick: 2 => label の 2倍の値を取る
        console.log('Target F0 index', target_indexs);
        console.dir(self.currentLabel);
        let target_data = self.myBar.data.datasets.find((elm, idx, arr) => {
            return elm.label === 'modify_f0';
        }).data;
        console.dir(target_data);

        let last_idx = 0; // label
        let begin_idx = 0; // label
        if (self.currentLabel[target_indexs] == '_') {
            last_idx = target_indexs;
        } else {
            last_idx = self.currentLabel.indexOf('_', target_indexs);
        }
        for (let i = last_idx - 1; i >= 0; i--) {
            if (self.currentLabel[i] == '_') {
                begin_idx = i + 1;
                break;
            }
        }
        console.log(begin_idx, last_idx);

        if (target_data[target_indexs].y < self.myBar.config.options.scales.yAxes[0].ticks.min || target_data[target_indexs].y > self.myBar.scales['base_f0'].max) {
            console.log('Cannot unvoiced area change to voiced');
            return;
        }

        let diff_log = Math.log(new_value) - Math.log(target_data[target_indexs].y);
        let min_ = self.myBar.config.options.scales.yAxes[0].ticks.min;
        let max_ = self.myBar.config.options.scales.yAxes[0].ticks.max;

        for (let i = begin_idx; i <= last_idx; i++) {
            let val = target_data[i].y;
            if (val < min_ || val > max_) continue;
            let tmp = Math.exp(Math.log(val) + diff_log);
            if (tmp < 0) continue;
            target_data[i].y = tmp;
        }
        self.myBar.update();
    }


    function my_init()
    {
        self.root.querySelector('#lineChart').addEventListener('click', (e) => {
            //isEditMode = !isEditMode;
            self.update();

            if (self.myBar == undefined) return;
            new Promise((resolve) =>{
              valueJudgeAndScaling(e);
              resolve()
            }).then(()=>{
            //  resynthesis();
            })
        });

        Chart.defaults.global.animation.duration = 100;
    };

    this.on('mount', () => {
        my_init();

        window.playAudio.audioLF0.subscribe(
            (value) => {
                if (!value.is_initialize) return;
  //              this.currentLabel = generateLabels();
//  　　　　　　　　 this.currentLabel=[value.data.length]
//  　　　　　　　　　this.currentLabel[value.data.length - 1 ]='_'

                this.currentLabel[value.data.length - 1]='_'
                displayLineChart(this.currentLabel, generateDataSets(value.data));
                document.getElementById("button-container-f0").style.display="";
                this.update();
                if (self.myBar != undefined)
                    self.myBar.resize();
            }
        );
    });
    </script>
</f0-controller>
