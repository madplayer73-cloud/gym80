import React from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { BodyMeasurement } from "../types";
import { bodyMetrics, BodyMetricKey, isBodyMeasurement } from "../utils/bodyMeasurements";
import { recognizeScaleScreenshots, scaleScreenshotMetricKeys } from "../utils/scaleScreenshotOcr";
import { useTheme } from "../theme";

export function WeeklyBodyReminder({ visible, onClose, onSave }: {
  visible: boolean; onClose: () => void; onSave: (measurement: BodyMeasurement) => void;
}) {
  const { colors } = useTheme();
  const [date, setDate] = React.useState(() => new Date().toLocaleDateString("sv-SE"));
  const [values, setValues] = React.useState<Partial<Record<BodyMetricKey,string>>>({});
  const [status, setStatus] = React.useState("");
  const [working, setWorking] = React.useState(false);
  const [recognizedCount, setRecognizedCount] = React.useState(0);
  const [selectedCount, setSelectedCount] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const replacePhotoValues = (current: Partial<Record<BodyMetricKey,string>>, parsed: Partial<Record<BodyMetricKey,unknown>> = {}) => {
    const next = {...current};
    for (const key of [...scaleScreenshotMetricKeys, "idealWeightKg" as const]) delete next[key];
    for (const [key,value] of Object.entries(parsed)) if (value != null) next[key as BodyMetricKey] = String(value);
    return next;
  };
  const processScreenshots = async (files: File[]) => {
    if (!files.length) return;
    if (files.length !== 3) {
      setSelectedCount(files.length); setRecognizedCount(0);
      setValues(current => replacePhotoValues(current));
      setStatus(`Vyber naraz presne 3 screenshoty. Teraz si vybral ${files.length}.`);
      return;
    }
    setSelectedCount(files.length); setRecognizedCount(0);
    setValues(current => replacePhotoValues(current));
    setWorking(true); setStatus(`Načítavam ${files.length} screenshoty…`);
    try {
      const images = await Promise.all(files.map(file => new Promise<string>((resolve,reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file);
      })));
      const parsed = await recognizeScaleScreenshots(images, progress => setStatus(`Rozpoznávam údaje… ${Math.round(progress*100)} %`));
      setValues(current => replacePhotoValues(current, parsed));
      const count = scaleScreenshotMetricKeys.filter(key => parsed[key] != null).length;
      setRecognizedCount(count);
      const missing = scaleScreenshotMetricKeys.filter(key => parsed[key] == null);
      setStatus(missing.length === 0
        ? `Načítané ${count}/${scaleScreenshotMetricKeys.length}. Hodnoty sa zhodli pri opakovanom čítaní. Porovnaj ich s fotkami, skontroluj dátum a doplň obvod pása.`
        : `Overené ${count}/${scaleScreenshotMetricKeys.length}. Nejasné alebo rozdielne výsledky ostali prázdne. Doplň zvýraznené polia podľa fotiek a skontroluj dátum.`);
    } catch (error) {
      console.log("Scale screenshot OCR failed", error);
      setValues(current => replacePhotoValues(current));
      setStatus("Fotky sa nepodarilo spoľahlivo prečítať alebo obsahujú rozdielne merania. Vyber 3 snímky jedného merania znova, prípadne doplň údaje ručne.");
    } finally { setWorking(false); }
  };
  const chooseScreenshots = () => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      setStatus("Nahratie screenshotov je zatiaľ dostupné vo webovej verzii Gym80."); return;
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    fileInputRef.current?.click();
  };
  const save = () => {
    const missingRequired = selectedCount === 3 && scaleScreenshotMetricKeys.some(key => !values[key]?.trim());
    if (working || missingRequired) {
      setStatus("Ešte chýba údaj z fotografie. Doplň zvýraznené pole ručne alebo nahraj 3 screenshoty znova.");
      return;
    }
    const entry: BodyMeasurement = {id:`body-${date}`,date,weightKg:NaN};
    for (const field of bodyMetrics) {
      const raw = values[field.key]?.trim();
      if (raw) entry[field.key] = Number(raw.replace(",","."));
    }
    if (!isBodyMeasurement(entry) || date > new Date().toLocaleDateString("sv-SE")) {
      setStatus("Skontroluj dátum a hmotnosť. Ostatné hodnoty sú voliteľné."); return;
    }
    onSave(entry); onClose();
  };
  const styles = StyleSheet.create({
    backdrop:{flex:1,backgroundColor:"rgba(0,0,0,0.82)",justifyContent:"flex-start",padding:10,paddingTop:14},
    card:{maxHeight:"96%",backgroundColor:colors.surface,borderRadius:28,borderWidth:2,borderColor:"#ff8a22",overflow:"hidden",shadowColor:"#ff6b1a",shadowOpacity:0.35,shadowRadius:18,shadowOffset:{width:0,height:8}},
    hero:{backgroundColor:"#ef6c19",padding:20,gap:10},heroTop:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},eyebrow:{color:"#fff4df",fontSize:12,fontWeight:"900",letterSpacing:1},weekDot:{width:42,height:42,borderRadius:21,backgroundColor:"#b9ed55",alignItems:"center",justifyContent:"center"},weekDotText:{color:"#16200a",fontWeight:"900",fontSize:13},
    title:{fontSize:29,fontWeight:"900",lineHeight:32,color:"#ffffff"},heroText:{color:"#fff4e8",lineHeight:20,fontWeight:"600"},steps:{flexDirection:"row",gap:6,flexWrap:"wrap"},step:{backgroundColor:"rgba(255,255,255,0.2)",borderRadius:999,paddingVertical:6,paddingHorizontal:9},stepText:{color:"#fff",fontWeight:"800",fontSize:12},
    content:{padding:16,gap:12},uploadCard:{backgroundColor:colors.highlightSoft,borderRadius:18,borderWidth:2,borderStyle:"dashed",borderColor:colors.highlight,padding:14,gap:9},uploadTitle:{color:colors.text,fontWeight:"900",fontSize:17},text:{color:colors.textMuted,lineHeight:20},hint:{color:colors.textMuted,fontSize:12,lineHeight:17},
    label:{color:colors.textMuted,fontSize:13,fontWeight:"700"},input:{backgroundColor:colors.inputSurface,color:colors.text,padding:12,borderRadius:10,borderWidth:1,borderColor:colors.inputBorder},filledInput:{borderWidth:2,borderColor:colors.success},
    primary:{minHeight:50,borderRadius:14,backgroundColor:colors.highlight,alignItems:"center",justifyContent:"center",paddingHorizontal:12},primaryText:{fontWeight:"900",color:"#fff",textAlign:"center"},uploadButton:{backgroundColor:"#17110d"},
    statusCard:{padding:12,borderRadius:12,backgroundColor:colors.highlightSoft,borderLeftWidth:5,borderLeftColor:colors.highlight},statusSuccess:{backgroundColor:"rgba(80,180,120,0.16)",borderLeftColor:colors.success},statusText:{color:colors.text,fontWeight:"800",lineHeight:19},missingInput:{borderWidth:2,borderColor:"#ff5a5f"},
    secondary:{minHeight:44,alignItems:"center",justifyContent:"center",paddingHorizontal:10},secondaryText:{color:colors.highlight,fontWeight:"800",textAlign:"center"},grid:{flexDirection:"row",flexWrap:"wrap",gap:10},field:{width:"48%",minWidth:130,flexGrow:1,gap:5},privacy:{alignSelf:"flex-start",backgroundColor:colors.chipSurface,paddingVertical:6,paddingHorizontal:10,borderRadius:999},privacyText:{color:colors.chipText,fontSize:12,fontWeight:"700"}
  });
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.backdrop}><View style={styles.card}><ScrollView>
    <View style={styles.hero}>
      <View style={styles.heroTop}><Text style={styles.eyebrow}>● TÝŽDENNÝ CHECK-IN</Text><View style={styles.weekDot}><Text style={styles.weekDotText}>7 DNÍ</Text></View></View>
      <Text style={styles.title}>Malý check. Veľký prehľad.</Text>
      <Text style={styles.heroText}>Tri fotky z váhy premením na prehľad progresu. Poradie fotografií nehrá úlohu.</Text>
      <View style={styles.steps}><View style={styles.step}><Text style={styles.stepText}>1  Odváž sa</Text></View><View style={styles.step}><Text style={styles.stepText}>2  Nahraj 3 fotky</Text></View><View style={styles.step}><Text style={styles.stepText}>3  Skontroluj</Text></View></View>
    </View>
    <View style={styles.content}>
    <View style={styles.uploadCard}>
      <Text style={styles.uploadTitle}>📸 Nahraj presne tieto 3 obrazovky</Text>
      <Text style={styles.text}>Vyber ich naraz. Údaje nájdem podľa názvov, takže môžu byť v ľubovoľnom poradí.</Text>
      {Platform.OS === "web" ? <input ref={fileInputRef} type="file" accept="image/*" multiple aria-label="Tri screenshoty z osobnej váhy" style={{display:"none"}} onChange={event=>void processScreenshots(Array.from(event.currentTarget.files??[]))}/> : null}
      <Pressable accessibilityRole="button" disabled={working} onPress={chooseScreenshots} style={[styles.primary,styles.uploadButton,working&&{opacity:0.6}]}><Text style={styles.primaryText}>{working?"Rozpoznávam údaje…":"Vybrať 3 screenshoty"}</Text></Pressable>
      <View style={styles.privacy}><Text style={styles.privacyText}>🔒 Fotky ostávajú v tomto zariadení</Text></View>
      {selectedCount ? <Text style={styles.hint}>Vybrané fotografie: {selectedCount}/3</Text> : null}
    </View>
    {status?<View style={[styles.statusCard,recognizedCount===scaleScreenshotMetricKeys.length&&styles.statusSuccess]}><Text accessibilityRole="alert" style={styles.statusText}>{recognizedCount===scaleScreenshotMetricKeys.length?"✓ ":""}{status}</Text></View>:null}
    <View><Text style={styles.label}>Dátum</Text><TextInput accessibilityLabel="Dátum merania" value={date} onChangeText={setDate} style={styles.input}/></View>
    <View style={styles.grid}>{bodyMetrics.map(field=>{const missing=selectedCount===3&&scaleScreenshotMetricKeys.includes(field.key)&&!values[field.key]?.trim(); return <View key={field.key} style={styles.field}><Text style={styles.label}>{field.label}{field.key==="waistCm"?" · ručne":field.key==="idealWeightKg"?" · voliteľné":""}{field.unit?` (${field.unit})`:""}</Text><TextInput accessibilityLabel={`Pripomienka ${field.label}`} value={values[field.key]??""} onChangeText={value=>setValues(current=>({...current,[field.key]:value}))} keyboardType="decimal-pad" style={[styles.input,values[field.key]?styles.filledInput:null,missing?styles.missingInput:null]}/></View>})}</View>
    <Pressable accessibilityRole="button" disabled={working} onPress={save} style={[styles.primary,working&&{opacity:0.6}]}><Text style={styles.primaryText}>Skontrolované · uložiť meranie</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={onClose} style={styles.secondary}><Text style={styles.secondaryText}>Pripomenúť neskôr</Text></Pressable>
    </View>
  </ScrollView></View></View></Modal>;
}
