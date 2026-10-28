const fs = require('node:fs');
const ts = require('typescript');
const test = require('node:test');
const assert = require('node:assert/strict');

require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText, filename);
};
const { mockMachines } = require('../src/data/mockData.ts');
const { generateTrainerPlan, getMachineTrainingGuidance, defaultReadiness, replacePlannedExercise } = require('../src/utils/trainerPlanner.ts');
const { getComparableEntries, getTrendProgressionAdvice, getPlannedProgressionAdvice, suggestWorkingWeight } = require('../src/utils/progressionAdvice.ts');
const plan = (options = {}) => generateTrainerPlan({ sessions: [], machines: mockMachines,
  targetDurationMinutes: 60, warmupMin: 8, cooldownMin: 5, preferredFocus: 'Vrch tela', ...options });
const chest = mockMachines.find(item => item.id === 'seated-chest-press');
const entry = (id, options = {}) => ({ id, machineId: chest.id, weightKg: 30, sets: 4,
  reps: 12, rpe: 8, feeling: 'akurat', painLevel: 0, painLocation: 'nie', techniqueQuality: 'cista',
  completedAt: new Date(Date.now() - Number(id) * 86400000).toISOString(), ...options });
const session = (entries) => ({ id: 'session', workoutDate: new Date().toISOString(), focus: 'Vrch tela', coachSummary: '', entries });
const { getWorkoutElapsed, transitionWorkoutClock, formatWorkoutTime } = require('../src/utils/workoutClock.ts');
const { getRememberedAccessory } = require('../src/utils/exerciseMemory.ts');
const { getBodyWeight, getProgressSummary, isPersonalData } = require('../src/utils/personalData.ts');
const { isBodyMeasurement, isBodyMeasurementDue, bodyMetrics } = require('../src/utils/bodyMeasurements.ts');
const { parseScaleScreenshotText, mergeScaleReadings, scaleScreenshotMetricKeys, scaleReadingRegions } = require('../src/utils/scaleScreenshotOcr.ts');
const { estimateSessionCalories, estimateWorkoutCalories } = require('../src/utils/calories.ts');
const { parseMachineDrafts } = require('../src/utils/machineDraft.ts');
const { applySetTarget } = require('../src/utils/setTargets.ts');
const { buildExerciseTrends, summarizeSessions, getRecords, shiftDate, monthKey } = require('../src/utils/progressAnalytics.ts');
const { parseAvailableWeights, selectAvailableWeight } = require('../src/utils/availableWeights.ts');
const { getPreviousWorkingSets } = require('../src/utils/previousSets.ts');
const { getLiveSetRecord } = require('../src/utils/liveSetRecord.ts');
const { buildDailySuggestion } = require('../src/utils/trainingPlan.ts');

test('body composition fields are optional, bounded, and survive export without invented values', () => {
  const old = {id:'body-old',date:'2026-10-10',weightKg:71.65};
  assert.equal(isBodyMeasurement(old),true);
  const full = {...old,bodyScore:83,bmi:21.6,bodyFatPercent:19.2,muscleMassKg:54.94,waterPercent:55.4,
    visceralFat:12,basalMetabolismKcal:1338,proteinPercent:21.2,boneMassKg:2.94,bodyAge:33,idealWeightKg:71.4};
  const restored = JSON.parse(JSON.stringify({measurements:[full],routines:[]}));
  assert.equal(isPersonalData(restored),true);
  assert.deepEqual(restored.measurements[0],full);
  assert.equal(getBodyWeight(restored,'2026-10-11'),71.65);
  assert.equal(old.bodyFatPercent,undefined);
  for (const field of bodyMetrics) assert.equal(isBodyMeasurement({...full,[field.key]:field.max+1}),false,field.key);
  assert.equal(isBodyMeasurement({...old,date:'2026-02-30'}),false);
  assert.equal(isBodyMeasurement({...full,bodyFatPercent:-1}),false);
  assert.equal(isBodyMeasurement({...full,bodyScore:'83'}),false);
});

test('weekly measurement reminder switches at Sunday 09:00 Bratislava including DST', () => {
  const measured = [{id:'body',date:'2026-10-04',weightKg:70}];
  assert.equal(isBodyMeasurementDue(measured,new Date('2026-10-11T06:59:00Z')),false);
  assert.equal(isBodyMeasurementDue(measured,new Date('2026-10-11T07:00:00Z')),true);
  assert.equal(isBodyMeasurementDue([{...measured[0],date:'2026-10-11'}],new Date('2026-10-12T10:00:00Z')),false);
  assert.equal(isBodyMeasurementDue([{...measured[0],date:'2026-10-10'}],new Date('2026-10-12T10:00:00Z')),true);
  const winter=[{...measured[0],date:'2026-10-18'}];
  assert.equal(isBodyMeasurementDue(winter,new Date('2026-10-25T07:59:00Z')),false);
  assert.equal(isBodyMeasurementDue(winter,new Date('2026-10-25T08:00:00Z')),true);
  assert.equal(isBodyMeasurementDue([],new Date('2026-10-12T10:00:00Z')),true);
});

