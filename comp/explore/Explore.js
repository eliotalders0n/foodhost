import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
} from "react-native";
import firebase from "../../firebase";
import { SIZES, FONTS, COLORS } from "../../constants";
import useGetFarmers from "../crud/useGetFamers";
import { useNavigation } from "@react-navigation/native";
import useGetCategories from "../crud/useGetCategories";
import useGetAllProducts from "../crud/useGetAllProducts";
import MapView from "react-native-maps";
import * as Location from "expo-location";

function Explore() {
  let users = useGetFarmers().docs;
  let categories = useGetCategories().docs;
  const navigation = useNavigation();
  const [location, setLocation] = useState();
  const locationResult = useState();
  let products = useGetAllProducts().docs;

  React.useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        // add alert
        Alert.alert("Location", "Permission denied", [
          {
            text: "Cancel",
            onPress: () => console.log("Cancel Pressed"),
            style: "cancel",
          },
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } // confused
      console.log("Permssion granted");
      let getlocation = await Location.getCurrentPositionAsync({});
      // this.setState({ locationResult: JSON.stringify(location) });
      setLocation(getlocation);
      console.log(getlocation + " im here");
    })();
  }, []);
  // console.log(location + "im here");

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
          <MapView
            style={{ flex: 1, height: SIZES.height }}
            initialRegion={{
              latitude: 37.78825,
              longitude: -122.4324,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          />
        </View>
      </View>
    </ScrollView>
  );
}

export default Explore;
