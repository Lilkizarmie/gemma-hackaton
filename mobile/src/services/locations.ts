import { Region } from "react-native-maps";

export interface StateRegion {
  state: string;
  region: Region;
}

export const stateRegions: StateRegion[] = [
  { state: "Oyo", region: { latitude: 7.3775, longitude: 3.947, latitudeDelta: 0.18, longitudeDelta: 0.18 } },
  { state: "Ogun", region: { latitude: 7.1604, longitude: 3.3500, latitudeDelta: 0.18, longitudeDelta: 0.18 } },
  { state: "Kwara", region: { latitude: 8.9669, longitude: 4.3874, latitudeDelta: 0.2, longitudeDelta: 0.2 } },
  { state: "Kaduna", region: { latitude: 10.5264, longitude: 7.4388, latitudeDelta: 0.22, longitudeDelta: 0.22 } },
  { state: "Niger", region: { latitude: 9.9309, longitude: 5.5983, latitudeDelta: 0.24, longitudeDelta: 0.24 } },
  { state: "Benue", region: { latitude: 7.3369, longitude: 8.7404, latitudeDelta: 0.22, longitudeDelta: 0.22 } },
  { state: "Edo", region: { latitude: 6.6342, longitude: 5.9304, latitudeDelta: 0.18, longitudeDelta: 0.18 } },
  { state: "Delta", region: { latitude: 5.7040, longitude: 5.9339, latitudeDelta: 0.18, longitudeDelta: 0.18 } },
  { state: "Ondo", region: { latitude: 7.2508, longitude: 5.2103, latitudeDelta: 0.18, longitudeDelta: 0.18 } },
  { state: "Kebbi", region: { latitude: 12.4539, longitude: 4.1975, latitudeDelta: 0.24, longitudeDelta: 0.24 } },
  { state: "Kano", region: { latitude: 11.9914, longitude: 8.5317, latitudeDelta: 0.2, longitudeDelta: 0.2 } },
  { state: "Plateau", region: { latitude: 9.2182, longitude: 9.5179, latitudeDelta: 0.2, longitudeDelta: 0.2 } }
];

