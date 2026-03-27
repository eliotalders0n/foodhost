import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

import { DEFAULT_LISTING_COORDINATES } from "../lib/maps";
import { COLORS, RADIUS, SPACING } from "../theme/tokens";
import type { ListingMapProps } from "./ListingMap";
import type { ListingCoordinates } from "../types/domain";

function getRegion(coordinates: ListingCoordinates | null) {
  const center = coordinates ?? DEFAULT_LISTING_COORDINATES;
  const delta = coordinates ? 0.008 : 0.18;

  return {
    latitude: center.latitude,
    latitudeDelta: delta,
    longitude: center.longitude,
    longitudeDelta: delta,
  };
}

export function ListingMap({
  coordinates,
  editable = false,
  height = 220,
  onChangeCoordinates,
  showUserLocation = false,
}: ListingMapProps) {
  const region = getRegion(coordinates);
  const mapKey = `${region.latitude}:${region.longitude}:${editable ? "edit" : "view"}`;

  return (
    <View style={[styles.wrapper, { height }]}>
      <MapView
        key={mapKey}
        initialRegion={region}
        onPress={
          editable
            ? (event) => onChangeCoordinates?.(event.nativeEvent.coordinate)
            : undefined
        }
        rotateEnabled={false}
        scrollEnabled
        showsCompass={false}
        showsMyLocationButton={showUserLocation}
        showsUserLocation={showUserLocation}
        style={StyleSheet.absoluteFill}
      >
        {coordinates ? (
          <Marker
            coordinate={coordinates}
            draggable={editable}
            onDragEnd={(event) => onChangeCoordinates?.(event.nativeEvent.coordinate)}
          />
        ) : null}
      </MapView>
      {editable ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            Tap the map or drag the pin to set the pickup point.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: RADIUS.md,
    overflow: "hidden",
    position: "relative",
  },
  badge: {
    backgroundColor: "rgba(23, 25, 31, 0.8)",
    borderRadius: 999,
    bottom: SPACING.sm,
    left: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    position: "absolute",
    right: SPACING.sm,
  },
  badgeText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
