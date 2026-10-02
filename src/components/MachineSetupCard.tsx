import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { MachineSetup } from "../types";
import { useTheme } from "../theme";

export function MachineSetupCard({ setup, lastWeight, onSave }: { setup?: MachineSetup; lastWeight?: number; onSave: (setup: MachineSetup) => void }) {
  const { colors } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState<MachineSetup>(setup ?? { seat: "", backPad: "", cable: "", other: "" });
  React.useEffect(() => { setValues(setup ?? { seat: "", backPad: "", cable: "", other: "" }); }, [setup]);
  const summary = [setup?.seat && `Sedadlo ${setup.seat}`, setup?.backPad && `Opierka ${setup.backPad}`, setup?.cable && `Kladka ${setup.cable}`, setup?.other, lastWeight !== undefined && `Minule ${lastWeight} kg`].filter(Boolean).join(" · ");
  return <View style={{ backgroundColor: colors.accentSoft, borderRadius: 16, padding: 14, gap: 10 }}>
    <Text style={{ color: colors.text, fontWeight: "700" }}>Moje nastavenie stroja</Text>
    <Text style={{ color: colors.text }}>{summary || "Uloz si sedadlo, opierku alebo polohu kladky."}</Text>
    <Pressable accessibilityRole="button" onPress={() => setOpen(!open)}><Text style={{ color: colors.highlight, paddingVertical: 10 }}>{open ? "Zavriet nastavenie" : "Upravit nastavenie"}</Text></Pressable>
    {open ? <>
      {([["seat", "Sedadlo"], ["backPad", "Opierka"], ["cable", "Poloha kladky"], ["other", "Dalsie nastavenie / uchop"]] as const).map(([key, label]) => <View key={key}>
        <Text style={{ color: colors.textMuted }}>{label}</Text>
        <TextInput accessibilityLabel={label} value={values[key]} maxLength={120} onChangeText={(text) => setValues({ ...values, [key]: text })} style={{ color: colors.text, backgroundColor: colors.inputSurface, padding: 12, borderRadius: 10 }} />
      </View>)}
      <Pressable accessibilityRole="button" onPress={() => { onSave(values); setOpen(false); }}><Text style={{ color: colors.highlight, paddingVertical: 12, fontWeight: "700" }}>Ulozit nastavenie stroja</Text></Pressable>
    </> : null}
  </View>;
}