test('smart scale screenshots parse Slovak labels, decimal commas, and two-page text', () => {
  const parsed = parseScaleScreenshotText(`Skóre tela 83 71,65 kg Bazálny metabolizmus 1 338 kcal
    Viscerálny tuk 12 BMI 21,6 Telesný tuk 19,2 % Svalstvo 54,94 kg Voda 55,4 %
    Bielkoviny 21,2 % Kostná hmota 2,94 kg Telesný vek 33 Ideálna váha 71,40 kg`);
  assert.deepEqual(parsed,{bodyScore:83,weightKg:71.65,basalMetabolismKcal:1338,visceralFat:12,bmi:21.6,
    bodyFatPercent:19.2,muscleMassKg:54.94,waterPercent:55.4,proteinPercent:21.2,boneMassKg:2.94,
    bodyAge:33,idealWeightKg:71.4});
  const reordered = parseScaleScreenshotText(`Bielkoviny 21,2 % Kostná hmota 2,92 kg Vek35 Vek: Ideálna váha71,40 kg
    Viscerálny tuk 11 BMI 21,5 Telesný tuk 19,4 % Svalstvo 54,49 kg Voda 55,2 %
    Skóre tela 84 71,25 kg Bazálny metabolizmus 1 332 kcal`);
  assert.deepEqual(reordered,{bodyScore:84,weightKg:71.25,basalMetabolismKcal:1332,visceralFat:11,bmi:21.5,
    bodyFatPercent:19.4,muscleMassKg:54.49,waterPercent:55.2,proteinPercent:21.2,boneMassKg:2.92,
    bodyAge:35,idealWeightKg:71.4});
  const commaDroppedByOcr = parseScaleScreenshotText(`Kostná hmota 292kg Vekš5Vek: Ideálna váha71,40 kg
    Telesný tuk 194% Svalstvo 5449kg Voda 55,2% Skóre tela 84 71,25 kg`);
  assert.deepEqual(commaDroppedByOcr,{bodyScore:84,weightKg:71.25,bodyFatPercent:19.4,muscleMassKg:54.49,
    waterPercent:55.2,boneMassKg:2.92,bodyAge:35,idealWeightKg:71.4});
  assert.deepEqual(parseScaleScreenshotText('Skóre tela 71,65 kg BMI 21,6'),{weightKg:71.65,bmi:21.6});
  assert.deepEqual(parseScaleScreenshotText('text bez hodnôt'),{});
  const currentScreenshots = parseScaleScreenshotText(`Skóre tela 80 7345 kg Voda 54,5%
    Bazálny metabolizmus 1 365 kcal Viscerálny tuk 13 BMI 221 Telesný tuk 20,4%
    Svalstvo 55,47kg Bielkoviny 209% Kostná hmota 297kg Vekš5 Vek:`);
  assert.deepEqual(currentScreenshots,{bodyScore:80,weightKg:73.45,basalMetabolismKcal:1365,visceralFat:13,
    bmi:22.1,bodyFatPercent:20.4,muscleMassKg:55.47,waterPercent:54.5,proteinPercent:20.9,
    boneMassKg:2.97,bodyAge:35});
  assert.equal(scaleScreenshotMetricKeys.every(key => currentScreenshots[key] != null),true);
  assert.deepEqual(mergeScaleReadings(
    {...currentScreenshots,bodyScore:10,visceralFat:1,muscleMassKg:55.4,boneMassKg:2.9,basalMetabolismKcal:undefined},
    currentScreenshots,
    currentScreenshots
  ),currentScreenshots);
});

test('scale import never guesses between conflicting reads or imports reference BMR', () => {
  assert.deepEqual(mergeScaleReadings({visceralFat:1,bodyScore:10},{visceralFat:13,bodyScore:80}),{});
  assert.deepEqual(mergeScaleReadings({muscleMassKg:55.4},{muscleMassKg:55.47},{muscleMassKg:55.48}),{});
  assert.deepEqual(mergeScaleReadings({basalMetabolismKcal:1365},{}),{});
  assert.deepEqual(mergeScaleReadings({visceralFat:1},{visceralFat:1},{visceralFat:13}),{visceralFat:1});
  assert.deepEqual(parseScaleScreenshotText('Váš štandardný bazálny metabolizmus je 1469 kCal. Hladina viscerálneho tuku sa musí znížiť na menej ako 9.'),{});
  assert.deepEqual(parseScaleScreenshotText('Bazálny metabolizmus 1 365 kcal\nVáš štandardný bazálny metabolizmus je 1469 kCal.'),{basalMetabolismKcal:1365});
  assert.deepEqual(parseScaleScreenshotText('Svalstvo 55,477 kg'),{});
  assert.deepEqual(parseScaleScreenshotText('Hmotnosť 100 kg Svalstvo 100 kg'),{weightKg:100,muscleMassKg:100});
});

