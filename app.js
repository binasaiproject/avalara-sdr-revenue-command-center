// ===== TABS =====
const tabs=[
  {id:'overview',n:'01',l:'Command Overview'},
  {id:'pipeline',n:'02',l:'Pipeline Waterfall'},
  {id:'capacity',n:'03',l:'Capacity & Headcount'},
  {id:'recruiting',n:'04',l:'Recruiting & Onboarding'},
  {id:'org',n:'05',l:'Org & Succession'},
  {id:'competitive',n:'06',l:'Outreach & Competitive'},
  {id:'aiagents',n:'07',l:'AI Agents'},
  {id:'pnl',n:'08',l:'P&L & Revenue'},
  {id:'gamification',n:'09',l:'Gamification'},
  {id:'culture',n:'10',l:'Culture'}
];
const nav=document.getElementById('nav');
tabs.forEach((t,i)=>{
  const b=document.createElement('button');
  b.className='tab'+(i===0?' active':'');
  b.innerHTML='<span class="tnum">'+t.n+'</span>'+t.l;
  b.onclick=()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    document.getElementById(t.id).classList.add('active');
    window.scrollTo({top:0,behavior:'smooth'});
    // build charts for this tab, then resize so Chart.js picks up now-visible container dims
    requestAnimationFrame(()=>{
      if(charts[t.id])charts[t.id]();
      requestAnimationFrame(()=>{Object.values(Chart.instances||{}).forEach(c=>{try{c.resize()}catch(e){}});});
    });
  };
  nav.appendChild(b);
});

// ===== CHART DEFAULTS =====
Chart.defaults.font.family="'Archivo',sans-serif";
Chart.defaults.font.size=11;
Chart.defaults.color='#7C8190';
const ORANGE='#FF5A1F',ORANGE_D='#E8480F',BLUE='#2B3A8C',BLUE_B='#3D5AFE',INK='#16181D',GOOD='#1B9A6B',LINE='#E4E0D7';
const gridStyle={color:'rgba(228,224,215,.6)'};
const built={};
const chartReg=[];

function once(id,fn){if(built[id])return;built[id]=true;const c=fn();if(c)chartReg.push(c);}

