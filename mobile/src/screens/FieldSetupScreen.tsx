import * as Location from "expo-location";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  Alert,
  InteractionManager,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import MapView, { LatLng, Marker, Polygon, PROVIDER_GOOGLE, Region } from "react-native-maps";
import PrimaryButton from "../components/PrimaryButton";
import StepHeader from "../components/StepHeader";
import { FieldSetupData } from "../types/app";
import { MapPoint } from "../types/decision";
import { calculateAreaHectares } from "../services/geometry";
import { GOOGLE_MAPS_API_KEY } from "../services/googleMaps";
import { stateRegions } from "../services/locations";

interface FieldSetupScreenProps {
  value: FieldSetupData;
  onChange: Dispatch<SetStateAction<FieldSetupData>>;
  onNext: () => void;
}

/** Used until GPS resolves or if permission is denied. */
const FALLBACK_REGION: Region = {
  latitude: 7.3775,
  longitude: 3.947,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08
};

/** Zoom for “my location” / field drawing (~1–2 km). */
const ZOOM_FIELD = { latDelta: 0.012, lngDelta: 0.012 };

type PlaceAddressComponent = {
  long_name: string;
  types: readonly string[];
};

function regionFromLatLng(
  latitude: number,
  longitude: number,
  latitudeDelta = 0.012,
  longitudeDelta = 0.012
): Region {
  return { latitude, longitude, latitudeDelta, longitudeDelta };
}

/** Fit map to Google Places viewport (northeast / southwest corners). */
function regionFromPlaceViewport(
  ne: { lat: number; lng: number },
  sw: { lat: number; lng: number }
): Region {
  const latitude = (ne.lat + sw.lat) / 2;
  const longitude = (ne.lng + sw.lng) / 2;
  const latitudeDelta = Math.max(Math.abs(ne.lat - sw.lat) * 1.2, 0.006);
  const longitudeDelta = Math.max(Math.abs(ne.lng - sw.lng) * 1.2, 0.006);
  return { latitude, longitude, latitudeDelta, longitudeDelta };
}

function extractStateCountryFromComponents(
  components: PlaceAddressComponent[] | undefined
): { state?: string; country?: string } {
  if (!components?.length) {
    return {};
  }
  let state: string | undefined;
  let country: string | undefined;
  for (const c of components) {
    if (c.types.includes("administrative_area_level_1")) {
      state = c.long_name;
    }
    if (c.types.includes("country")) {
      country = c.long_name;
    }
  }
  return { state, country };
}

