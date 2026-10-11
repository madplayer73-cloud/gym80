import React from "react";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "../theme";

export function TrendChart({ points, unit, color, zeroBaseline = false }: {
  points: Array<{ date: string; value: number }>; unit: string; color: string; zeroBaseline?: boolean;
}) {
  const { colors } = useTheme(); const [width, setWidth] = React.useState(260); const [selected, setSelected] = React.useState<string | null>(null);
  const clean = points.filter(p => Number.isFinite(p.value));
  if (!clean.length) return <Text style={{color:colors.textMuted}}>Zatiaľ bez údajov pre tento graf.</Text>;
  const values = clean.map(p => p.value), low = Math.min(...values), high = Math.max(...values);
  const padding = Math.max((high-low)*0.12, 1);
  const min = zeroBaseline ? 0 : Math.max(0, low-padding), max = high+padding, height = 100;
  const dates = clean.map(p => new Date(`${p.date}T12:00:00Z`).getTime());
  const span = dates[dates.length - 1] - dates[0];
  const coords = clean.map((p,i) => ({...p, x: 8 + (span > 0 ? (dates[i]-dates[0])/span*(width-16) : (width-16)/2), y: 8+(1-(p.value-min)/(max-min))*height }));
  const chosen = clean.find(p => p.date === selected) ?? clean[clean.length-1];
  return <View style={{gap:6}}>
    <Text style={{color:colors.text,fontWeight:"700"}}>{chosen.date}: {chosen.value.toLocaleString("sk-SK")} {unit}</Text>
    <View onLayout={e=>setWidth(Math.max(80,e.nativeEvent.layout.width))} style={{height:120,position:"relative",borderBottomWidth:1,borderColor:colors.border}}>
      {[0,0.5,1].map(t=><View key={t} style={{position:"absolute",top:8+t*height,left:0,right:0,borderTopWidth:1,borderColor:colors.border,opacity:0.4}} />)}
      {coords.slice(1).map((p,i)=>{const prev=coords[i], dx=p.x-prev.x,dy=p.y-prev.y;return <View key={`line-${i}`} pointerEvents="none" style={{position:"absolute",left:(p.x+prev.x)/2-Math.hypot(dx,dy)/2,top:(p.y+prev.y)/2-1,height:2,width:Math.hypot(dx,dy),backgroundColor:color,transform:[{rotate:`${Math.atan2(dy,dx)}rad`}]}}/>;})}
      {coords.map((p,i)=><Pressable key={`${p.date}-${i}`} accessibilityRole="button" accessibilityLabel={`${p.date}: ${p.value} ${unit}`} onPress={()=>setSelected(p.date)} style={{position:"absolute",left:p.x-14,top:p.y-14,width:28,height:28,alignItems:"center",justifyContent:"center"}}><View style={{width:chosen.date===p.date?10:7,height:chosen.date===p.date?10:7,borderRadius:6,backgroundColor:color}}/></Pressable>)}
    </View>
    <View style={{flexDirection:"row",justifyContent:"space-between"}}><Text style={{color:colors.textMuted,fontSize:11}}>{clean[0].date}</Text><Text style={{color:colors.textMuted,fontSize:11}}>{clean[clean.length-1].date}</Text></View>
    <Text style={{color:colors.textMuted,fontSize:11}}>Rozsah {Math.round(min*10)/10}–{Math.round(max*10)/10} {unit} · ťukni na bod{clean.length===1?" · prvý zápis, zatiaľ bez trendu":""}</Text>
  </View>;
}