const charts={
  overview(){
    once('chartSQL',()=>new Chart(document.getElementById('chartSQL'),{type:'bar',
      data:{labels:['Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8'],datasets:[
        {label:'Actual SQLs',data:[3120,3380,3610,3990,4150,4480,4690,4820],backgroundColor:ORANGE,borderRadius:5,order:2},
        {type:'line',label:'Capacity Plan',data:[3000,3300,3500,3850,4000,4300,4500,3950+870],borderColor:INK,borderWidth:2,borderDash:[5,4],pointRadius:0,tension:.3,order:1}
      ]},options:{maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{boxWidth:12,padding:14}}},scales:{y:{grid:gridStyle,beginAtZero:true},x:{grid:{display:false}}}}}));
    once('chartRegion',()=>new Chart(document.getElementById('chartRegion'),{type:'doughnut',
      data:{labels:['US','UK / EMEA','India'],datasets:[{data:[58,22,20],backgroundColor:[ORANGE,BLUE,BLUE_B],borderWidth:3,borderColor:'#fff'}]},
      options:{maintainAspectRatio:false,cutout:'62%',plugins:{legend:{position:'bottom',labels:{boxWidth:12,padding:12}}}}}));
  },
  pipeline(){
    once('chartMix',()=>new Chart(document.getElementById('chartMix'),{type:'bar',
      data:{labels:['Then','Now','Target'],datasets:[
        {label:'Inbound',data:[80,62,55],backgroundColor:BLUE,borderRadius:4,stack:'s'},
        {label:'Outbound',data:[20,38,45],backgroundColor:ORANGE,borderRadius:4,stack:'s'}
      ]},options:{maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{position:'bottom',labels:{boxWidth:12}}},scales:{x:{stacked:true,grid:gridStyle,max:100},y:{stacked:true,grid:{display:false}}}}}));
    once('chartConv',()=>new Chart(document.getElementById('chartConv'),{type:'line',
      data:{labels:['Q1','Q2','Q3','Q4','Q5','Q6'],datasets:[
        {label:'MQL→SAL',data:[55,57,59,60,61,62],borderColor:BLUE_B,backgroundColor:'transparent',tension:.35,borderWidth:2.5,pointRadius:3},
        {label:'SAL→SQL',data:[18,19,20,21,22,22.9],borderColor:ORANGE,backgroundColor:'transparent',tension:.35,borderWidth:2.5,pointRadius:3},
        {label:'SQL→Opp',data:[36,38,39,41,42,43],borderColor:GOOD,backgroundColor:'transparent',tension:.35,borderWidth:2.5,pointRadius:3}
      ]},options:{maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{boxWidth:12,padding:10}}},scales:{y:{grid:gridStyle,ticks:{callback:v=>v+'%'}},x:{grid:{display:false}}}}}));
  },
  capacity(){
    once('chartHC',()=>new Chart(document.getElementById('chartHC'),{type:'bar',
      data:{labels:['US','UK / EMEA','India'],datasets:[
        {label:'SDRs',data:[100,42,44],backgroundColor:ORANGE,borderRadius:4,stack:'s'},
        {label:'Managers',data:[11,5,9],backgroundColor:BLUE,borderRadius:4,stack:'s'},
        {label:'Directors',data:[1,1,1],backgroundColor:INK,borderRadius:4,stack:'s'}
      ]},options:{maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{boxWidth:12}}},scales:{x:{stacked:true,grid:{display:false}},y:{stacked:true,grid:gridStyle}}}}));
    once('chartRamp',()=>new Chart(document.getElementById('chartRamp'),{type:'line',
      data:{labels:['M1','M2','M3','M4','M5','M6'],datasets:[
        {label:'SQL Productivity %',data:[8,30,58,85,98,100],borderColor:ORANGE,backgroundColor:'rgba(255,90,31,.12)',fill:true,tension:.4,borderWidth:3,pointRadius:3,pointBackgroundColor:ORANGE}
      ]},options:{maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{grid:gridStyle,max:110,ticks:{callback:v=>v+'%'}},x:{grid:{display:false}}}}}));
  },
  recruiting(){
    once('chartReadiness',()=>new Chart(document.getElementById('chartReadiness'),{type:'bar',
      data:{labels:['1–2 / 5','3 / 5','4 / 5','5 / 5'],datasets:[
        {label:'Reps',data:[28,71,54,23],backgroundColor:['#B6BAC6',BLUE_B,ORANGE,GOOD],borderRadius:5}
      ]},options:{maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.parsed.y+' reps'}}},scales:{y:{grid:gridStyle,title:{display:true,text:'# of reps'}},x:{grid:{display:false}}}}}));
  },
  pnl(){
    once('chartPnL',()=>new Chart(document.getElementById('chartPnL'),{type:'bar',
      data:{labels:['Spend','Pipeline Created','Won Revenue'],datasets:[
        {label:'$M',data:[24.6,736,59.1],backgroundColor:[INK,BLUE_B,GOOD],borderRadius:6}
      ]},options:{maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>'$'+c.parsed.y+'M'}}},scales:{y:{type:'logarithmic',grid:gridStyle,ticks:{callback:v=>'$'+v+'M'}},x:{grid:{display:false}}}}}));
    once('chartBudget',()=>new Chart(document.getElementById('chartBudget'),{type:'doughnut',
      data:{labels:['Comp & Benefits','Tooling / Tech','Programs / Enablement','Travel / Events','Mgmt Overhead'],datasets:[{data:[68,11,8,5,8],backgroundColor:[ORANGE,BLUE,BLUE_B,GOOD,'#B6BAC6'],borderWidth:3,borderColor:'#fff'}]},
      options:{maintainAspectRatio:false,cutout:'60%',plugins:{legend:{position:'bottom',labels:{boxWidth:11,padding:9,font:{size:10}}}}}}));
  },
  gamification(){
    once('chartGame',()=>new Chart(document.getElementById('chartGame'),{type:'bar',
      data:{labels:['Activity','Conv.','Retention'],datasets:[
        {label:'Before',data:[100,100,100],backgroundColor:'#B6BAC6',borderRadius:4},
        {label:'After',data:[127,114,121],backgroundColor:ORANGE,borderRadius:4}
      ]},options:{maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{boxWidth:10,font:{size:9}}}},scales:{y:{grid:gridStyle,ticks:{callback:v=>v}},x:{grid:{display:false}}}}}));
  }
};
// init first tab charts
charts.overview();

// ===== AI AGENT PLACEHOLDER INTERACTION =====
function runAgent(btn,msg){
  const io=btn.closest('.agent-io');
  const out=io.querySelector('.agent-out');
  const input=io.querySelector('.agent-input');
  out.classList.add('show');
  out.innerHTML='<span style="color:var(--ink-2)">'+msg+'</span> <span class="typing"><i></i><i></i><i></i></span>';
  btn.disabled=true;
  btn.innerHTML='<span class="lock">⏳</span> Processing…';
  setTimeout(()=>{
    const sample=input&&input.value.trim()?'':' Add an input above to see how the agent would respond.';
    out.innerHTML='<b style="color:var(--av-orange)">⚙ DEMO MODE — Agent under development.</b><br>This is where the agent\u2019s structured output would appear (summary, recommended actions, and a confidence score) once wired to live models &amp; data. A manager reviews and approves before anything reaches a customer.'+sample;
    btn.disabled=false;
    btn.innerHTML='<span class="lock">🔒</span> Run Agent (placeholder)';
  },1500);
}
</script>