export default function FieldSetupScreen({
  value,
  onChange,
  onNext
}: FieldSetupScreenProps): React.JSX.Element {
  const mapRef = useRef<MapView | null>(null);
  /** Google Maps on iOS can crash if polygon + many markers unmount in one update. */
  const pendingClearAfterPolygonRef = useRef(false);
  /** Ignore map tap right after a marker drag (avoids accidental new vertex). */
  const isDraggingMarkerRef = useRef(false);
  const [draggingVertexIndex, setDraggingVertexIndex] = useState<number | null>(null);
  const [locationQuery, setLocationQuery] = useState(value.state);
  const [mapRegion, setMapRegion] = useState<Region>(FALLBACK_REGION);

  const moveMapToRegion = useCallback((next: Region) => {
    setMapRegion(next);
    const run = () => mapRef.current?.animateToRegion(next, 750);
    InteractionManager.runAfterInteractions(() => {
      run();
      requestAnimationFrame(run);
      setTimeout(run, 120);
      setTimeout(run, 380);
    });
  }, []);

  const moveMapToLatLng = useCallback(
    (
      latitude: number,
      longitude: number,
      latDelta: number = ZOOM_FIELD.latDelta,
      lngDelta: number = ZOOM_FIELD.lngDelta
    ) => {
      moveMapToRegion(regionFromLatLng(latitude, longitude, latDelta, lngDelta));
    },
    [moveMapToRegion]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled || status !== Location.PermissionStatus.GRANTED) {
        return;
      }
      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        if (cancelled) {
          return;
        }
        moveMapToLatLng(pos.coords.latitude, pos.coords.longitude);
      } catch {
        // Keep fallback map center
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [moveMapToLatLng]);

  async function recenterOnUserLocation(): Promise<void> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      Alert.alert(
        "Location off",
        "Turn on location permission in Settings to jump the map to where you are."
      );
      return;
    }
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      moveMapToLatLng(pos.coords.latitude, pos.coords.longitude, ZOOM_FIELD.latDelta, ZOOM_FIELD.lngDelta);
    } catch {
      Alert.alert("Location", "Could not read your current position. Try again outdoors.");
    }
  }

  function applyPlaceDetails(details: {
    geometry?: {
      location?: { lat: number; lng: number };
      viewport?: {
        northeast?: { lat: number; lng: number };
        southwest?: { lat: number; lng: number };
      };
    };
    address_components?: PlaceAddressComponent[];
  } | null): void {
    const loc = details?.geometry?.location;
    if (!loc) {
      return;
    }
    Keyboard.dismiss();

    const vp = details.geometry?.viewport;
    const ne = vp?.northeast;
    const sw = vp?.southwest;
    if (ne && sw) {
      moveMapToRegion(regionFromPlaceViewport(ne, sw));
    } else {
      moveMapToLatLng(loc.lat, loc.lng, 0.018, 0.018);
    }

    const { state: placeState, country: placeCountry } = extractStateCountryFromComponents(
      details.address_components
    );
    if (placeState) {
      setLocationQuery(placeState);
      updateValue({
        state: placeState,
        ...(placeCountry ? { country: placeCountry } : {})
      });
    }
  }
  const polygonCoordinates = useMemo(
    () => value.points.map((point) => ({ latitude: point.latitude, longitude: point.longitude })),
    [value.points]
  );
  const matchingStates = useMemo(() => {
    const query = locationQuery.trim().toLowerCase();

    if (!query) {
      return stateRegions;
    }

    return stateRegions.filter((entry) => entry.state.toLowerCase().includes(query));
  }, [locationQuery]);

  function updateValue(nextValue: Partial<FieldSetupData>): void {
    onChange({
      ...value,
      ...nextValue
    });
  }

  function addPoint(point: MapPoint): void {
    const points = [...value.points, point];
    const areaHectares = calculateAreaHectares(points);
    onChange({
      ...value,
      points,
      areaHectares
    });
  }

  function movePointAtIndex(index: number, coordinate: LatLng): void {
    onChange((prev) => {
      const points = prev.points.map((p, i) =>
        i === index
          ? { latitude: coordinate.latitude, longitude: coordinate.longitude }
          : p
      );
      return {
        ...prev,
        points,
        areaHectares: calculateAreaHectares(points)
      };
    });
  }

  function undoLastPoint(): void {
    const points = value.points.slice(0, -1);
    const areaHectares = calculateAreaHectares(points);
    onChange({
      ...value,
      points,
      areaHectares
    });
  }

  function clearPoints(): void {
    if (value.points.length >= 3) {
      pendingClearAfterPolygonRef.current = true;
      onChange((prev) => ({
        ...prev,
        points: prev.points.slice(0, 2),
        areaHectares: 0
      }));
      return;
    }

    if (value.points.length > 0) {
      requestAnimationFrame(() => {
        onChange((prev) => ({ ...prev, points: [], areaHectares: 0 }));
      });
      return;
    }
  }

  useEffect(() => {
    if (!pendingClearAfterPolygonRef.current) {
      return;
    }
    if (value.points.length !== 2) {
      if (value.points.length >= 3) {
        pendingClearAfterPolygonRef.current = false;
      }
      return;
    }
    const t = setTimeout(() => {
      pendingClearAfterPolygonRef.current = false;
      onChange((prev) => ({ ...prev, points: [], areaHectares: 0 }));
    }, 32);
    return () => clearTimeout(t);
  }, [value.points, onChange]);

  function handleContinue(): void {
    if (!value.fieldName.trim()) {
      Alert.alert("Field name required", "Please give the field a name before continuing.");
      return;
    }

    if (value.points.length < 3 || value.areaHectares <= 0) {
      Alert.alert("Map the field", "Add at least 3 points to define a valid field boundary.");
      return;
    }

    if (!value.state.trim()) {
      Alert.alert("Region required", "Please enter the state or region where the field is located.");
      return;
    }

    if (!value.country.trim()) {
      Alert.alert("Country required", "Please enter the country where the field is located.");
      return;
    }

    onNext();
  }

  function focusStateRegion(state: string): void {
    const match = stateRegions.find(
      (entry) => entry.state.toLowerCase() === state.trim().toLowerCase()
    );

    if (match) {
      updateValue({ state: match.state });
      setLocationQuery(match.state);
      moveMapToRegion(match.region);
    }
  }

  function focusTypedLocation(): void {
    if (!locationQuery.trim()) {
      Alert.alert("Location required", "Enter a state or region, or choose one from the quick picks.");
      return;
    }

    const directMatch = stateRegions.find(
      (entry) => entry.state.toLowerCase() === locationQuery.trim().toLowerCase()
    );

    if (directMatch) {
      focusStateRegion(directMatch.state);
      return;
    }

    const partialMatch = stateRegions.find((entry) =>
      entry.state.toLowerCase().includes(locationQuery.trim().toLowerCase())
    );

    if (partialMatch) {
      focusStateRegion(partialMatch.state);
      return;
    }

    updateValue({ state: locationQuery.trim() });
    Alert.alert(
      "Custom location kept",
      "The map will stay in its current view, but the typed region will still be used in the recommendation request."
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      <StepHeader
        eyebrow="Step 1"
        title="Map the field"
        subtitle="Set the field location first, then tap around the field edge to draw the boundary and let RootRise calculate the field size automatically."
      />

      <View style={styles.tipBanner}>
        <Text style={styles.tipTitle}>Field mapping tip</Text>
        <Text style={styles.tipText}>
          Search for a place or use your location, then tap around the field edge to draw the boundary. You can type any region and country, or use the Nigeria quick picks for the current demo dataset.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Field name</Text>
        <TextInput
          value={value.fieldName}
          onChangeText={(fieldName) => updateValue({ fieldName })}
          placeholder="Enter a field name"
          style={styles.input}
        />

        <Text style={styles.label}>State or region</Text>
        <TextInput
          value={locationQuery}
          onChangeText={(state) => {
            setLocationQuery(state);
            updateValue({ state });
          }}
          placeholder="Enter a state or region"
          style={styles.input}
        />

        <View style={styles.locationActions}>
          <Text style={styles.label}>Find location</Text>
          <Pressable onPress={focusTypedLocation} style={styles.locationButton}>
            <Text style={styles.locationButtonText}>Focus map</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Nigeria quick picks</Text>
        <Text style={styles.helperText}>
          These are optional shortcuts for the current demo dataset. You can still type a custom region above.
        </Text>
        <View style={styles.chips}>
          {matchingStates.map((entry) => {
            const selected = value.state.trim().toLowerCase() === entry.state.toLowerCase();

            return (
              <Pressable
                key={entry.state}
                onPress={() => focusStateRegion(entry.state)}
                style={[styles.chip, selected ? styles.chipSelected : null]}
              >
                <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                  {entry.state}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Country</Text>
        <TextInput
          value={value.country}
          onChangeText={(country) => updateValue({ country })}
          placeholder="Enter a country"
          style={styles.input}
        />

        <Text style={styles.label}>Season</Text>
        <View style={styles.chips}>
          {(["rainy", "dry"] as const).map((season) => {
            const selected = value.season === season;

            return (
              <Pressable
                key={season}
                onPress={() => updateValue({ season })}
                style={[styles.chip, selected ? styles.chipSelected : null]}
              >
                <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                  {season}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.mapCard}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Field boundary</Text>
          <Text style={styles.mapSubtitle}>
            Search an address, use my location, then tap the map to add corners and drag pins to adjust.
          </Text>
        </View>

        {GOOGLE_MAPS_API_KEY ? (
          <View style={styles.placesSearch}>
            <Text style={styles.label}>Search place or address</Text>
            <GooglePlacesAutocomplete
              placeholder="e.g. farm near Ibadan"
              fetchDetails
              enablePoweredByContainer={false}
              debounce={280}
              minLength={2}
              keyboardShouldPersistTaps="handled"
              listViewDisplayed="auto"
              keepResultsAfterBlur={false}
              onPress={(_data, details) => applyPlaceDetails(details)}
              query={{
                key: GOOGLE_MAPS_API_KEY,
                language: "en"
              }}
              textInputProps={{
                placeholderTextColor: "#8A8F84",
                returnKeyType: "search"
              }}
              styles={placesAutocompleteStyles}
              onFail={(err) => {
                console.warn("Places autocomplete:", err);
              }}
            />
          </View>
        ) : (
          <Text style={styles.placesMissingKey}>
            Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in `.env` and restart Metro for place search.
          </Text>
        )}

        <Pressable onPress={() => void recenterOnUserLocation()} style={styles.recenterButton}>
          <Text style={styles.recenterButtonText}>Use my location</Text>
        </Pressable>

        <MapView
          ref={mapRef}
          // provider={PROVIDER_GOOGLE}
          style={styles.map}
          mapType="hybrid"
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          onPress={(event) => {
            if (isDraggingMarkerRef.current) {
              return;
            }
            addPoint(event.nativeEvent.coordinate);
          }}
        >
          {polygonCoordinates.map((point, index) => (
            <Marker
              key={`vertex-${index}`}
              coordinate={point}
              draggable
              pinColor="#1D4D2F"
              tracksViewChanges={draggingVertexIndex === index}
              onDragStart={() => {
                isDraggingMarkerRef.current = true;
                setDraggingVertexIndex(index);
              }}
              onDragEnd={(e) => {
                movePointAtIndex(index, e.nativeEvent.coordinate);
                setDraggingVertexIndex(null);
                requestAnimationFrame(() => {
                  isDraggingMarkerRef.current = false;
                });
              }}
            />
          ))}

          {polygonCoordinates.length >= 3 ? (
            <Polygon
              coordinates={polygonCoordinates}
              fillColor="rgba(29,77,47,0.2)"
              strokeColor="#1D4D2F"
              strokeWidth={2}
            />
          ) : null}
        </MapView>

        <View style={styles.mapActions}>
          <Pressable onPress={undoLastPoint} style={styles.mapAction}>
            <Text style={styles.mapActionText}>Undo point</Text>
          </Pressable>
          <Pressable onPress={clearPoints} style={styles.mapAction}>
            <Text style={styles.mapActionText}>Clear map</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Points placed</Text>
          <Text style={styles.summaryValue}>{value.points.length}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Field size</Text>
          <Text style={styles.summaryValue}>{value.areaHectares.toFixed(2)} ha</Text>
        </View>
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Boundary readiness</Text>
          <Text style={styles.progressValue} numberOfLines={2}>
            {value.points.length < 3 ? "Needs more points" : "Ready — continue when the boundary is set"}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(100, (value.points.length / 4) * 100)}%` }
            ]}
          />
        </View>
      </View>

      <PrimaryButton title="Continue to goal" onPress={handleContinue} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: "100%",
    padding: 20,
    gap: 18,
    paddingBottom: 32
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    gap: 12
  },
  tipBanner: {
    backgroundColor: "#E5EBD9",
    borderRadius: 20,
    padding: 16,
    gap: 6
  },
  tipTitle: {
    fontSize: 13,
    textTransform: "uppercase",
    color: "#1D4D2F",
    fontWeight: "800"
  },
  tipText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#36513F"
  },
  label: {
    fontSize: 13,
    color: "#4A4E43",
    fontWeight: "700",
    marginBottom: 10
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8D1C2",
    paddingHorizontal: 14,
    backgroundColor: "#FBF9F4"
  },
  helperText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#7A7F5D",
    marginTop: -4
  },
  mapCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 14,
    gap: 12,
    zIndex: 1
  },
  placesSearch: {
    zIndex: 20,
    elevation: 12
  },
  placesMissingKey: {
    fontSize: 13,
    color: "#8B4513",
    lineHeight: 19
  },
  recenterButton: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#E5EBD9"
  },
  recenterButtonText: {
    color: "#1D4D2F",
    fontWeight: "700",
    fontSize: 14
  },
  mapHeader: {
    gap: 4
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1F16"
  },
  mapSubtitle: {
    fontSize: 13,
    color: "#4A4E43"
  },
  map: {
    height: 320,
    borderRadius: 18
  },
  mapActions: {
    flexDirection: "row",
    gap: 12
  },
  mapAction: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: "#F3F1E8",
    alignItems: "center",
    justifyContent: "center"
  },
  mapActionText: {
    color: "#1D4D2F",
    fontWeight: "700"
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    width: "100%",
    maxWidth: "100%"
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  locationActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  locationButton: {
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5EBD9"
  },
  locationButtonText: {
    color: "#1D4D2F",
    fontWeight: "700"
  },
  chip: {
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F1E8"
  },
  chipSelected: {
    backgroundColor: "#1D4D2F"
  },
  chipText: {
    color: "#1D4D2F",
    fontWeight: "700"
  },
  chipTextSelected: {
    color: "#F3F1E8"
  },
  summaryCard: {
    flex: 1,
    flexBasis: 0,
    minWidth: 140,
    backgroundColor: "#E5EBD9",
    borderRadius: 18,
    padding: 16,
    gap: 6
  },
  progressCard: {
    width: "100%",
    maxWidth: "100%",
    alignSelf: "stretch",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    gap: 10
  },
  progressHeader: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 6,
    width: "100%",
    maxWidth: "100%"
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1A1F16",
    flexShrink: 1
  },
  progressValue: {
    fontSize: 13,
    lineHeight: 18,
    color: "#4A4E43",
    fontWeight: "600",
    flexShrink: 1
  },
  progressTrack: {
    height: 10,
    width: "100%",
    maxWidth: "100%",
    borderRadius: 999,
    backgroundColor: "#ECE7DA",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#1D4D2F"
  },
  summaryLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    color: "#4A4E43",
    fontWeight: "700"
  },
  summaryValue: {
    fontSize: 24,
    color: "#1D4D2F",
    fontWeight: "800"
  }
});

const placesAutocompleteStyles = {
  container: { flex: 0, zIndex: 30 },
  textInputContainer: {
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    margin: 0
  },
  textInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8D1C2",
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#1A1F16",
    backgroundColor: "#FBF9F4"
  },
  listView: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginTop: 6,
    maxHeight: 168,
    borderWidth: 1,
    borderColor: "#D8D1C2"
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 14
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E0DDD6"
  },
  description: {
    fontSize: 14,
    color: "#1A1F16"
  }
};
