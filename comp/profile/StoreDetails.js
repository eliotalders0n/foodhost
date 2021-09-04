import React, { useState } from "react";

import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  CheckBox,
} from "react-native";
import firebase from "../../firebase";
import { SIZES, FONTS, COLORS } from "../../constants";
import { useNavigation } from "@react-navigation/native";
import useGetStore from "../crud/useGetStore";

function StoreDetails() {
  const navigation = useNavigation();
  const data = useGetStore().docs;

  console.log("some data: ", data);
  const [Essentials, setEssentials] = useState(false);
  const [Locationfeatures, setLocationfeatures] = useState(false);
  const [Parking, setParking] = useState(false);
  const [internet, setinternet] = useState(false);
  const [entertainment, setentertainment] = useState(false);
  const [smoking, setsmoking] = useState(false);
  const [drinking, setdrinking] = useState(false);
  const [littering, setlittering] = useState(false);
  const [cancellation, setcancellation] = useState(false);
  const [locationdirections, setlocationdirections] = useState(false);
  const [otherInstruction, setotherInstruction] = useState(false);

  // function to request for a verification code
  let userId = firebase.auth().currentUser.uid;
  const update = () => {
    // do something amazing

    const firestore = firebase.firestore();
    firestore
      .collection("amenities")
      .doc("33907S056DShCxOGo4Zq")
      .update({
        Essentials: Essentials,
        Locationfeatures: Locationfeatures,
        Parking: Parking,
        internet: internet,
        entertainment: entertainment,
        smoking: smoking,
        drinking: drinking,
        littering: littering,
        cancellation: cancellation,
        locationdirections: locationdirections,
        otherInstruction: otherInstruction,
      })
      .then(() => {
        navigation.goBack();
      });

    console.log("update happened");
  };

  return (
    <View style={styles.container}>
      <Text style={{ ...FONTS.h4, marginBottom: 20 }}>
        What this place offers (Corona Virus is a reality, lets be safe.)
      </Text>
      <View style={styles.CheckBox}>
        <CheckBox
          value={Essentials}
          onValueChange={setEssentials}
          style={{ borderRadius: 10 }}
        />
        <Text style={styles.chkbxText}>
          Essentials Towels, soap, washing basin, and toilet paper?
        </Text>
      </View>

      <View style={styles.CheckBox}>
        <CheckBox
          value={Locationfeatures}
          onValueChange={setLocationfeatures}
          style={{}}
        />
        <Text style={styles.chkbxText}>
          Location features Private entrance Separate street or building
          entrance
        </Text>
      </View>

      <View style={styles.CheckBox}>
        <CheckBox value={Parking} onValueChange={setParking} style={{}} />
        <Text style={styles.chkbxText}>
          Parking and facilities Free parking on premises
        </Text>
      </View>

      <View style={styles.CheckBox}>
        <CheckBox value={internet} onValueChange={setinternet} style={{}} />
        <Text style={styles.chkbxText}>Free internet (Wifi)</Text>
      </View>

      <View style={styles.CheckBox}>
        <CheckBox
          value={entertainment}
          onValueChange={setentertainment}
          style={{}}
        />
        <Text style={styles.chkbxText}>
          DSTV TV NETFLIX XBOX PLAYSTATION or other entertainment | streaming
          service.
        </Text>
      </View>
      <Text style={{ ...FONTS.h4, marginBottom: 20 }}>House rules</Text>
      <View style={styles.CheckBox}>
        <CheckBox value={smoking} onValueChange={setsmoking} style={{}} />
        <Text style={styles.chkbxText}>No smoking</Text>
      </View>

      <View style={styles.CheckBox}>
        <CheckBox value={drinking} onValueChange={setdrinking} style={{}} />
        <Text style={styles.chkbxText}>No drinking</Text>
      </View>

      <View style={styles.CheckBox}>
        <CheckBox value={littering} onValueChange={setlittering} style={{}} />
        <Text style={styles.chkbxText}>No littering</Text>
      </View>
      <Text style={{ ...FONTS.h4, marginBottom: 20 }}>Cancellation policy</Text>
      <View style={styles.CheckBox}>
        <CheckBox
          value={cancellation}
          onValueChange={setcancellation}
          style={{}}
        />
        <Text style={styles.chkbxText}>free cancellation for 1 hour.</Text>
      </View>
      <Text style={styles.txth3}>Your location directions if any</Text>
      <TextInput
        keyboardType="default"
        placeholder="any landmark to watch out for, house number."
        placeholderTextColor={COLORS.Gray}
        style={styles.input}
        autoCompleteType="name"
        onChangeText={setlocationdirections}
        // defaultValue={user && user.locationdirections}
      />

      <Text style={styles.txth3}>When people come, what should they do?</Text>
      <TextInput
        keyboardType="default"
        placeholder="Knock | hoot | call | gate is already open."
        placeholderTextColor={COLORS.Gray}
        style={styles.input}
        autoCompleteType="name"
        onChangeText={setotherInstruction}
        // defaultValue={user && user.otherInstruction}
      />
      <TouchableOpacity
        style={{
          backgroundColor: COLORS.secondary,
          marginBottom: 20,
          marginTop: 40,
          borderRadius: 10,
          paddingHorizontal: 30,
          paddingVertical: 20,
        }}
        onPress={() => update()}
      >
        <Text style={{ color: COLORS.white, textAlign: "right", ...FONTS.h4 }}>
          Update Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZES.width,
    height: SIZES.height,
    padding: SIZES.padding * 2,
    backgroundColor: COLORS.white,
  },
  CheckBox: {
    flexDirection: "row",
    marginVertical: 20,
    marginBottom: 20,
  },
  chkbxText: {
    flex: 1,
    paddingStart: 15,
    textAlign: "left",
    ...FONTS.h5,
    fontWeight: "900",
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

export default StoreDetails;
