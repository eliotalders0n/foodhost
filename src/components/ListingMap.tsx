import { Platform } from "react-native";

import type { ListingCoordinates } from "../types/domain";

export type ListingMapProps = {
  coordinates: ListingCoordinates | null;
  editable?: boolean;
  height?: number;
  onChangeCoordinates?: (coordinates: ListingCoordinates) => void;
  showUserLocation?: boolean;
};

const NativeListingMap =
  Platform.OS === "web"
    ? require("./ListingMap.web").ListingMap
    : require("./ListingMap.native").ListingMap;

export function ListingMap(props: ListingMapProps) {
  return <NativeListingMap {...props} />;
}
