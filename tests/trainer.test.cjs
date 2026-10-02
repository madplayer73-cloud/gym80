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
const { estimateSessionCalories, estimateWorkoutCalories } = require('../src/utils/calories.ts');
const { parseMachineDrafts } = require('../src/utils/machineDraft.ts');

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