test('score verification includes wide digits and scales with screenshot resolution', () => {
  const line = (text,x0,y0,x1,y1) => ({text,bbox:{x0,y0,x1,y1},words:[{text,bbox:{x0,y0,x1,y1}}]});
  for (const scale of [1,2,3]) {
    const rows = [line('Skóre tela',245*scale,200*scale,330*scale,220*scale),
      line('73,45 kg',240*scale,345*scale,335*scale,365*scale),
      line('Váš štandardný bazálny metabolizmus',90*scale,400*scale,500*scale,420*scale)];
    const regions=scaleReadingRegions(rows);
    assert.equal(regions.length,1);
    const {rectangle}=regions[0];
    assert.ok(rectangle.left < 230*scale);
    assert.ok(rectangle.left+rectangle.width > 345*scale);
    assert.ok(rectangle.top+rectangle.height >= 365*scale);
  }
});

test('progression requires different days at the same weight, and respects a long break', () => {
  const sameDay = [entry('1'), entry('2', { completedAt: entry('1').completedAt })];
  assert.equal(getTrendProgressionAdvice(sameDay, chest).action, 'hold');
  assert.equal(getTrendProgressionAdvice([entry('1', { weightKg: 32.5 }), entry('2')], chest).action, 'hold');
  assert.equal(getTrendProgressionAdvice([entry('20'), entry('21')], chest).action, 'deload');
  assert.equal(suggestWorkingWeight([entry('20'), entry('21')], chest), 27.5);
  const painfulRepeat = entry('2', { completedAt: entry('1').completedAt, painLevel: 6 });
  assert.equal(getTrendProgressionAdvice([entry('1'), painfulRepeat], chest).action, 'swap_or_stop');
  const incomplete = entry('1', { setLogs: Array.from({length:3}, (_,i) => ({id:String(i), completed:true, reps:12, weightKg:30})) });
  assert.notEqual(getTrendProgressionAdvice([incomplete, entry('2')], chest).action, 'increase');
});

test('live records compare clean completed sets and do not repeat or mix warmups', () => {
  const set = {id:'new', setNumber:1, completed:true, setType:'working', weightKg:30, reps:13, painLevel:0};
  assert.match(getLiveSetRecord(set, [entry('1')], [], chest), /rekord/);
  assert.equal(getLiveSetRecord(set, [], [], chest), null);
  assert.equal(getLiveSetRecord({...set, setType:'warmup'}, [entry('1')], [], chest), null);
  assert.equal(getLiveSetRecord({...set, painLevel:3}, [entry('1')], [], chest), null);
  assert.equal(getLiveSetRecord(set, [entry('1')], [{...set,id:'earlier'}], chest), null);
  assert.equal(getLiveSetRecord({...set, weightKg:29,reps:12}, [entry('1')], [], chest), null);
  assert.match(getLiveSetRecord({...set, weightKg:29,reps:12}, [entry('1')], [], chest, 'assisted'), /dopomoci/);
  assert.match(getLiveSetRecord(set, [entry('1')], [], {...chest,equipment:'dumbbell'}), /na jednoručku/);
});

test('available dumbbells parse decimals and persist without invalidating old personal data', () => {
  assert.deepEqual(parseAvailableWeights('12,5; 8; 10; 8'), [8,10,12.5]);
  assert.deepEqual(parseAvailableWeights(''), []);
  assert.throws(()=>parseAvailableWeights('8,10,12'));
  assert.throws(()=>parseAvailableWeights('-5; 10'));
  const data={measurements:[],routines:[]};
  assert.equal(isPersonalData(data), true);
  assert.equal(isPersonalData({...data,availableDumbbellWeightsKg:[8,10,12.5]}), true);
  assert.equal(isPersonalData({...data,availableDumbbellWeightsKg:[NaN]}), false);
  assert.equal(selectAvailableWeight([8,10,12],10,'increase'),12);
  assert.equal(selectAvailableWeight([8,10,12],12,'increase'),12);
  assert.equal(selectAvailableWeight([8,10,12],10,'reduce'),8);
  assert.equal(selectAvailableWeight([8,10,12],8,'reduce'),undefined);
});

