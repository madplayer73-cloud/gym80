import React from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Machine, PersonalData, WorkoutSession } from "../types";
import { useTheme } from "../theme";
import { TrendChart } from "../components/TrendChart";
import { BodyMeasurementsCard } from "../components/BodyMeasurementsCard";
import { getMachineImage } from "../utils/machineImages";
import { buildExerciseTrends, dateKey, getRecords, monthKey, ProgressMetric, shiftDate, summarizeSessions } from "../utils/progressAnalytics";

type Props = { sessions: WorkoutSession[]; personalData: PersonalData; getMachine: (id:string)=>Machine|undefined;
  onSaveMeasurement: React.ComponentProps<typeof BodyMeasurementsCard>["onSave"]; onOpenMachine: (machine:Machine)=>void };
const palette = ["#e98437", "#4a9de0", "#7a9f50", "#ad7ee0", "#d66584", "#49a99c"];
const fmt = (n:number)=>Math.round(n*10)/10;
const hours = (seconds:number)=>`${Math.floor(seconds/3600)} h ${Math.floor(seconds%3600/60)} min`;
export function ProgressScreen({sessions,personalData,getMachine,onSaveMeasurement,onOpenMachine}:Props) {
  const {colors} = useTheme();
  const [period,setPeriod] = React.useState<30|90|0>(30);
  const [metric,setMetric] = React.useState<ProgressMetric>("weight");
  const today = new Date().toLocaleDateString("sv-SE");
  const [calendarMonth,setCalendarMonth] = React.useState(monthKey(today));
  const [reportMonth,setReportMonth] = React.useState(monthKey(today));
  const [selectedDay,setSelectedDay] = React.useState<string|null>(null);
  const [showAll,setShowAll] = React.useState(false);
  const start = period ? shiftDate(today,1-period) : "0000-00-00";
  const filtered = sessions.filter(s=>dateKey(s.workoutDate)>=start && dateKey(s.workoutDate)<=today);
  const stats = summarizeSessions(filtered,getMachine);
  const previous = period ? summarizeSessions(sessions.filter(s=>dateKey(s.workoutDate)>=shiftDate(start,-period)&&dateKey(s.workoutDate)<start),getMachine):null;
  const trends = React.useMemo(()=>buildExerciseTrends(filtered,getMachine),[sessions,period,today,getMachine]);
  const allTrends = React.useMemo(()=>buildExerciseTrends(sessions,getMachine),[sessions,getMachine]);
  const visibleTrends = showAll ? trends : trends.slice(0,6);
  const monthSessions = sessions.filter(s=>dateKey(s.workoutDate).startsWith(reportMonth));
  const monthly = summarizeSessions(monthSessions,getMachine);
  const priorMonthly = summarizeSessions(sessions.filter(s=>dateKey(s.workoutDate).startsWith(monthKey(`${reportMonth}-01`,-1))),getMachine);
  const records = allTrends.flatMap(t=>getRecords(t).map(r=>({...r,key:t.key,machine:t.machine,context:t.context}))).filter(r=>r.date>=start&&r.date<=today).sort((a,b)=>b.date.localeCompare(a.date));
  const monthFirst = new Date(`${calendarMonth}-01T12:00:00`);
  const dayCount = new Date(monthFirst.getFullYear(),monthFirst.getMonth()+1,0).getDate();
  const offset = (monthFirst.getDay()+6)%7;
  const monthDays = Array.from({length:Math.ceil((offset+dayCount)/7)*7},(_,i)=>i-offset+1);
  const trainedDays = new Set(sessions.filter(s=>s.entries.length).map(s=>dateKey(s.workoutDate)));
  const measurements = personalData.measurements.filter(m=>m.date>=start&&m.date<=today).sort((a,b)=>a.date.localeCompare(b.date));
  const styles = StyleSheet.create({content:{padding:16,paddingBottom:40,gap:18},card:{backgroundColor:colors.surface,borderColor:colors.border,borderWidth:1,borderRadius:22,padding:18,gap:12},title:{color:colors.text,fontSize:22,fontWeight:"800"},text:{color:colors.text},muted:{color:colors.textMuted,fontSize:13,lineHeight:19},row:{flexDirection:"row",flexWrap:"wrap",gap:8},chip:{paddingHorizontal:12,paddingVertical:10,borderRadius:14,backgroundColor:colors.accentSoft},grid:{flexDirection:"row",flexWrap:"wrap",gap:10},stat:{width:"47%",backgroundColor:colors.surface,borderRadius:18,padding:14,borderWidth:1,borderColor:colors.border},value:{color:colors.text,fontSize:25,fontWeight:"800"},button:{color:colors.highlight,fontWeight:"700"}});
  const button = (label:string,active:boolean,onPress:()=>void)=><Pressable key={label} accessibilityRole="button" accessibilityState={{selected:active}} onPress={onPress} style={[styles.chip,active&&{backgroundColor:colors.highlightSoft}]}><Text style={{color:active?colors.highlight:colors.text,fontWeight:"700"}}>{label}</Text></Pressable>;
  const heading = (title:string,caption?:string)=><><Text style={styles.title}>{title}</Text>{caption?<Text style={styles.muted}>{caption}</Text>:null}</>;
  const difference = (current:number,old:number)=>old ? `${current-old>=0?"+":""}${fmt((current-old)/old*100)} % oproti minulému obdobiu` : "Bez porovnateľného minulého obdobia";
  const monthPicker = (month:string,setMonth:(m:string)=>void)=><View style={[styles.row,{alignItems:"center",justifyContent:"space-between"}]}>{button("‹",false,()=>setMonth(monthKey(`${month}-01`,-1)))}<Text style={[styles.text,{fontWeight:"700"}]}>{new Date(`${month}-01T12:00:00`).toLocaleDateString("sk-SK",{month:"long",year:"numeric"})}</Text>{button("›",false,()=>{const next=monthKey(`${month}-01`,1);if(next<=monthKey(today))setMonth(next);})}</View>;
  return <ScrollView contentContainerStyle={styles.content}>
    {heading("Môj progres","Tvoje stroje. Tvoje výkony. Vývoj z reálne uložených tréningov.")}
    <View style={styles.row}>{button("30 dní",period===30,()=>setPeriod(30))}{button("3 mesiace",period===90,()=>setPeriod(90))}{button("Všetko",period===0,()=>setPeriod(0))}</View>
    <View style={styles.grid}>{[["Tréningové dni",String(stats.workouts),previous?difference(stats.workouts,previous.workouts):"Celá história"],["Pracovné série",String(stats.sets),"Bez rozcvičovacích sérií"],["Čistý čas",hours(stats.duration),`${stats.unmeasured} tréningov bez zaznamenaného času`],["Objem",`${Math.round(stats.volume).toLocaleString("sk-SK")} kg·op.`,"Váha × opakovania; bez dopomoci a vlastnej váhy"]].map(([label,value,note])=><View key={label} style={styles.stat}><Text style={styles.muted}>{label}</Text><Text style={styles.value}>{value}</Text><Text style={styles.muted}>{note}</Text></View>)}</View>
    <View style={styles.card}>{heading("Progres na strojoch","Každý cvik a pomôcka má vlastný graf. Ťuknutím na bod zobrazíš výkon.")}
      <View style={styles.row}>{button("Váha",metric==="weight",()=>setMetric("weight"))}{button("Opakovania",metric==="reps",()=>setMetric("reps"))}{button("Objem",metric==="volume",()=>setMetric("volume"))}</View>
      {!trends.length?<Text style={styles.muted}>V tomto období zatiaľ nie sú uložené pracovné série. Skús dlhšie obdobie.</Text>:null}
      {visibleTrends.map((t,index)=>{const image=getMachineImage(t.machine.imageAsset); const points=t.points.flatMap(p=>{const value=metric==="weight"?p.weight:metric==="reps"?p.reps:p.volume;return value===undefined?[]:[{date:p.date,value}];});const first=points[0],last=points[points.length-1];return <View key={t.key} style={{gap:10,paddingVertical:12,borderTopWidth:1,borderColor:colors.border}}>
        <Pressable accessibilityRole="button" onPress={()=>onOpenMachine(t.machine)} style={[styles.row,{alignItems:"center"}]}>{image?<Image source={image} resizeMode="contain" style={{width:60,height:60,borderRadius:12,backgroundColor:"#fff"}}/>:null}<View style={{flex:1}}><Text style={[styles.text,{fontSize:17,fontWeight:"700"}]}>{t.machine.displayNameSk}</Text><Text style={styles.muted}>{t.context || t.machine.modelName}</Text></View></Pressable>
        {t.machine.equipment==="dumbbell"?<Text style={styles.muted}>Váha jednej jednoručky a opakovania na jednu ruku. Objem je za jednu stranu, bez násobenia dvomi.</Text>:null}
        {t.loadType==="assisted"?<Text style={styles.muted}>Dopomoc: menej kg znamená náročnejšie cvičenie. Objem nevypočítavame.</Text>:null}
        {metric==="reps"?<Text style={styles.muted}>Najviac opakovaní v pracovnej sérii za deň; váha sa môže medzi dňami líšiť.</Text>:null}
        {metric==="volume"?<Text style={styles.muted}>Súčet pracovných sérií za deň. Vyšší objem sám osebe neznamená vyššiu silu.</Text>:null}
        <TrendChart points={points} unit={metric==="weight"?"kg":metric==="reps"?"op.":"kg·op."} color={palette[index%palette.length]} />
        {first&&last&&points.length>1?<Text style={styles.text}>{first.value} → {last.value} · zmena {last.value-first.value>=0?"+":""}{fmt(last.value-first.value)} {metric==="weight"?"kg":metric==="reps"?"op.":"kg·op."}</Text>:null}
      </View>;})}
      {trends.length>6?button(showAll?"Zobraziť menej":`Všetky cviky (${trends.length})`,false,()=>setShowAll(!showAll)):null}
    </View>
    <View style={styles.card}>{heading("Tréningový kalendár","Farebné dni = uložený tréning. Ťukni na deň pre podrobnosti.")}{monthPicker(calendarMonth,setCalendarMonth)}
      <View style={{flexDirection:"row"}}>{["Po","Ut","St","Št","Pi","So","Ne"].map(d=><Text key={d} style={[styles.muted,{width:"14.2857%",textAlign:"center"}]}>{d}</Text>)}</View>
      <View style={{flexDirection:"row",flexWrap:"wrap"}}>{monthDays.map((d,i)=>{const date=`${calendarMonth}-${String(d).padStart(2,"0")}`,valid=d>0&&d<=dayCount,trained=trainedDays.has(date);return <View key={i} style={{width:"14.2857%",padding:3}}>{valid?<Pressable accessibilityRole="button" accessibilityLabel={`${date}${trained?", tréning":", bez tréningu"}`} onPress={()=>setSelectedDay(date)} style={{paddingVertical:12,borderRadius:10,backgroundColor:trained?colors.highlight:colors.accentSoft,borderWidth:date===today?2:0,borderColor:colors.text}}><Text style={{textAlign:"center",color:trained?"#fff":colors.text,fontWeight:trained?"800":"400"}}>{d}</Text></Pressable>:<View style={{height:40}}/>}</View>;})}</View>
    </View>
    <View style={styles.card}>{heading("Čo precvičuješ","Pracovné série podľa hlavnej partie cviku; sekundárne svaly sa neduplikujú.")}
      {Object.entries(stats.groups).sort((a,b)=>b[1]-a[1]).map(([group,count],i)=><View key={group} style={{gap:5}}><View style={[styles.row,{justifyContent:"space-between"}]}><Text style={styles.text}>{group}</Text><Text style={styles.muted}>{count} sérií · {Math.round(count/Math.max(1,stats.sets)*100)} %</Text></View><View style={{height:10,backgroundColor:colors.accentSoft,borderRadius:6}}><View style={{height:10,width:`${count/Math.max(1,...Object.values(stats.groups))*100}%`,borderRadius:6,backgroundColor:palette[i%palette.length]}}/></View></View>)}
      {!stats.sets?<Text style={styles.muted}>Zatiaľ bez pracovných sérií.</Text>:null}
    </View>
    <View style={styles.card}>{heading("Osobné rekordy","Najlepšie uložené výkony v celej histórii, dosiahnuté vo vybranom období. Oddelené podľa cviku a pomôcky.")}
      {records.slice(0,showAll?records.length:8).map((r,i)=><View key={`${r.key}-${r.label}-${i}`} style={{padding:12,borderRadius:14,backgroundColor:colors.accentSoft,gap:4}}><Text style={[styles.text,{fontWeight:"800"}]}>★ {r.value} · {r.label}</Text><Text style={styles.text}>{r.machine.displayNameSk}</Text><Text style={styles.muted}>{r.context} · {r.date}</Text></View>)}
      {!records.length?<Text style={styles.muted}>Zatiaľ bez rekordov v tomto období. Aj prvý uložený výkon vytvorí základ na porovnanie.</Text>:null}
      {records.length>8?button(showAll?"Menej rekordov":"Všetky rekordy",false,()=>setShowAll(!showAll)):null}
    </View>
    <View style={styles.card}>{heading("Mesačný prehľad",reportMonth===monthKey(today)?"Aktuálny mesiac ešte nie je ukončený; porovnanie s celým minulým mesiacom je len priebežné.":"Porovnanie s predchádzajúcim kalendárnym mesiacom.")}{monthPicker(reportMonth,setReportMonth)}
      <Text style={styles.text}>{monthly.workouts} tréningových dní · {monthly.sets} pracovných sérií · {hours(monthly.duration)} zaznamenaného času</Text>
      <Text style={styles.muted}>{difference(monthly.workouts,priorMonthly.workouts)} · {monthly.unmeasured} tréningov bez času</Text>
      {Array.from({length:6},(_,i)=>monthKey(`${reportMonth}-01`,i-5)).map(m=>{const count=summarizeSessions(sessions.filter(s=>dateKey(s.workoutDate).startsWith(m)),getMachine).workouts;return <View key={m} style={[styles.row,{alignItems:"center"}]}><Text style={[styles.muted,{width:65}]}>{m}</Text><View style={{height:12,flex:1,backgroundColor:colors.accentSoft,borderRadius:5}}><View style={{height:12,width:`${Math.min(100,count/31*100)}%`,backgroundColor:m===reportMonth?colors.highlight:palette[1],borderRadius:5}}/></View><Text style={styles.text}>{count}</Text></View>;})}
      <Text style={styles.muted}>Počet tréningových dní za mesiac · stupnica 0–31.</Text>
      <Text style={[styles.text,{fontWeight:"700"}]}>{(()=>{const improved=allTrends.filter(t=>{const a=t.points.filter(p=>p.date.startsWith(monthKey(`${reportMonth}-01`,-1))).at(-1),b=t.points.filter(p=>p.date.startsWith(reportMonth)).at(-1);if(!a||!b)return false;return a.weight!==undefined&&b.weight!==undefined&&(t.loadType==="assisted"?b.weight<a.weight:b.weight>a.weight)||Object.keys(a.repsByWeight).some(w=>(b.repsByWeight[w]??0)>a.repsByWeight[w]);}).length;return improved?`V ${improved} porovnateľných cvikoch máš vyššiu váhu alebo viac opakovaní pri rovnakej váhe (pri dopomoci menej kg).` : "Zatiaľ bez potvrdeného zlepšenia oproti minulému mesiacu. Pravidelnosť a rovnaká technika pomáhajú porovnaniu.";})()}</Text>
    </View>
    <View style={styles.card}>{heading("Hmotnosť a pás","Samostatné stupnice; vývoj telesných mier neznamená automaticky zmenu svalovej hmoty.")}<Text style={styles.text}>Hmotnosť</Text><TrendChart points={measurements.map(m=>({date:m.date,value:m.weightKg}))} unit="kg" color={palette[1]}/><Text style={styles.text}>Obvod pása</Text><TrendChart points={measurements.flatMap(m=>m.waistCm===undefined?[]:[{date:m.date,value:m.waistCm}])} unit="cm" color={palette[4]}/></View>
    <BodyMeasurementsCard measurements={personalData.measurements} onSave={onSaveMeasurement}/>
    <Modal visible={selectedDay!==null} transparent animationType="fade" onRequestClose={()=>setSelectedDay(null)}><View style={{flex:1,backgroundColor:"rgba(0,0,0,0.65)",justifyContent:"center",padding:20}}><View style={[styles.card,{maxHeight:"85%"}]}>{heading(selectedDay??"")}{button("Zavrieť",false,()=>setSelectedDay(null))}<ScrollView>{sessions.filter(s=>dateKey(s.workoutDate)===selectedDay).map(s=><View key={s.id} style={{gap:8,paddingVertical:12}}><Text style={styles.text}>{s.focus} · {s.cleanDurationSec===undefined?"Čas nezaznamenaný":hours(s.cleanDurationSec)}</Text>{s.entries.map(e=><Text key={e.id} style={styles.muted}>{getMachine(e.machineId)?.displayNameSk??e.machineId}{e.accessoryNameSk?` · ${e.accessoryNameSk}`:""} · {workingSetsLabel(e)}</Text>)}</View>)}{!sessions.some(s=>dateKey(s.workoutDate)===selectedDay&&s.entries.length)?<Text style={styles.muted}>Bez uloženého tréningu.</Text>:null}</ScrollView></View></View></Modal>
  </ScrollView>;
}
function workingSetsLabel(entry: WorkoutSession["entries"][number]) { return entry.durationMin!==undefined?`${entry.durationMin} min`:`${entry.sets??"?"} sérií · ${entry.weightKg===undefined?"vlastná váha":`${entry.weightKg} kg`} · ${entry.reps??"?"} op.`; }
