import React, { useState } from "react";

import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import firebase from "../../firebase";
import { SIZES, FONTS, COLORS } from "../../constants";
import { useNavigation } from "@react-navigation/native";

const updateProfile = ({ route }) => {
  const navigation = useNavigation();
  let user = route.params.user;

  console.log(user);
  const [name, setname] = useState(user.name);
  const [gender, setgender] = useState(user.gender);
  const [province, setprovince] = useState(user.province);
  const [type, setType] = useState(user.type);
  const [username, setUsername] = useState(user.username);
  const [district, setDistrict] = useState(user.district);

  // function to request for a verification code
  let userId = firebase.auth().currentUser.uid;
  const update = () => {
    // do something amazing

    const firestore = firebase.firestore();
    firestore
      .collection("users")
      .doc(userId)
      .update({
        name: name,
        gender: gender,
        province: province,
        type: type,
        username: username,
        district: district,
      })
      .then(() => {
        navigation.goBack();
      });

    console.log("update happened");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.txth3}>Full Name</Text>
      <TextInput
        keyboardType="default"
        placeholder="enter your full name"
        placeholderTextColor={COLORS.Gray}
        style={styles.input}
        autoCompleteType="name"
        onChangeText={setname}
        defaultValue={user && user.name}
      />

      <Text style={styles.txth3}>Gender</Text>
      <TextInput
        keyboardType="default"
        placeholder="Male | Female"
        placeholderTextColor={COLORS.Gray}
        style={styles.input}
        autoCompleteType="name"
        onChangeText={setgender}
        defaultValue={user && user.gender}
      />
      <Text style={styles.txth3}>Province</Text>
      <TextInput
        keyboardType="default"
        placeholder="Lusaka / Ndola"
        placeholderTextColor={COLORS.Gray}
        style={styles.input}
        autoCompleteType="name"
        onChangeText={setprovince}
        defaultValue={user && user.province}
      />

      <Text style={styles.txth3}>District</Text>
      <TextInput
        keyboardType="default"
        placeholder="enter district"
        placeholderTextColor={COLORS.Gray}
        style={styles.input}
        autoCompleteType="name"
        onChangeText={setDistrict}
        defaultValue={user && user.district}
      />

      <Text style={styles.txth3}>User Type</Text>
      <TextInput
        keyboardType="default"
        placeholder="Buyer | Seller"
        placeholderTextColor={COLORS.Gray}
        style={styles.input}
        autoCompleteType="name"
        onChangeText={setType}
        defaultValue={user && user.type}
      />

      <Text style={styles.txth3}>Username</Text>
      <TextInput
        keyboardType="default"
        placeholder="enter a username"
        placeholderTextColor={COLORS.Gray}
        style={styles.input}
        autoCompleteType="name"
        onChangeText={setUsername}
        defaultValue={user && user.username}
      />

      <TouchableOpacity
        style={{
          backgroundColor: COLORS.white,
          marginBottom: 20,
          marginTop: 40,
          borderRadius: 10,
          paddingHorizontal: 30,
          paddingVertical: 20,
        }}
        onPress={() => update()}
      >
        <Text style={{ color: COLORS.black, textAlign: "right", ...FONTS.h4 }}>
          Update Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SIZES.width,
    height: SIZES.height,
    padding: SIZES.padding * 2,
    // backgroundColor: "white",
  },
  buttonText1: {
    textAlign: "left",
  },
  buttonText2: {
    textAlign: "right",
  },
  miniContainer: {
    padding: SIZES.padding * 2,
    position: "absolute",
    flexDirection: "row",
    bottom: 0,
    left: 0,
    right: 0,
  },
  detailsContainer: {
    padding: SIZES.padding * 2,
    flexDirection: "row",
    left: 0,
    right: 0,
  },
  personalContainer: {
    flex: 0.5,
    textAlign: "left",
    backgroundColor: "white",
    // padding: SIZES.padding * 2,
  },
  altContainer: {
    flex: 0.5,
    textAlign: "left",
    backgroundColor: "white",
    // padding: SIZES.padding * 2,
  },
  button1: {
    flex: 0.5,
    // textAlign: "left",
    backgroundColor: "white",
    marginBottom: 20,
    padding: SIZES.padding * 2,
  },
  image: {
    width: 220,
    height: 220,
    borderRadius: 100,
  },
  txth1: {
    marginTop: "5%",
    ...FONTS.h1,
  },
  txth2: {
    ...FONTS.h5,
    width: "60%",
    textAlign: "center",
    marginBottom: "10%",
    marginTop: "5%",
  },
  txth3: {
    ...FONTS.h5,
    textAlign: "left",
    marginTop: 20,
  },
  input: {
    // padding: SIZES.padding * 2,
    borderWidth: 0.4,
    borderRadius: 10,
    padding: 10,
    borderRadius: 10,
    textAlign: "left",
  },
});

export default updateProfile;
