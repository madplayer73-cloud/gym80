import { MachineAccessoryId } from "../types";

export type MachineAccessory = {
  id: MachineAccessoryId;
  nameSk: string;
  imageAsset: string;
};

export const machineAccessories: MachineAccessory[] = [
  {
    id: "2110",
    nameSk: "Široká tyč na sťahovanie",
    imageAsset: "2110_lat_bar.webp"
  },
  {
    id: "2112",
    nameSk: "Rovná tricepsová tyč",
    imageAsset: "2112_straight_triceps_press.webp"
  },
  {
    id: "2121",
    nameSk: "Paralelný úchop",
    imageAsset: "2121_paralle_handle.webp"
  },
  {
    id: "2127",
    nameSk: "Alternatívny V-úchop",
    imageAsset: "2127_alternative_v-press.webp"
  },
  {
    id: "2132",
    nameSk: "Tricepsové lano",
    imageAsset: "2132_triceps_rope.webp"
  },
  {
    id: "2142",
    nameSk: "Jednoručný strmeňový úchop",
    imageAsset: "2142_cable_station_stirrup_handle.webp"
  },
  {
    id: "2147",
    nameSk: "Jednostranné tricepsové lano",
    imageAsset: "2147_triceps_rope_onesided.webp"
  }
];

export function getMachineAccessories(accessoryIds: MachineAccessoryId[] = []) {
  const accessoryIdSet = new Set(accessoryIds);
  return machineAccessories.filter((accessory) => accessoryIdSet.has(accessory.id));
}
