import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
  AppRegistry,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import firebase from "../../firebase";
import { SIZES, FONTS, COLORS } from "../../constants";
import useGetFarmers from "../crud/useGetFamers";
import { useNavigation } from "@react-navigation/native";
import useGetAllProducts from "../crud/useGetAllProducts";
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import MapViewDirections from "react-native-maps-directions";

function Explore() {
  let users = useGetFarmers().docs;
  let products = useGetAllProducts().docs;
  // console.log(products);
  const navigation = useNavigation();

  const [location, setLocation] = useState(null);
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
    })();
  }, []);
  console.log(location);
  console.log("somthing", products);

  const renderUsers = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("userProfile", { item })}
      style={{
        paddingVertical: 15,
        marginVertical: 5,
        marginHorizontal: 5,
        paddingHorizontal: 0,
        justifyContent: "center",
        alignItems: "center",
        borderColor: COLORS.secondary,
        borderRadius: 10,
        backgroundColor: COLORS.black,
      }}
    >
      <View>
        <Text
          style={{ paddingHorizontal: 20, color: COLORS.white, ...FONTS.h4 }}
        >
          {item.name}
        </Text>
        <Text
          style={{
            paddingHorizontal: 20,
            borderRadius: 10,
            color: COLORS.secondary,
            ...FONTS.h5,
          }}
        >
          {item.type}
        </Text>
      </View>
    </TouchableOpacity>
  );
  return (
    <ScrollView>
      <View
        style={{
          padding: SIZES.padding * 2,
          height: "100%",
          backgroundColor: COLORS.white,
        }}
      >
        <Text style={{ ...FONTS.h2, padding: SIZES.padding }}>Explore</Text>

        <View style={{ marginTop: 10 }}>
          <Text style={{ ...FONTS.h4, marginBottom: 20 }}>Spotlight</Text>
          {users && (
            <FlatList
              data={users.slice(0, 10)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `${item.id}`}
              renderItem={renderUsers}
              contentContainerStyle={{}}
            />
          )}
        </View>
        <View style={{ marginTop: 10 }}>
          <Text style={{ ...FONTS.h4 }}>Discover</Text>
          {/* place map here */}
          {location !== null && (
            <MapView
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1, height: SIZES.height }}
              region={location}
              mapType="standard"
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              showsUserLocation
            >
              <Marker
                title="You are here"
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }}
                pinColor={COLORS.secondary}
                Location={{
                  accuracy: 5,
                }}
              />
              {products &&
                products.map(
                  (item, index) =>
                    item &&
                    item.latitude && (
                      <Marker
                        key={index}
                        title={item.produce}
                        pinColor={COLORS.secondary}
                        onPress={() =>
                          navigation.navigate("viewProduce", { item })
                        }
                        Location={{
                          accuracy: 5,
                        }}
                        coordinate={{
                          latitude: item.latitude,
                          longitude: item.longitude,
                          latitudeDelta: 0.0922,
                          longitudeDelta: 0.0421,
                        }}
                      >
                        <Image
                          key={index.u_id}
                          style={{
                            width: 70,
                            height: 100,
                            borderRadius: 100,
                            resizeMode: "contain",
                          }}
                          source={{ uri: item.images }}
                        />
                      </Marker>
                    )
                )}
            </MapView>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

export default Explore;
