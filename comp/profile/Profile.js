import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import firebase from "../../firebase";
import { SIZES, FONTS, COLORS } from "../../constants";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import useGetUser from "../crud/useGetUser";
import useGetStore from "../crud/useGetStore";

function profile() {
  const navigation = useNavigation();
  let user = useGetUser(firebase.auth().currentUser.uid).docs;
  // let store = useGetStore().docs;
  //buyer, farmer, transporter
  // console.log(user);

  const logout = () => {
    firebase
      .auth()
      .signOut()
      .then(() => {
        console.log("logged out");
      });
  };

  return (
    <ScrollView
      style={{
        padding: SIZES.padding,
        // backgroundColor: COLORS.white,
        marginBottom: 80,
        paddingBottom: 90,
      }}
    >
      <View style={{ padding: SIZES.padding * 2, height: 60 }}>
        <Text style={{ ...FONTS.h2 }}>Profile</Text>
      </View>
      <View style={{ padding: SIZES.padding * 2 }}>
        <Text style={{ ...FONTS.h2, fontWeight: "900", textAlign: "center" }}>
          {user && user.name}
        </Text>
        <View
          style={{
            marginTop: 10,
            justifyCOntent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              backgroundColor: COLORS.secondary,
              fontWeight: "900",
              paddingHorizontal: 20,
              borderRadius: 10,
              color: COLORS.white,
              paddingVertical: 10,
              ...FONTS.h5,
            }}
          >
            @{user && user.username}
          </Text>
          <Text
            style={{
              // backgroundColor: COLORS.white,
              marginHorizontal: 10,
              color: COLORS.dark,
              padding: 5,
              ...FONTS.h6,
            }}
          >
            {user && user.gender}
          </Text>
          <Text
            style={{
              // backgroundColor: COLORS.lightGray,
              fontWeight: "900",
              marginHorizontal: 10,
              color: COLORS.dark,
              padding: 5,
              ...FONTS.h6,
            }}
          >
            {user && user.district}
          </Text>
        </View>

        <View style={{ flexDirection: "row", marginVertical: 20 }}>
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              ...FONTS.h5,
              fontWeight: "900",
            }}
          >
            {user && user.province}
          </Text>
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              ...FONTS.h5,
              fontWeight: "900",
            }}
          >
            {user && user.phone}
          </Text>
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              ...FONTS.h5,
              fontWeight: "900",
            }}
          >
            {user && user.type}
          </Text>
        </View>
      </View>

      <View>
        <TouchableOpacity
          onPress={() => navigation.navigate("manageProduct")}
          style={styles.TouchableOp}
        >
          <Text style={styles.TextNav}>Manage Meals</Text>
          <Text style={styles.TextFoot}>view, edit and delete meals</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("addProduct")}
          style={styles.TouchableOp}
        >
          <Text style={styles.TextNav}>Add Meal</Text>
          <Text style={styles.TextFoot}>add a meal to your catalogue</Text>
        </TouchableOpacity>
      </View>
      <View>
        {/* <TouchableOpacity
          onPress={() => navigation.navigate("StoreDetails", { store })}
          style={styles.TouchableOp}
        >
          <Text style={styles.TextNav}>Manage Store</Text>
          <Text style={styles.TextFoot}>
            edit and update your store details
          </Text>
        </TouchableOpacity> */}
        <TouchableOpacity
          onPress={() => navigation.navigate("updateProfile", { user })}
          style={styles.TouchableOp}
        >
          <Text style={styles.TextNav}>Update Profile</Text>
          <Text style={styles.TextFoot}>edit and update your profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("Inquiries", { user })}
          style={styles.TouchableOp}
        >
          <Text style={styles.TextNav}>Inquiries</Text>
          <Text style={styles.TextFoot}>
            accept or deny incoming requests | request history
          </Text>
        </TouchableOpacity>
      </View>
      <View>
        <TouchableOpacity
          onPress={() => navigation.navigate("Feedback", { user })}
          style={styles.TouchableOp}
        >
          <Text style={styles.TextNav}>Feedback</Text>
          <Text style={styles.TextFoot}>contact us here</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => logout()} style={styles.TouchableOp}>
        <Text style={styles.TextNav}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
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

export default profile;