test('dumbbell progression proposes available weights and holds at the largest one', () => {
  const m={...mockMachines.find(m=>m.equipment==='dumbbell'),availableWeightsKg:[8,10,12]};
  const history=[entry('1',{machineId:m.id,weightKg:10,reps:15}),entry('2',{machineId:m.id,weightKg:10,reps:15})];
  assert.equal(suggestWorkingWeight(history,m),12);
  assert.match(getTrendProgressionAdvice(history,m).message,/2 kg/);
  assert.equal(getPlannedProgressionAdvice({machine:m,latestEntry:history[0],trendAdvice:getTrendProgressionAdvice(history,m),plannedWeightKg:10,plannedSets:4,plannedReps:15}).message,getTrendProgressionAdvice(history,m).message);
  const top=history.map(e=>({...e,weightKg:12}));
  assert.equal(suggestWorkingWeight(top,m),12);
  assert.equal(getTrendProgressionAdvice(top,m).action,'hold');
});

test('previous series comparison excludes today, warmups and unfinished sets', () => {
  const history=[entry('3',{completedAt:'2026-10-09T12:00:00',weightKg:8}),entry('1',{completedAt:'2026-10-11T12:00:00',weightKg:20}),entry('2',{completedAt:'2026-10-10T12:00:00',setLogs:[{setNumber:1,completed:true,setType:'warmup',weightKg:5,reps:8},{setNumber:3,completed:true,weightKg:12,reps:10},{setNumber:2,completed:true,weightKg:10,reps:12},{setNumber:4,completed:false,weightKg:15,reps:8}]})];
  assert.deepEqual(getPreviousWorkingSets(history,'2026-10-11').map(s=>s.weightKg),[10,12]);
  assert.equal(getPreviousWorkingSets([history[0]],'2026-10-11').length,4);
});

test('six dumbbell curl variants have independent catalog IDs and progress histories', () => {
  const exercises = mockMachines.filter(m => m.equipment === 'dumbbell');
  assert.equal(exercises.length, 6);
  assert.equal(new Set(exercises.map(m => m.id)).size, 6);
  assert.deepEqual(exercises.map(m => m.modelName), ['Reverse Grip Curls', 'Alternating Hammer Curls', 'Rotational Curls', 'Alternating Rotational Curls', 'Hammer Grip Curls', 'Bicep Curls']);
  for (const exercise of exercises) {
    assert.equal(exercise.brand, 'Volne vahy');
    assert.equal(exercise.movementPattern, 'elbowFlexion');
    assert.equal(exercise.exerciseType, 'isolation');
    assert.equal(exercise.accessoryIds, undefined);
    assert.equal(exercise.referenceAssets.length,2);
    for (const asset of exercise.referenceAssets) assert.ok(fs.existsSync(require('node:path').join(__dirname,'../assets/exercises',asset)));
  }
  const sessions = [session(exercises.map((m, i) => entry(String(i), {machineId:m.id, weightKg:10+i, reps:12})))];
  const trends = buildExerciseTrends(sessions, id => mockMachines.find(m => m.id === id));
  assert.equal(trends.length, 6);
  assert.equal(trends[0].points[0].volume, 10*12*4);
  assert.deepEqual(plan({routineMachineIds:exercises.map(m=>m.id)}).exercises.map(e=>e.machine.id), exercises.map(m=>m.id));
  assert.ok(plan().exercises.every(e=>e.machine.equipment!=='dumbbell'));
});

