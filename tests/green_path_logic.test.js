'use strict';
const assert=require('node:assert/strict');
global.window=global;
require('../precision_scoring.js');

const cases={
  carrie:{member_name:'Carrie Hui',total_score:65,training_score:0,absence_score:15,lateness_score:10,one_to_one_score:10,referral_score:15,biz_give_score:15,visitor_score:0,raw_metrics:{P:19,A:0,L:0,M:0,S:1,G:24,V:0,T:0,biz_give:3792079,one_to_one:24}},
  danielle:{member_name:'Danielle Tsui',total_score:65,training_score:0,absence_score:15,lateness_score:10,one_to_one_score:5,referral_score:20,biz_give_score:5,visitor_score:10,raw_metrics:{P:18,A:0,L:0,M:0,S:2,G:37,V:5,T:0,biz_give:148951,one_to_one:16}},
  eric:{member_name:'Eric Ho',total_score:50,training_score:5,absence_score:15,lateness_score:10,one_to_one_score:5,referral_score:0,biz_give_score:15,visitor_score:0,raw_metrics:{P:15,A:0,L:0,M:2,S:3,G:13,V:1,T:1,biz_give:892758126,one_to_one:19}},
  cheeno:{member_name:'Liu Cheen Man (Cheeno)',total_score:30,training_score:0,absence_score:15,lateness_score:10,one_to_one_score:0,referral_score:0,biz_give_score:0,visitor_score:5,raw_metrics:{P:20,A:0,L:0,M:0,S:0,G:1,V:4,T:0,biz_give:6865,one_to_one:7}},
  visitorStep:{member_name:'Visitor Step',total_score:60,training_score:5,absence_score:15,lateness_score:10,one_to_one_score:5,referral_score:10,biz_give_score:5,visitor_score:10,raw_metrics:{P:20,A:0,L:0,M:0,S:0,G:20,V:6,T:1,biz_give:100000,one_to_one:15}},
  inconsistent:{member_name:'Inconsistent Example',total_score:50,training_score:5,absence_score:10,lateness_score:10,one_to_one_score:5,referral_score:0,biz_give_score:0,visitor_score:10,raw_metrics:{P:18,A:1,L:0,M:0,S:1,G:6,V:6,T:1,biz_give:0,one_to_one:15}}
};

function category(plan,name){return plan.actions.find(x=>x.category===name)||plan.alternatives.find(x=>x.category===name)}
function assertInvariants(member,plan){
  if(plan.blocked)return;
  const actionGain=plan.actions.reduce((sum,x)=>sum+x.gain,0);
  assert.equal(plan.projected-member.total_score,actionGain,`${member.member_name}: projected score must equal selected gains`);
  for(const action of plan.actions)assert.equal(action.gain,action.targetScore-action.currentScore,`${member.member_name}: ${action.category} gain mismatch`);
  const active=[['培訓','training_score',10],['1-2-1','one_to_one_score',10],['引薦','referral_score',20],['生意額','biz_give_score',15],['嘉賓','visitor_score',20]];
  const covered=new Set([...plan.actions,...plan.alternatives,...plan.unavailable].map(x=>x.category));
  for(const [name,key,max] of active)if(Number(member[key])<max)assert.ok(covered.has(name),`${member.member_name}: ${name} silently disappeared`);
}

const carrie=precisePlan(cases.carrie);assert.equal(carrie.blocked,false);assert.equal(carrie.projected,70);assert.equal(carrie.actions[0].category,'培訓');assert.ok(carrie.strengths.includes('1-2-1'));assertInvariants(cases.carrie,carrie);

const danielle=precisePlan(cases.danielle);assert.equal(danielle.blocked,false);assert.equal(danielle.projected,70);const d121=category(danielle,'1-2-1');assert.ok(d121,'Danielle: 1-2-1 must be shown');assert.equal(d121.options[0].need,4);assert.equal(d121.options[0].gain,5);assertInvariants(cases.danielle,danielle);

const eric=precisePlan(cases.eric);assert.equal(eric.blocked,false);assert.equal(eric.projected,70);assert.ok(eric.actions.some(x=>x.category==='1-2-1'),'Eric: near-threshold 1-2-1 should be selected');assert.equal(eric.actions.reduce((s,x)=>s+x.gain,0),20);assertInvariants(cases.eric,eric);

const cheeno=precisePlan(cases.cheeno);assert.equal(cheeno.blocked,false);assert.equal(cheeno.projected,70);assert.ok(cheeno.actions.some(x=>x.category==='1-2-1')||cheeno.alternatives.some(x=>x.category==='1-2-1'));assertInvariants(cases.cheeno,cheeno);

const visitor=precisePlan(cases.visitorStep);const v=category(visitor,'嘉賓');assert.ok(v,'Visitor options must be shown');assert.equal(v.options[0].need,4);assert.equal(v.options[0].targetScore,15);assert.equal(v.options[0].gain,5,'Visitor 10→15 must be +5, not +10');assert.equal(v.options[1].need,9);assert.equal(v.options[1].targetScore,20);assert.equal(v.options[1].gain,10);assertInvariants(cases.visitorStep,visitor);

const inconsistent=precisePlan(cases.inconsistent);assert.equal(inconsistent.blocked,true);assert.equal(inconsistent.projected,null);assert.ok(inconsistent.dataIssues.some(x=>x.includes('七項正式分數合計')));

console.log('Green Path logic tests passed:',Object.keys(cases).length,'cases');
