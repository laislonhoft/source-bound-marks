import test from "node:test";
import assert from "node:assert/strict";
import { ID } from "../scripts/core.mjs";
import { fightingProfile, fightingFeatures, minimumWeaponDice, buildFightingDamage, prepareFighting, remindHew } from "../scripts/fighting.mjs";

function setup(profiles = ["greatWeaponFighting"], properties = ["two","hvy"], mode = "twoHanded") {
  const features = profiles.map((p,i)=>({uuid:`Actor.a.Item.f${i}`,type:"feat",name:p,flags:{[ID]:{fighting:p}},system:{source:{rules:"2024"}},effects:[]}));
  const actor = { uuid:"Actor.a",items:features,system:{attributes:{prof:4}} };
  const item = {uuid:"Actor.a.Item.weapon",type:"weapon",system:{properties:new Set(properties),type:{value:"martialM"},equipped:true}};
  actor.items.push(item);
  const activity = {actor,item,attack:{type:{classification:"weapon"}},activation:{type:"action"},getActionType:m=>m?.startsWith("thrown")||m==="ranged"?"rwak":"mwak"};
  const process = {subject:activity,attackMode:mode};
  const roll = {base:true,parts:["2d6","@mod","1d6[Hex]"],data:{mod:3},options:{}};
  const workflow = {actor,activity,attackMode:mode,token:{id:"caster"},hitTargets:new Set([{}])};
  const notes=[];
  globalThis.game = {modules:new Map([["midi-qol",{active:true}]]),combat:{started:true,combatant:{tokenId:"caster",actor}}};
  globalThis.ui = {notifications:{warn:m=>notes.push(m),info:m=>notes.push(m)}};
  let prompts=0;
  globalThis.foundry = {applications:{api:{DialogV2:{confirm:async()=>{prompts++;return true;}}}}};
  return {actor,item,activity,process,roll,workflow,notes,features,prompts:()=>prompts};
}
test("only 2024 features auto-recognize; explicit profiles and opt-out",()=>{
  for(const [name,profile] of [["Great Weapon Fighting","greatWeaponFighting"],["Mestre de Armas Grandes","greatWeaponMaster"],["Combate com Duas Armas","twoWeapon"],["Duelismo","dueling"],["Combate com Armas de Arremesso","thrown"]]){
    assert.equal(fightingProfile({type:"feat",name,system:{source:{rules:"2024"}}}),profile);
    assert.equal(fightingProfile({type:"feat",name,system:{source:{rules:"2014"}}}),null);
    assert.equal(fightingProfile({type:"feat",name}),null);
  }
  assert.equal(fightingProfile({type:"feat",name:"Custom",system:{identifier:"great-weapon-fighting",source:{rules:"2024"}}}),"greatWeaponFighting");
  assert.equal(fightingProfile({type:"feat",flags:{[ID]:{fighting:"dueling"}}}),"dueling");
  assert.equal(fightingProfile({type:"feat",name:"Dueling",system:{source:{rules:"2024"}},flags:{[ID]:{fighting:"off"}}}),null);
});
test("duplicate features do not stack; competing automation is skipped",()=>{
  const {actor,features,notes}=setup(["dueling","dueling"]);
  assert.equal(fightingFeatures(actor).size,1);
  features[0].effects=[{system:{changes:[{key:"system.bonuses.mwak.damage",value:"2"}]}}];
  features[1].flags["midi-qol"]={onUseMacroName:"Existing automation"};
  assert.equal(fightingFeatures(actor).size,0); fightingFeatures(actor); assert.equal(notes.length,2);
});
test("minimum applies only to simple weapon dice and keeps stronger minimum",()=>{
  assert.equal(minimumWeaponDice("2d6"),"2d6min3");
  assert.equal(minimumWeaponDice("1d10min2[slashing]"),"1d10min3[slashing]");
  assert.equal(minimumWeaponDice("1d12min4"),"1d12min4");
  for(const f of ["2d6r<3","{1d6,1d8}kh","@dice","1d6+1d6","max(1d6,3)"]) assert.equal(minimumWeaponDice(f),null);
});
test("GWF changes only base formula; repeated rebuild hook is idempotent",()=>{
  const {process,roll}=setup(); buildFightingDamage(process,roll); buildFightingDamage(process,roll);
  assert.deepEqual(roll.parts,["2d6min3","@mod","1d6[Hex]"]);
  const rider={base:false,parts:["2d8"],data:{},options:{}};buildFightingDamage(process,rider);assert.equal(rider.parts[0],"2d8");
});
for(const [properties,mode,expected] of [[["ver"],"oneHanded","2d6"],[["ver"],"twoHanded","2d6min3"],[["two","thr"],"thrown","2d6"],[[],"twoHanded","2d6"]]){
  test(`GWF eligibility ${properties} ${mode}`,()=>{const {process,roll}=setup(undefined,properties,mode);buildFightingDamage(process,roll);assert.equal(roll.parts[0],expected);});
}
test("ranged weapons and spell attacks cannot use GWF",()=>{
  const {process,roll,item,activity}=setup(); item.system.type.value="martialR";buildFightingDamage(process,roll);assert.equal(roll.parts[0],"2d6");
  item.system.type.value="martialM";activity.attack.type.classification="spell";buildFightingDamage(process,roll);assert.equal(roll.parts[0],"2d6");
});
test("custom base formula warns rather than altering unrelated dice",()=>{const {process,roll,notes}=setup();roll.parts[0]="2d6+1d6";buildFightingDamage(process,roll);buildFightingDamage(process,roll);assert.equal(notes.length,1);assert.equal(roll.parts[0],"2d6+1d6");});
test("dueling allows shield but rejects another equipped weapon and two hands",()=>{
  const {process,roll,actor}=setup(["dueling"],["ver"],"oneHanded");actor.items.push({type:"equipment",system:{equipped:true,type:{value:"shield"}}});
  buildFightingDamage(process,roll);buildFightingDamage(process,roll);assert.equal(roll.data.sbmFighting.dueling,2);assert.equal(roll.parts.filter(p=>p.includes("sbmFighting")).length,1);
  actor.items.push({uuid:"other",type:"weapon",system:{equipped:true}});const second={base:true,parts:["1d8"],data:{}};buildFightingDamage(process,second);assert.equal(second.parts.length,1);
  actor.items.pop();process.attackMode="twoHanded";buildFightingDamage(process,second);assert.equal(second.parts.length,1);
});
test("thrown style requires ranged attack plus thrown property",()=>{
  const {process,roll}=setup(["thrown"],["thr"],"thrown");buildFightingDamage(process,roll);assert.equal(roll.data.sbmFighting.thrown,2);
  process.attackMode="oneHanded";const second={base:true,parts:["1d6"],data:{}};buildFightingDamage(process,second);assert.equal(second.parts.length,1);
});
for(const mod of [-2,0,3]){
  test(`two-weapon fighting modifier ${mod}`,()=>{
    const {process,roll}=setup(["twoWeapon"],["lgt"],"oneHanded-offhand");roll.parts=["1d6"];roll.data.mod=mod;
    if(mod<0)roll.parts.push("@mod");buildFightingDamage(process,roll);buildFightingDamage(process,roll);
    assert.equal(roll.parts.filter(p=>p==="@mod").length,mod===0?0:1);
  });
}
test("non-light offhand attacks do not acquire two-weapon modifier",()=>{const {process,roll}=setup(["twoWeapon"],[],"oneHanded-offhand");roll.parts=["1d8"];buildFightingDamage(process,roll);assert.equal(roll.parts.length,1);});
test("GWM confirms Attack action once and adds proficiency on every separate attack",async()=>{
  const {workflow,activity,process,roll,prompts}=setup(["greatWeaponMaster"]);
  await prepareFighting(workflow,activity,process);await prepareFighting(workflow,activity,process);assert.equal(prompts(),1);
  buildFightingDamage(process,roll);buildFightingDamage(process,roll);assert.equal(roll.data.sbmFighting.heavyWeaponMastery,4);
  const other={...workflow};const next={subject:activity,attackMode:"twoHanded"};await prepareFighting(other,activity,next);assert.equal(next[ID].heavyAttack,true);assert.equal(prompts(),2);
});
for(const reason of ["reaction","bonus","otherTurn","notHeavy","offhand","decline","abortDuringPrompt"]){
  test(`GWM excludes ${reason}`,async()=>{
    const {workflow,activity,process,item,roll}=setup(["greatWeaponMaster"]);
    if(reason==="reaction"||reason==="bonus")activity.activation.type=reason;
    if(reason==="otherTurn")game.combat.combatant.tokenId="other";
    if(reason==="notHeavy")item.system.properties.clear();
    if(reason==="offhand")workflow.attackMode="oneHanded-offhand";
    if(reason==="decline")foundry.applications.api.DialogV2.confirm=async()=>false;
    if(reason==="abortDuringPrompt")foundry.applications.api.DialogV2.confirm=async()=>{workflow.abort=true;return true;};
    await prepareFighting(workflow,activity,process);buildFightingDamage(process,roll);assert.equal(roll.data.sbmFighting?.heavyWeaponMastery,undefined);
  });
}
test("Hew reminds once on melee critical or drop, never rolls a free attack",()=>{
  const {workflow,notes}=setup(["greatWeaponMaster"]);workflow.isCritical=true;remindHew(workflow);remindHew(workflow);assert.equal(notes.length,1);
  const next={...workflow,isCritical:false,damageList:[{oldHP:8,newHP:0,hpDamage:8}]};remindHew(next);assert.equal(notes.length,2);
  const miss={...workflow,isCritical:false,damageList:[]};remindHew(miss);assert.equal(notes.length,2);
});