test('bulk targets repeatedly update all unfinished sets including manual overrides, never completed ones', () => {
  const logs = Array.from({length:4},(_,i)=>({id:String(i),setNumber:i+1,completed:i===0,manualOverride:true,weightKg:60,reps:16}));
  let updated = applySetTarget(logs,'weightKg','62,5');
  assert.deepEqual(updated.map(s=>s.weightKg),[60,62.5,62.5,62.5]);
  updated = applySetTarget(updated,'reps','12');
  assert.deepEqual(updated.map(s=>s.reps),[16,12,12,12]);
  updated = applySetTarget(updated,'weightKg','65');
  assert.deepEqual(updated.map(s=>s.weightKg),[60,65,65,65]);
  assert.equal(updated[0],logs[0]);
  assert.deepEqual(applySetTarget(updated,'weightKg','').map(s=>s.weightKg),[60,undefined,undefined,undefined]);
  assert.deepEqual(applySetTarget(updated,'weightKg','0').map(s=>s.weightKg),[60,0,0,0]);
  assert.equal(applySetTarget(updated,'weightKg','NaN'),updated);
  assert.equal(applySetTarget(updated,'reps','2.5'),updated);
});
test('bulk weights scale warmups, while warmup reps and completed warmups remain intact', () => {
  const logs=[{id:'w',setNumber:1,setType:'warmup',targetPercent:50,weightKg:30,reps:8,completed:false,manualOverride:true},{id:'d',setNumber:2,setType:'warmup',targetPercent:80,weightKg:48,reps:5,completed:true}];
  assert.deepEqual(applySetTarget(logs,'weightKg','70').map(s=>s.weightKg),[35,48]);
  assert.deepEqual(applySetTarget(logs,'reps','12'),logs);
});
test('analytics count real working sets, exclude warmups and incomplete sets, use per-set volume', () => {
  const get=id=>mockMachines.find(m=>m.id===id);
  const s={...session([entry('1',{setLogs:[{completed:true,setType:'warmup',weightKg:20,reps:10},{completed:true,weightKg:60,reps:12},{completed:true,weightKg:55,reps:10},{completed:false,weightKg:99,reps:99}]})]),workoutDate:'2026-10-01',cleanDurationSec:600};
  const result=summarizeSessions([s,{...s,id:'old',workoutDate:'2026-09-01',cleanDurationSec:undefined}],get);
  assert.equal(result.sets,4); assert.equal(result.volume,2540); assert.equal(result.duration,600); assert.equal(result.unmeasured,1);
  const trend=buildExerciseTrends([s],get)[0];
  assert.equal(trend.points[0].volume,1270); assert.equal(trend.points[0].weight,60);
});
test('trends isolate grips and variants, sort dates and recognize reps at the same weight', () => {
  const get=id=>mockMachines.find(m=>m.id===id);
  const sessions=[{...session([entry('2',{weightKg:60,reps:16,accessoryId:'2110'})]),workoutDate:'2026-10-02'},
    {...session([entry('1',{weightKg:60,reps:12,accessoryId:'2110'}),entry('3',{weightKg:100,accessoryId:'2132'})]),workoutDate:'2026-10-01'}];
  const trends=buildExerciseTrends(sessions,get); assert.equal(trends.length,2);
  const t=trends.find(t=>t.context.includes('2110')); assert.equal(t.points[0].date,'2026-10-01');
  assert.ok(getRecords(t).some(r=>r.label.includes('60 kg')&&r.value==='12 → 16 op.'));
});
test('assistance and bodyweight are never treated as lifted volume', () => {
  const assisted={...chest,exerciseVariants:[{id:'a',nameSk:'a',descriptionSk:'',loadType:'assisted'}]};
  const sessions=[{...session([entry('1',{weightKg:40,reps:8})]),workoutDate:'2026-10-01'}, {...session([entry('2',{weightKg:30,reps:10})]),workoutDate:'2026-10-02'}];
  const trend=buildExerciseTrends(sessions,()=>assisted)[0];
  assert.equal(trend.points[0].volume,undefined); assert.equal(summarizeSessions(sessions,()=>assisted).volume,0);
  assert.equal(getRecords(trend)[0].value,'30 kg');
  const body={...assisted,exerciseVariants:[{...assisted.exerciseVariants[0],loadType:'bodyweight'}]};
  assert.equal(getRecords(buildExerciseTrends(sessions,()=>body)[0]).some(r=>r.label.includes('váha')),false);
});
test('calendar helpers handle year changes and duplicate training days', () => {
  assert.equal(monthKey('2026-01-31',-1),'2025-12'); assert.equal(shiftDate('2026-01-01',-1),'2025-12-31');
  const s={...session([entry('1')]),workoutDate:'2026-10-01'};
  assert.equal(summarizeSessions([s,{...s,id:'duplicate'}],()=>chest).workouts,1);
});

test('missing repetitions do not invent zero-rep records or volume', () => {
  const sessions=[session([entry('1',{reps:undefined,setLogs:[{completed:true,weightKg:60}]})])];
  const trend=buildExerciseTrends(sessions,()=>chest)[0];
  assert.equal(trend.points[0].reps,undefined);
  assert.equal(trend.points[0].volume,undefined);
  assert.deepEqual(trend.points[0].repsByWeight,{});
  assert.equal(getRecords(trend).length,1);
  assert.equal(summarizeSessions(sessions,()=>chest).volume,0);
});

test('draft serialization preserves unsaved fields and completed series per grip', () => {
  const draft = { variantId: null, accessoryId: null, weightKg: '32.5', sets: '4', reps: '10', durationMin: '20', speedKph: '6', inclinePercent: '0', restSeconds: '90', note: 'rozpracovane', updatedAt: new Date().toISOString(), feeling: 'akurat', rpe: 8, painLevel: 0, painLocation: 'nie', techniqueQuality: 'cista', setLogs: [{ id: '1', setNumber: 1, completed: true, weightKg: 32.5, reps: 10 }] };
  const data = { [JSON.stringify([null, null])]: draft };
  assert.deepEqual(parseMachineDrafts(JSON.stringify(data)), data);
  assert.deepEqual(parseMachineDrafts(null), {});
  assert.throws(() => parseMachineDrafts('{"bad":null}'));
  assert.throws(() => parseMachineDrafts(JSON.stringify({ wrongContext: draft })));
});

