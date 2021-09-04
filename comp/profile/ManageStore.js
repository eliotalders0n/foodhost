import React, { useState } from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import firebase from "../../firebase";
import { SIZES, FONTS, COLORS } from "../../constants";
import { useNavigation } from "@react-navigation/native";
import useGetUser from "../crud/useGetUser";

const ManageStore = ({ route }) => {
  let user = route.params.user;
  const navigation = useNavigation();
  //   let user = useGetUser(firebase.auth().currentUser.uid).docs;
  //buyer, farmer, transporter
  // console.log(user);
  return (
    <View style={{ padding: SIZES.padding * 2 }}>
      <TouchableOpacity
        onPress={() => navigation.navigate("StoreDetails")}
        style={styles.TouchableOp}
      >
        <Text style={styles.TextNav}>Update Store Details</Text>
        <Text style={styles.TextFoot}>quickly add or remove Amenities</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate("AddAmenities")}
        style={styles.TouchableOp}
      >
        <Text style={styles.TextNav}>Add Store Details</Text>
        <Text style={styles.TextFoot}>add Amenities to your profile</Text>
      </TouchableOpacity>
    </View>
  );
};
const styles = StyleSheet.create({
  TouchableOp: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 10,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    backgroundColor: COLORS.white,
    marginBottom: 10,
  },
  TextNav: {
    color: COLORS.black,
    ...FONTS.h4,
    padding: SIZES.padding * 1,
    textAlign: "left",
    fontWeight: "900",
  },
  ViewNav: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 10,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    // backgroundColor: COLORS.black,
  },
  TextFoot: {
    color: COLORS.darkgray,
    ...FONTS.h6,
    marginTop: -20,
    padding: SIZES.padding * 1,
    textAlign: "left",
    fontWeight: "300",
  },
});

export default ManageStore;
