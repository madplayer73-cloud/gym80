import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { MachineSetup } from "../types";
import { useTheme } from "../theme";
import { parseAvailableWeights } from "../utils/availableWeights";

export function DumbbellSettingsCard({setup, weights, onSaveSetup, onSaveWeights}: {
  setup?: MachineSetup; weights?: number[]; onSaveSetup: (setup:MachineSetup)=>void; onSaveWeights:(weights:number[])=>void;
}) {
  const {colors} = useTheme();
  const [open,setOpen] = React.useState(false);
  const [note,setNote] = React.useState(setup?.other ?? "");
  const [raw,setRaw] = React.useState((weights ?? []).join("; "));
  const [error,setError] = React.useState("");
  React.useEffect(()=>setNote(setup?.other ?? ""),[setup?.other]);
  React.useEffect(()=>setRaw((weights ?? []).join("; ")),[weights]);
  return <View style={{padding:14,borderRadius:16,gap:10,backgroundColor:colors.accentSoft}}>
    <Text style={{color:colors.text,fontWeight:"700"}}>Moje jednoručky a trvalá poznámka</Text>
    <Text style={{color:colors.text}}>{setup?.other || "Zatiaľ bez trvalej poznámky k tomuto cviku."}</Text>
    <Text style={{color:colors.textMuted}}>Váhy vo fitku: {weights?.length ? `${weights.join(" · ")} kg` : "nenastavené"}</Text>
    <Pressable accessibilityRole="button" onPress={()=>setOpen(!open)}><Text style={{color:colors.highlight,paddingVertical:10}}>{open?"Schovať nastavenia":"Upraviť poznámku a dostupné váhy"}</Text></Pressable>
    {open ? <>
      <Text style={{color:colors.text}}>Trvalá poznámka len k tomuto cviku</Text>
      <TextInput accessibilityLabel="Trvalá poznámka k cviku" value={note} maxLength={120} onChangeText={setNote} placeholder="Napr. v sede, lavička 60°" style={{backgroundColor:colors.inputSurface,color:colors.text,padding:12,borderRadius:10}} />
      <Text style={{color:colors.text}}>Dostupné váhy jednej jednoručky — spoločné pre všetky cviky</Text>
      <TextInput accessibilityLabel="Dostupné váhy jednoručiek" value={raw} onChangeText={setRaw} placeholder="8; 10; 12; 14" style={{backgroundColor:colors.inputSurface,color:colors.text,padding:12,borderRadius:10}} />
      <Text style={{color:colors.textMuted}}>Oddeľ ich bodkočiarkou alebo medzerou. Prázdne pole vypne obmedzenie na dostupné váhy. Dnešné rozpracované série sa uložením nastavenia neprepíšu.</Text>
      {error ? <Text accessibilityRole="alert" style={{color:colors.text}}>{error}</Text> : null}
      <Pressable accessibilityRole="button" onPress={()=>{
        try { const parsed=parseAvailableWeights(raw); onSaveWeights(parsed); onSaveSetup({...setup,seat:setup?.seat??"",backPad:setup?.backPad??"",cable:setup?.cable??"",other:note}); setError(""); setOpen(false); }
        catch(e) {setError(e instanceof Error?e.message:"Skontroluj váhy.");}
      }}><Text style={{color:colors.highlight,paddingVertical:12,fontWeight:"700"}}>Uložiť nastavenia jednoručiek</Text></Pressable>
    </> : null}
  </View>;
}