test('personal routines preserve exact order and do not fill with random exercises', () => {
  const ids = [chest.id, 'leg-curl-seated'];
  assert.deepEqual(plan({ routineMachineIds: ids }).exercises.map(item => item.machine.id), ids);
  assert.deepEqual(plan({ routineMachineIds: [] }).exercises, []);
  assert.deepEqual(plan({ routineMachineIds: ids, userExerciseProfiles: { [chest.id]: { machineId: chest.id, doNotRecommend: true } } }).exercises.map(item => item.machine.id), ['leg-curl-seated']);
});

test('bodyweight lookup uses the latest measurement on or before workout date', () => {
  const data = { routines: [], measurements: [{ id: '1', date: '2026-09-01', weightKg: 80 }, { id: '2', date: '2026-10-01', weightKg: 78 }] };
  assert.equal(getBodyWeight(data, '2026-09-20'), 80);
  assert.equal(getBodyWeight(data, '2026-08-01'), undefined);
  assert.equal(isPersonalData(data), true);
  assert.equal(isPersonalData({ ...data, measurements: [null] }), false);
  assert.equal(isPersonalData({ ...data, routines: [null] }), false);
});

test('progress summary recognizes reps and isolates accessory histories', () => {
  const old = entry('1', { completedAt: '2026-09-01', reps: 8, accessoryId: '2110' });
  const mixed = entry('2', { completedAt: '2026-09-02', weightKg: 99, accessoryId: '2132' });
  const latest = entry('3', { completedAt: '2026-09-03', reps: 10, accessoryId: '2110' });
  const result = getProgressSummary([old, mixed, latest], chest);
  assert.equal(result.delta, 0);
  assert.equal(result.repsDelta, 2);
  assert.match(result.label, /pri rovnakej vahe/);
  assert.equal(getProgressSummary([mixed, latest], chest), null);
});

test('calories require actual bodyweight and use measured workout duration', () => {
  const getMachine = id => mockMachines.find(item => item.id === id);
  const workout = { ...session([entry('1')]), cleanDurationSec: 3600 };
  assert.equal(estimateSessionCalories(workout, getMachine), null);
  assert.equal(estimateWorkoutCalories(60), null);
  assert.equal(estimateSessionCalories(workout, getMachine, 80), estimateWorkoutCalories(60, 80));
  assert.equal(estimateWorkoutCalories(60, 80), 319);
  assert.equal(estimateWorkoutCalories(60, Infinity), null);
  const withWarmup = { ...workout, entries: [...workout.entries, entry('2', { machineId: 'routine-warmup', durationMin: 8 })] };
  assert.equal(estimateSessionCalories(withWarmup, getMachine, 80), estimateSessionCalories(workout, getMachine, 80));
});

test('calories become available after a dated measurement without inventing past bodyweight', () => {
  const getMachine = id => mockMachines.find(item => item.id === id);
  const workout = { ...session([entry('1')]), workoutDate: '2026-10-11', cleanDurationSec: 3600 };
  const measurements = { measurements: [{id:'body-2026-10-11', date:'2026-10-11', weightKg:80}], routines:[] };
  assert.equal(estimateSessionCalories(workout, getMachine, getBodyWeight(measurements, workout.workoutDate)), 319);
  assert.equal(estimateSessionCalories({...workout, workoutDate:'2026-10-10'}, getMachine, getBodyWeight(measurements, '2026-10-10')), null);
  const restored = JSON.parse(JSON.stringify(measurements));
  assert.equal(estimateSessionCalories(workout, getMachine, getBodyWeight(restored, workout.workoutDate)), 319);
  assert.equal(estimateSessionCalories({...workout, cleanDurationSec:0}, getMachine,80), 0);
});

test('assisted and bodyweight progress describe the correct load semantics', () => {
  const assistedMachine = { ...chest, exerciseVariants: [{ id: 'assisted', nameSk: 'Dopomoc', loadType: 'assisted' }] };
  const first = entry('1', { completedAt: '2026-09-01', exerciseVariantId: 'assisted', weightKg: 40, reps: 8 });
  const latest = entry('2', { completedAt: '2026-09-02', exerciseVariantId: 'assisted', weightKg: 35, reps: 8 });
  assert.match(getProgressSummary([first, latest], assistedMachine).label, /-5 kg dopomoci/);
  const bodyweightMachine = { ...assistedMachine, exerciseVariants: [{ id: 'assisted', nameSk: 'Vlastna vaha', loadType: 'bodyweight' }] };
  assert.match(getProgressSummary([first, { ...latest, reps: 10 }], bodyweightMachine).label, /\+2 op. pri vlastnej vahe/);
});

