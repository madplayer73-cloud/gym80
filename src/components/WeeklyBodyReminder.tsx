import React from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { BodyMeasurement } from "../types";
import { bodyMetrics, BodyMetricKey, isBodyMeasurement } from "../utils/bodyMeasurements";
import { recognizeScaleScreenshots } from "../utils/scaleScreenshotOcr";
import { useTheme } from "../theme";

export function WeeklyBodyReminder({ visible, onClose, onSave }: {
  visible: boolean; onClose: () => void; onSave: (measurement: BodyMeasurement) => void;
}) {
  const { colors } = useTheme();
  const [date, setDate] = React.useState(() => new Date().toLocaleDateString("sv-SE"));
  const [values, setValues] = React.useState<Partial<Record<BodyMetricKey,string>>>({});
  const [status, setStatus] = React.useState("");
  const [working, setWorking] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const processScreenshots = async (files: File[]) => {
    if (!files.length) return;
    setWorking(true); setStatus(`Načítavam ${files.length} screenshot${files.length === 1 ? "" : "y"}…`);
    try {
      const images = await Promise.all(files.map(file => new Promise<string>((resolve,reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file);
      })));
      const parsed = await recognizeScaleScreenshots(images, progress => setStatus(`Rozpoznávam údaje… ${Math.round(progress*100)} %`));
      setValues(current => ({...current,...Object.fromEntries(Object.entries(parsed).map(([key,value])=>[key,String(value)]))}));
      const count = Object.keys(parsed).length;
      setStatus(count ? `Našiel som ${count} hodnôt. Skontroluj ich a potom ulož.` : "Hodnoty sa nepodarilo spoľahlivo rozpoznať. Zadaj ich ručne.");
    } catch (error) {
      console.log("Scale screenshot OCR failed", error);
      setStatus("Rozpoznanie sa nepodarilo. Skús ostrejší screenshot alebo zadaj hmotnosť ručne.");
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
  const styles = StyleSheet.create({backdrop:{flex:1,backgroundColor:"rgba(0,0,0,0.72)",justifyContent:"flex-start",padding:12,paddingTop:36},card:{maxHeight:"90%",minHeight:"55%",backgroundColor:colors.surface,borderRadius:24,borderWidth:1,borderColor:colors.border,overflow:"hidden"},content:{padding:18,gap:12},title:{fontSize:26,fontWeight:"900",color:colors.text},text:{color:colors.textMuted,lineHeight:20},label:{color:colors.textMuted,fontSize:13},input:{backgroundColor:colors.inputSurface,color:colors.text,padding:12,borderRadius:10},primary:{minHeight:48,borderRadius:14,backgroundColor:colors.highlight,alignItems:"center",justifyContent:"center",paddingHorizontal:12},primaryText:{fontWeight:"800",color:"#fff",textAlign:"center"},secondary:{minHeight:44,alignItems:"center",justifyContent:"center",paddingHorizontal:10},secondaryText:{color:colors.highlight,fontWeight:"700",textAlign:"center"},grid:{flexDirection:"row",flexWrap:"wrap",gap:10},field:{width:"48%",minWidth:130,flexGrow:1,gap:5}});
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><View style={styles.backdrop}><View style={styles.card}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>Zadaj aktuálne údaje</Text>
    <Text style={styles.text}>Je čas na týždenné meranie. Nahraj najviac 2 screenshoty z osobnej váhy alebo zadaj hodnoty ručne.</Text>
    {Platform.OS === "web" ? <input ref={fileInputRef} type="file" accept="image/*" multiple aria-label="Screenshoty z osobnej váhy" style={{display:"none"}} onChange={event=>void processScreenshots(Array.from(event.currentTarget.files??[]).slice(0,2))}/> : null}
    <Pressable accessibilityRole="button" disabled={working} onPress={chooseScreenshots} style={[styles.primary,working&&{opacity:0.6}]}><Text style={styles.primaryText}>{working?"Rozpoznávam screenshoty…":"Nahrať 1–2 screenshoty"}</Text></Pressable>
    <Text style={styles.text}>Screenshoty sa spracujú iba v tomto zariadení. Pred uložením vždy skontroluj rozpoznané čísla.</Text>
    <View><Text style={styles.label}>Dátum</Text><TextInput accessibilityLabel="Dátum merania" value={date} onChangeText={setDate} style={styles.input}/></View>
    <View style={styles.grid}>{bodyMetrics.map(field=><View key={field.key} style={styles.field}><Text style={styles.label}>{field.label}{field.unit?` (${field.unit})`:""}</Text><TextInput accessibilityLabel={`Pripomienka ${field.label}`} value={values[field.key]??""} onChangeText={value=>setValues(current=>({...current,[field.key]:value}))} keyboardType="decimal-pad" style={styles.input}/></View>)}</View>
    {status?<Text accessibilityRole="alert" style={styles.text}>{status}</Text>:null}
    <Pressable accessibilityRole="button" onPress={save} style={styles.primary}><Text style={styles.primaryText}>Skontrolované · uložiť meranie</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={onClose} style={styles.secondary}><Text style={styles.secondaryText}>Pripomenúť neskôr</Text></Pressable>
  </ScrollView></View></View></Modal>;
}
