import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Machine, PersonalRoutine } from "../types";
import { useTheme } from "../theme";
import { getMachineSearchCodes } from "../utils/machineImages";

export function PersonalRoutinePanel({ machines, routines, selectedId, disabled, onSelect, onSave }: {
  machines: Machine[]; routines: PersonalRoutine[]; selectedId?: "A" | "B"; disabled: boolean;
  onSelect: (id?: "A" | "B") => void; onSave: (routine: PersonalRoutine) => void;
}) {
  const { colors } = useTheme();
  const [editing, setEditing] = React.useState<PersonalRoutine | null>(null);
  const [query, setQuery] = React.useState("");
  const action = { color: colors.highlight, paddingVertical: 12, fontWeight: "700" as const };
  const changeOrder = (index: number, direction: number) => {
    if (!editing || index + direction < 0 || index + direction >= editing.machineIds.length) return;
    const ids = [...editing.machineIds];
    [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]];
    setEditing({ ...editing, machineIds: ids });
  };
  return <View style={{ backgroundColor: colors.surface, padding: 16, borderRadius: 18, gap: 8 }}>
    <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>Moje treningy A / B</Text>
    <Text style={{ color: colors.textMuted }}>Tvoje stale stroje a poradie. Trener prisposobi serie a progres, nie vyber cvikov.</Text>
    {disabled ? <Text style={{ color: colors.textMuted }}>Prebiehajuci rozpis ostava zachovany. Vyber zmenis po ukonceni treningu.</Text> : <>
      <Pressable accessibilityRole="button" onPress={() => onSelect(undefined)}><Text style={action}>{!selectedId ? "✓ " : ""}Automaticky navrh</Text></Pressable>
      {(["A", "B"] as const).map((id) => {
        const routine = routines.find((item) => item.id === id);
        return <View key={id} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Pressable accessibilityRole="button" disabled={!routine?.machineIds.length} style={{ flex: 1 }} onPress={() => onSelect(id)}>
            <Text style={{ ...action, color: routine?.machineIds.length ? colors.highlight : colors.textMuted }}>{selectedId === id ? "✓ " : ""}{routine?.name ?? `Trening ${id}`} · {routine?.machineIds.length ?? 0} cvikov</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => { setEditing(routine ?? { id, name: `Trening ${id}`, machineIds: [] }); setQuery(""); }}><Text style={action}>Upravit {id}</Text></Pressable>
        </View>;
      })}
    </>}
    {editing && !disabled ? <View style={{ gap: 8 }}>
      <TextInput accessibilityLabel="Nazov mojho treningu" value={editing.name} maxLength={60} onChangeText={(name) => setEditing({ ...editing, name })} style={{ padding: 12, color: colors.text, backgroundColor: colors.inputSurface, borderRadius: 10 }} />
      {editing.machineIds.map((id, index) => <View key={id} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text style={{ color: colors.text, flex: 1 }}>{index + 1}. {machines.find((machine) => machine.id === id)?.displayNameSk ?? id}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Posunut cvik ${index + 1} hore`} onPress={() => changeOrder(index, -1)}><Text style={action}>↑</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Posunut cvik ${index + 1} dole`} onPress={() => changeOrder(index, 1)}><Text style={action}>↓</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Odobrat cvik ${index + 1} z rozpisu`} onPress={() => setEditing({ ...editing, machineIds: editing.machineIds.filter((item) => item !== id) })}><Text style={action}>−</Text></Pressable>
      </View>)}
      <TextInput placeholder="Pridat stroj: nazov alebo cislo" accessibilityLabel="Hladat stroj do treningu" value={query} onChangeText={setQuery} style={{ padding: 12, color: colors.text, backgroundColor: colors.inputSurface, borderRadius: 10 }} placeholderTextColor={colors.textMuted} />
      {query.trim() ? machines.filter((machine) => !editing.machineIds.includes(machine.id) && `${machine.displayNameSk} ${getMachineSearchCodes(machine).join(" ")}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).slice(0, 12).map((machine) =>
        <Pressable key={machine.id} accessibilityRole="button" onPress={() => { setEditing({ ...editing, machineIds: [...editing.machineIds, machine.id] }); setQuery(""); }}><Text style={action}>+ {machine.displayNameSk}</Text></Pressable>) : null}
      <Pressable accessibilityRole="button" onPress={() => { onSave({ ...editing, name: editing.name.trim() || `Trening ${editing.id}` }); setEditing(null); }}><Text style={action}>Ulozit trening {editing.id}</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => setEditing(null)}><Text style={{ color: colors.textMuted, paddingVertical: 12 }}>Zrusit upravy</Text></Pressable>
    </View> : null}
  </View>;
}