test('exercise classification does not use secondary muscles in prose', () => {
  assert.equal(chest.movementPattern, 'horizontalPush');
  assert.deepEqual(chest.primaryMuscles, ['hrudnik']);
  assert.equal(mockMachines.find(item => item.id === 'seated-straight-arm-pulldown').movementPattern, 'coreExtension');
  assert.equal(mockMachines.find(item => item.id === 'leg-curl-seated').subgroup, 'zadne stehna');
  assert.deepEqual(mockMachines.find(item => item.id === 'seated-chest-fly').secondaryMuscles, []);
});
test('upper and lower plans cover the intended muscle groups', () => {
  const upper = plan();
  assert.ok(upper.exercises.some(item => item.movementPattern === 'horizontalPush'));
  assert.ok(upper.exercises.some(item => ['verticalPull', 'horizontalPull'].includes(item.movementPattern)));
  assert.ok(upper.exercises.every(item => !item.machine.id.startsWith('free-weights-')));
  const lower = plan({ preferredFocus: 'Spodok tela' });
  assert.ok(lower.exercises.some(item => item.subgroup === 'predne stehna'));
  assert.ok(lower.exercises.some(item => item.subgroup === 'zadne stehna'));
});
test('a completed upper-body workout immediately rotates the next suggestion to lower body', () => {
  const completedUpper = session([entry('1')]);
  const suggestion = buildDailySuggestion([completedUpper], mockMachines, 60, 5, 5);
  assert.equal(suggestion.focus, 'Spodok tela');
  assert.match(suggestion.title, /nohy/i);
});
test('focus selection uses the newest completed workout even when history arrives unsorted', () => {
  const olderUpper = { ...session([entry('1')]), id: 'older', workoutDate: '2026-10-20T10:00:00.000Z' };
  const legMachine = mockMachines.find(item => item.muscleGroup === 'Nohy');
  const newerLower = { ...session([{ ...entry('2'), machineId: legMachine.id }]), id: 'newer', workoutDate: '2026-10-25T10:00:00.000Z', focus: 'Spodok tela' };
  assert.equal(buildDailySuggestion([olderUpper, newerLower], mockMachines, 60, 5, 5).focus, 'Vrch tela');
});
test('excluded and blocked exercises never leak through or appear as alternatives', () => {
  const profiles = Object.fromEntries(mockMachines.map(machine => [machine.id, { machineId: machine.id, doNotRecommend: true }]));
  assert.equal(plan({ userExerciseProfiles: profiles }).exercises.length, 0);
  profiles[chest.id] = { machineId: chest.id, blockedUntil: new Date(Date.now() + 86400000).toISOString() };
  assert.equal(plan({ userExerciseProfiles: profiles }).exercises.length, 0);
  const selected = plan({ userExerciseProfiles: { [chest.id]: profiles[chest.id] } });
  assert.ok(selected.exercises.every(item => item.machine.id !== chest.id && item.alternatives.every(alt => alt.id !== chest.id)));
});
test('empty buckets do not prevent valid later exercises', () => {
  const result = plan({ machines: mockMachines.filter(machine => machine.muscleGroup === 'Chrbat') });
  assert.ok(result.exercises.length > 0);
});
test('lower readiness produces less volume and realistic time follows sets', () => {
  const high = plan({ readiness: { ...defaultReadiness, energia: 5, spanok: 'dobry' } });
  const low = plan({ readiness: { ...defaultReadiness, energia: 1, spanok: 'slaby', svalovica: 'silna', cielDna: 'lahky' } });
  assert.ok(low.exercises.reduce((sum, item) => sum + item.sets, 0) < high.exercises.reduce((sum, item) => sum + item.sets, 0));
  const beginner = plan({ readiness: { ...defaultReadiness, trainingLevel: 'zaciatocnik' } });
  const advanced = plan({ readiness: { ...defaultReadiness, trainingLevel: 'pokrocily' } });
  assert.ok(beginner.estimatedDurationMinutes < advanced.estimatedDurationMinutes);
});
test('weekly volume counts completed working logs, not warmups or unchecked logs', () => {
  const logs = [{ completed: true, setType: 'warmup' }, { completed: true, setType: 'working' }, { completed: false, setType: 'working' }];
  const result = plan({ sessions: [session([entry('1', { setLogs: logs })])] });
  assert.equal(result.stats.weeklyState.hardSetsByMuscle.hrudnik, 1);
  assert.equal(result.stats.weeklyState.hardSetsByMuscle.triceps, 0.5);
});
test('progression isolates accessory and exercise variant', () => {
  const entries = [entry('1', { accessoryId: '2110' }), entry('2', { accessoryId: '2132' }), entry('3', { accessoryId: '2110', exerciseVariantId: 'other' })];
  assert.deepEqual(getComparableEntries(entries, entries[0]).map(item => item.id), ['1']);
});
test('weight increase requires two clean sessions and complete top-range sets', () => {
  assert.equal(suggestWorkingWeight([entry('1')], chest), 30);
  assert.equal(suggestWorkingWeight([entry('2'), entry('1')], chest), 32.5);
  const poor = entry('1', { setLogs: [{ completed: true, setType: 'working', reps: 8 }] });
  assert.equal(suggestWorkingWeight([poor, entry('2')], chest), 30);
  assert.notEqual(getTrendProgressionAdvice([entry('1'), entry('2', { techniqueQuality: 'zla' })], chest).action, 'increase');
});
test('pain and technique warnings cannot become a success when weight is raised', () => {
  const latest = entry('1', { painLevel: 6, feeling: 'bolest' });
  const trendAdvice = getTrendProgressionAdvice([latest], chest);
  assert.equal(suggestWorkingWeight([latest], chest), undefined);
  assert.equal(getPlannedProgressionAdvice({ latestEntry: latest, trendAdvice, plannedWeightKg: 50, plannedSets: 4, plannedReps: 12 }).action, 'swap_or_stop');
  const bad = entry('1', { techniqueQuality: 'zla' });
  assert.equal(getPlannedProgressionAdvice({ latestEntry: bad, trendAdvice: getTrendProgressionAdvice([bad], chest), plannedWeightKg: 50, plannedSets: 4, plannedReps: 12 }).level, 'warning');
});
test('explicit rest and rep guidance stays available', () => {
  const guidance = getMachineTrainingGuidance(chest);
  assert.equal(guidance.defaultRepMax, 12);
  assert.ok(guidance.recommendedRestMaxSec > 0);
});

