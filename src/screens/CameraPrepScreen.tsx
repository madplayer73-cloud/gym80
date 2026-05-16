import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { SectionCard } from "../components/SectionCard";
import { Tag } from "../components/Tag";
import { colors } from "../theme";
import { Machine } from "../types";

type CameraPrepScreenProps = {
  machines: Machine[];
  onBack: () => void;
  onPickMachine: (machine: Machine) => void;
};

export function CameraPrepScreen({
  machines,
  onBack,
  onPickMachine
}: CameraPrepScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const suggestedMachines = machines.slice(0, 3);

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const takePhoto = async () => {
    if (!cameraRef.current || isCapturing) {
      return;
    }

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7
      });
      setCapturedPhotoUri(photo.uri);
    } finally {
      setIsCapturing(false);
    }
  };

  const resetPreview = () => {
    setCapturedPhotoUri(null);
  };

  const renderCameraContent = () => {
    if (!permission) {
      return (
        <View style={styles.permissionState}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.cameraHint}>Pripravujem pristup ku kamere...</Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.permissionState}>
          <Text style={styles.cameraLabel}>Kamera potrebuje povolenie</Text>
          <Text style={styles.cameraHint}>
            Bez povolenia sa fotenie nespusti. Po potvrdeni sa otvori zivy nahlad kamery.
          </Text>
          <Pressable onPress={requestPermission} style={styles.primaryButton}>
            <Text style={styles.primaryButtonLabel}>Povolit kameru</Text>
          </Pressable>
        </View>
      );
    }

    if (capturedPhotoUri) {
      return (
        <View style={styles.previewWrapper}>
          <Image source={{ uri: capturedPhotoUri }} style={styles.cameraPreview} />
          <View style={styles.previewOverlay}>
            <Text style={styles.previewTitle}>Fotka je pripravena na porovnanie</Text>
            <Text style={styles.previewText}>
              V tejto verzii este AI neurcuje presnu zhodu sama. Namiesto toho vyberies najlepsi stroj zo zoznamu nizsie.
            </Text>
          </View>
          <View style={styles.cameraControls}>
            <Pressable onPress={resetPreview} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonLabel}>Odfotit znova</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.previewWrapper}>
        <CameraView ref={cameraRef} style={styles.cameraPreview} facing={facing} />
        <View style={styles.cameraOverlayTop}>
          <Text style={styles.overlayTitle}>Zameraj cely stroj Gym80</Text>
          <Text style={styles.overlayText}>
            Idealne spredu alebo mierne zboku, aby bol vidiet tvar konstrukcie.
          </Text>
        </View>
        <View style={styles.cameraControls}>
          <Pressable onPress={toggleCameraFacing} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonLabel}>Otocit kameru</Text>
          </Pressable>
          <Pressable onPress={takePhoto} style={styles.captureCircle}>
            <View style={styles.captureInner} />
          </Pressable>
          <View style={styles.secondaryButtonGhost}>
            <Text style={styles.secondaryButtonGhostLabel}>
              {isCapturing ? "Fotim..." : "Pripravene"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backLabel}>Spat domov</Text>
      </Pressable>

      <View style={styles.hero}>
        <Text style={styles.title}>Odfotit stroj</Text>
        <Text style={styles.subtitle}>
          Kamera uz vie otvorit zivy nahlad a spravit fotku. Dalsi krok bude napojenie na rozpoznanie zhody.
        </Text>
      </View>

      <View style={styles.cameraFrame}>
        <View style={styles.cameraInner}>{renderCameraContent()}</View>
      </View>

      <SectionCard
        title="Ako to bude fungovat"
        subtitle="Po odfoteni stroj appka navrhne najlepsie zhody a ty potvrdis spravny stroj."
      >
        <View style={styles.stepList}>
          <Text style={styles.stepText}>1. Odfotis stroj vo fitku.</Text>
          <Text style={styles.stepText}>2. Appka navrhne 2 az 3 mozne zhody.</Text>
          <Text style={styles.stepText}>3. Ty vyberies spravny stroj.</Text>
          <Text style={styles.stepText}>4. Hned uvidis poslednu vahu a poznamku.</Text>
        </View>
      </SectionCard>

      <SectionCard
        title={capturedPhotoUri ? "Mozne zhody" : "Docasny vyber stroja"}
        subtitle={
          capturedPhotoUri
            ? "Po odfoteni si vyber najblizsi stroj. Neskor tu budu AI navrhy zoradene podla zhody."
            : "Kym nepridame skutocne porovnavanie fotky s databazou, vies ist dalej cez rucny vyber."
        }
      >
        <View style={styles.machineList}>
          {(capturedPhotoUri ? suggestedMachines : machines).map((machine) => (
            <Pressable
              key={machine.id}
              onPress={() => onPickMachine(machine)}
              style={styles.machineButton}
            >
              <View style={styles.machineButtonHeader}>
                <Tag label={machine.muscleGroup} />
                {capturedPhotoUri ? (
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchBadgeText}>Navrh zhody</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.machineName}>{machine.displayNameSk}</Text>
              <Text style={styles.machineHint}>{machine.descriptionSk}</Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 18,
    paddingBottom: 32
  },
  backButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999
  },
  backLabel: {
    color: "#fff8ee",
    fontWeight: "700"
  },
  hero: {
    gap: 8
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    color: colors.text
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textMuted
  },
  cameraFrame: {
    backgroundColor: "#e9d1a8",
    borderRadius: 30,
    padding: 14,
    borderWidth: 1,
    borderColor: "#cfaa76"
  },
  cameraInner: {
    minHeight: 360,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#201810"
  },
  permissionState: {
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  cameraLabel: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff8ee",
    textAlign: "center"
  },
  cameraHint: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 23,
    color: "#f4ddca",
    textAlign: "center",
    maxWidth: 260
  },
  previewWrapper: {
    minHeight: 360,
    position: "relative"
  },
  cameraPreview: {
    minHeight: 360
  },
  cameraOverlayTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: 18,
    backgroundColor: "rgba(22, 14, 9, 0.45)"
  },
  overlayTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff8ee"
  },
  overlayText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#f6dfc8"
  },
  previewOverlay: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 90,
    backgroundColor: "rgba(22, 14, 9, 0.72)",
    borderRadius: 18,
    padding: 14
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff8ee"
  },
  previewText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#f6dfc8"
  },
  cameraControls: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: colors.highlight,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 999
  },
  primaryButtonLabel: {
    color: "#fff8ee",
    fontWeight: "800"
  },
  secondaryButton: {
    minWidth: 108,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255, 248, 238, 0.96)"
  },
  secondaryButtonLabel: {
    textAlign: "center",
    color: colors.highlight,
    fontWeight: "800"
  },
  secondaryButtonGhost: {
    minWidth: 108,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "rgba(0, 0, 0, 0.62)"
  },
  secondaryButtonGhostLabel: {
    textAlign: "center",
    color: "#fff8ee",
    fontWeight: "700"
  },
  captureCircle: {
    width: 76,
    height: 76,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: "#fff8ee",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.18)"
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 999,
    backgroundColor: "#fff8ee"
  },
  stepList: {
    gap: 10
  },
  stepText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text
  },
  machineList: {
    gap: 12
  },
  machineButton: {
    backgroundColor: "#fff3e1",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e1bd86",
    gap: 8
  },
  machineButtonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  matchBadge: {
    backgroundColor: colors.highlight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999
  },
  matchBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff8ee"
  },
  machineName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text
  },
  machineHint: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted
  }
});
