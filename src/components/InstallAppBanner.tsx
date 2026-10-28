import React from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useTheme } from "../theme";

type InstallPrompt = Event & {prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed"}>};

export function InstallAppBanner() {
  const {colors}=useTheme();
  const [prompt,setPrompt]=React.useState<InstallPrompt|null>(null);
  const [busy,setBusy]=React.useState(false);
  React.useEffect(()=>{
    if(Platform.OS!=="web" || typeof window==="undefined" || window.matchMedia("(display-mode: standalone)").matches) return;
    const ready=(event:Event)=>{event.preventDefault();setPrompt(event as InstallPrompt);};
    const installed=()=>setPrompt(null);
    window.addEventListener("beforeinstallprompt",ready);
    window.addEventListener("appinstalled",installed);
    return ()=>{window.removeEventListener("beforeinstallprompt",ready);window.removeEventListener("appinstalled",installed);};
  },[]);
  if(!prompt) return null;
  const install=async()=>{
    setBusy(true);
    try {await prompt.prompt();await prompt.userChoice;setPrompt(null);}
    catch {setPrompt(null);}
    finally {setBusy(false);}
  };
  return <View style={{backgroundColor:colors.surface,padding:12,borderBottomWidth:1,borderBottomColor:colors.highlight}}>
    <Pressable accessibilityRole="button" disabled={busy} onPress={()=>void install()} style={{backgroundColor:colors.highlight,borderRadius:14,padding:13,alignItems:"center"}}>
      <Text style={{color:"#101014",fontWeight:"900"}}>{busy?"Otváram inštaláciu…":"Nainštalovať Gym80"}</Text>
    </Pressable>
  </View>;
}
