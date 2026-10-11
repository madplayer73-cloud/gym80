import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Machine } from "../types";
import { getMachineImage } from "../utils/machineImages";
import { useTheme } from "../theme";

export function DumbbellReferenceCard({ machine }: { machine: Machine }) {
  const { colors } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [width, setWidth] = React.useState(280);
  const source = getMachineImage(machine.referenceAssets?.[0]);
  const muscleSource = getMachineImage(machine.referenceAssets?.[1]);
  if (!source) return null;
  // Clip only the displayed viewport. Original screenshots remain unchanged.
  const scale = width / 512;
  return <View style={{ gap: 12 }}>
    <View onLayout={e => setWidth(e.nativeEvent.layout.width)} style={{ aspectRatio: 512 / 280, overflow: "hidden", borderRadius: 16, backgroundColor: "white" }}>
      <Image source={source} accessibilityLabel={machine.modelName} style={{ position: "absolute", width: 576 * scale, height: 1280 * scale, left: -32 * scale, top: -(machine.referencePhotoTop ?? 382) * scale }} />
    </View>
    {muscleSource ? <>
      <Text style={{ color: colors.text, fontWeight: "700" }}>Svalové zameranie</Text>
      <Text style={{ color: colors.textMuted }}>{machine.primaryMuscles?.join(" · ")}</Text>
      <View style={{ aspectRatio: 512 / 500, overflow: "hidden", borderRadius: 16, backgroundColor: "white" }}>
        <Image source={muscleSource} accessibilityLabel={`Svalové zameranie: ${machine.primaryMuscles?.join(", ")}`} style={{ position: "absolute", width: 576 * scale, height: 1280 * scale, left: -32 * scale, top: -585 * scale }} />
      </View>
      <Text style={{ color: colors.textMuted, fontSize: 12 }}>Zvýraznené svaly podľa tvojho podkladu ku cviku.</Text>
    </> : null}
    <Pressable accessibilityRole="button" accessibilityState={{expanded:open}} onPress={() => setOpen(!open)} style={{ paddingVertical: 10 }}>
      <Text style={{ color: colors.highlight, fontWeight: "700" }}>{open ? "Schovať techniku a dýchanie" : "Technika a dýchanie"}</Text>
    </Pressable>
    {open ? <>
      <Text style={{ color: colors.text, fontWeight: "700" }}>Na čo si dať pozor?</Text>
      <Text style={{ color: colors.text }}>Chrbát drž rovný a stabilný, lakte pri tele a zápästia rovné. Nepomáhaj si švihom. Sústreď sa na kontrolovaný pohyb a správne vykonanie, nie na čo najväčšiu záťaž.</Text>
      <Text style={{ color: colors.text, fontWeight: "700" }}>Ako správne dýchať?</Text>
      <Text style={{ color: colors.text }}>Pri spúšťaní jednoručiek sa nadýchni, pri zdvíhaní vydýchni.</Text>
      <Text style={{ color: colors.text, fontWeight: "700" }}>Tvoje pôvodné podklady ku cviku</Text>
      <Text style={{ color: colors.textMuted }}>Popisky sú prepísané zo zaslaných podkladov do slovenčiny. Farebné svalové zameranie je pôvodný obrázok, nie meranie tvojho výkonu.</Text>
      {machine.referenceAssets?.map(asset => <Image key={asset} source={getMachineImage(asset) ?? undefined} resizeMode="contain" accessibilityLabel={`Podklad ${machine.modelName}`} style={{ width: "100%", aspectRatio: 576 / 1280, borderRadius: 12 }} />)}
    </> : null}
  </View>;
}