test('workout clock excludes warmup and manual pause, survives serialized restore', () => {
  const warmup = { phase: 'warmup', elapsedSec: 0, workoutDate: new Date().toISOString() };
  assert.equal(getWorkoutElapsed(warmup, 600000), 0);
  const running = transitionWorkoutClock(warmup, 'running', 600000);
  assert.equal(getWorkoutElapsed(running, 665000), 65);
  const paused = transitionWorkoutClock(running, 'paused', 665000);
  assert.equal(getWorkoutElapsed(paused, 1265000), 65);
  const resumed = transitionWorkoutClock(paused, 'running', 1265000);
  const restored = JSON.parse(JSON.stringify(resumed));
  assert.equal(getWorkoutElapsed(restored, 1325000), 125);
  const finished = transitionWorkoutClock(restored, 'finished', 1325000);
  assert.equal(getWorkoutElapsed(finished, 1500000), 125);
  assert.equal(formatWorkoutTime(125), '02:05');
  assert.equal(formatWorkoutTime(3661), '1:01:01');
  assert.equal(transitionWorkoutClock(running, 'running', 650000).startedAt, 600000);
});

test('remembered accessory follows latest saved variant, not another grip or removed accessory', () => {
  const machine = { ...chest, accessoryIds: ['2110', '2132'], exerciseVariants: [{ id: 'a' }, { id: 'b' }] };
  const entries = [entry('2', { exerciseVariantId: 'a', accessoryId: '2110' }), entry('1', { exerciseVariantId: 'b', accessoryId: '2132' })];
  assert.equal(getRememberedAccessory(machine, entries, 'a'), '2110');
  assert.equal(getRememberedAccessory(machine, entries, 'b'), '2132');
  assert.equal(getRememberedAccessory(machine, [entry('1', { accessoryId: '2142' })], 'a'), null);
  assert.equal(getRememberedAccessory(machine, [entry('1'), ...entries], 'a'), null);
});

test('replacement keeps position and volume while adopting its own guidance', () => {
  const exercise = plan().exercises[0];
  const alternative = exercise.alternatives[0];
  assert.ok(alternative);
  const replacement = replacePlannedExercise(exercise, alternative, []);
  assert.equal(replacement.order, exercise.order);
  assert.equal(replacement.sets, exercise.sets);
  assert.equal(replacement.machine.id, alternative.id);
  assert.equal(replacement.movementPattern, alternative.movementPattern);
  assert.ok(replacement.reps >= replacement.targetRepMin && replacement.reps <= replacement.targetRepMax);
  const saved = JSON.parse(JSON.stringify({ exercises: [replacement] }));
  assert.equal(saved.exercises[0].machine.id, alternative.id);
});

test('recent too-hard feedback reduces next workout volume without altering weights', () => {
  const baseSession = session([entry('1')]);
  const baseline = plan({ sessions: [baseSession] });
  const adapted = plan({ sessions: [{ ...baseSession, workoutFeedback: 'prilis_tazky', feedbackAt: new Date().toISOString() }] });
  assert.ok(adapted.exercises.reduce((sum, item) => sum + item.sets, 0) < baseline.exercises.reduce((sum, item) => sum + item.sets, 0));
  assert.match(adapted.strategy, /Minule to bolo prilis tazke/);
  const old = plan({ sessions: [{ ...baseSession, workoutFeedback: 'prilis_tazky', feedbackAt: new Date(Date.now() - 30 * 86400000).toISOString() }] });
  assert.equal(old.exercises.reduce((sum, item) => sum + item.sets, 0), baseline.exercises.reduce((sum, item) => sum + item.sets, 0));
});
