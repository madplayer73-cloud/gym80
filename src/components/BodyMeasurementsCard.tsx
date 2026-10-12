import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { BodyMeasurement } from "../types";
import { useTheme } from "../theme";
import { bodyMetrics, BodyMetricKey, isBodyMeasurement, isBodyMeasurementDue } from "../utils/bodyMeasurements";
import { TrendChart } from "./TrendChart";

export function BodyMeasurementsCard({ measurements, onSave }: { measurements: BodyMeasurement[]; onSave: (entry: BodyMeasurement) => void }) {
  const { colors } = useTheme();
  const [date, setDate] = React.useState(() => new Date().toLocaleDateString("sv-SE"));
  const [values, setValues] = React.useState<Partial<Record<BodyMetricKey, string>>>({});
  const [advanced, setAdvanced] = React.useState(false);
  const [metric, setMetric] = React.useState<BodyMetricKey>("weightKg");
  const [message, setMessage] = React.useState("");
  const rows = [...measurements].sort((a,b)=>a.date.localeCompare(b.date));
  const latest = rows.at(-1);
  const loadMeasurement = (entry?: BodyMeasurement) => setValues(Object.fromEntries(bodyMetrics.map(m=>[m.key,entry?.[m.key]?.toString() ?? ""])));
  React.useEffect(() => { loadMeasurement(measurements.find(m=>m.date===date)); }, [date, measurements]);
  const edit = (entry: BodyMeasurement) => { setDate(entry.date); loadMeasurement(entry); setAdvanced(true); };
  const save = () => {
    const entry: BodyMeasurement = {id:`body-${date}`,date,weightKg:NaN};
    for (const field of bodyMetrics) {
      const value = values[field.key]?.trim();
      if (value) entry[field.key] = Number(value.replace(",", "."));
    }
    if (!isBodyMeasurement(entry) || date > new Date().toLocaleDateString("sv-SE")) {
      setMessage("Skontroluj dátum a hodnoty. Hmotnosť je povinná; ostatné údaje nechaj prázdne, ak ich nepoznáš."); return;
    }
    onSave(entry);
    setMessage("Meranie uložené. Zápis na rovnaký dátum aktualizuje existujúce meranie.");
  };
  const selected = bodyMetrics.find(m=>m.key===metric)!;
  const action = (label:string,onPress:()=>void) => <Pressable accessibilityRole="button" onPress={onPress} style={{minHeight:44,paddingVertical:12}}><Text style={{color:colors.highlight,fontWeight:"700"}}>{label}</Text></Pressable>;
  return <View style={{backgroundColor:colors.surface,borderRadius:18,padding:16,gap:12}}>
    <Text style={{color:colors.text,fontSize:22,fontWeight:"800"}}>Moje telo</Text>
    <Text style={{color:colors.textMuted,lineHeight:20}}>Údaje z tvojej váhy. Povinná je iba hmotnosť. Kalórie tréningu použijú meranie platné k jeho dátumu.</Text>
    <Text style={{color:colors.highlight}}>{isBodyMeasurementDue(measurements) ? "Týždenná pripomienka: odváž sa a zapíš nové meranie." : "Tento týždeň máš meranie zapísané."} Každú nedeľu od 9:00 pri otvorení aplikácie.</Text>
    {latest ? <View style={{gap:8,backgroundColor:colors.accentSoft,borderRadius:14,padding:12}}>
      <Text style={{color:colors.text,fontWeight:"700"}}>Posledné meranie · {latest.date}</Text>
      {bodyMetrics.filter(m=>latest[m.key]!==undefined).map(m=><Text key={m.key} style={{color:colors.text}}>{m.label}: {latest[m.key]!.toLocaleString("sk-SK")} {m.unit}</Text>)}
      {action("Upraviť posledné meranie",()=>edit(latest))}
    </View> : null}
    <Text style={{color:colors.textMuted}}>Datum (RRRR-MM-DD)</Text>
    <TextInput accessibilityLabel="Datum (RRRR-MM-DD)" value={date} onChangeText={setDate} style={{backgroundColor:colors.inputSurface,color:colors.text,padding:12,borderRadius:10}}/>
    {bodyMetrics.filter((_,i)=>advanced || i<2).map(field=>{
      const label=field.key==="weightKg" ? "Hmotnost v kg" : field.key==="waistCm" ? "Obvod pasa v cm (volitelny)" : `${field.label}${field.unit ? ` (${field.unit})` : ""}`;
      return <View key={field.key} style={{gap:5}}><Text style={{color:colors.textMuted}}>{label}</Text><TextInput accessibilityLabel={label} value={values[field.key]??""} onChangeText={value=>setValues(current=>({...current,[field.key]:value}))} keyboardType="decimal-pad" style={{backgroundColor:colors.inputSurface,color:colors.text,padding:12,borderRadius:10}}/></View>;
    })}
    <Pressable accessibilityRole="button" accessibilityState={{expanded:advanced}} onPress={()=>setAdvanced(!advanced)} style={{minHeight:44,justifyContent:"center"}}><Text style={{color:colors.highlight,fontWeight:"700"}}>{advanced ? "Schovať údaje z osobnej váhy" : "Ďalšie údaje z osobnej váhy"}</Text></Pressable>
    {action("Ulozit meranie",save)}
    {message ? <Text accessibilityRole="alert" style={{color:colors.textMuted}}>{message}</Text> : null}
    <Text style={{color:colors.textMuted,lineHeight:20}}>Zloženie tela, metabolizmus, skóre, ideálna váha a telesný vek sú odhady zariadenia, nie diagnóza. Bazálny metabolizmus nie je výdaj tréningu. Pri porovnaní používaj rovnaké zariadenie a podobné podmienky; prázdne hodnoty nedopočítavame.</Text>
    <Text style={{color:colors.text,fontSize:18,fontWeight:"700"}}>Vývoj meraní</Text>
    <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>{bodyMetrics.map(m=><Pressable key={m.key} accessibilityRole="button" accessibilityState={{selected:metric===m.key}} onPress={()=>setMetric(m.key)} style={{padding:10,borderRadius:12,maxWidth:"100%",backgroundColor:metric===m.key?colors.highlightSoft:colors.accentSoft}}><Text style={{color:metric===m.key?colors.highlight:colors.text}}>{m.label}</Text></Pressable>)}</View>
    <TrendChart points={rows.flatMap(m=>m[metric]===undefined?[]:[{date:m.date,value:m[metric]!}])} unit={selected.unit} color={colors.highlight}/>
    {rows.slice().reverse().map(row=><View key={row.id} style={{borderTopWidth:1,borderColor:colors.border,paddingTop:8}}><Text style={{color:colors.text}}>{row.date} · {row.weightKg.toLocaleString("sk-SK")} kg</Text>{action(`Upraviť meranie ${row.date}`,()=>edit(row))}</View>)}
  </View>;
}
