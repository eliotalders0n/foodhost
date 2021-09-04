import React, { useState, useRef } from "react";
import {
  Alert,
  SafeAreaView,
  TextInput,
  StyleSheet,
  Text,
  ScrollView,
  View,
  TouchableOpacity,
} from "react-native";
import { SIZES, COLORS, FONTS } from "../../constants";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import firebase from "./../../firebase";

const Signup = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const recaptchaVerifire = useRef(null);
  const [verificationId, setVerificationId] = useState(null);
  const [code, setCode] = useState("");

  const [username, setusername] = useState("");
  const [name, setname] = useState("");
  const [gender, setgender] = useState("");
  const [district, setdistrict] = useState("");
  const [province, setprovince] = useState("");
  const [usertype, setusertype] = useState("");

  // function to request for a verification code

  const sendVerification = () => {
    const phoneProvider = new firebase.auth.PhoneAuthProvider();
    phoneProvider
      .verifyPhoneNumber("+26" + phoneNumber, recaptchaVerifire.current)
      .then(setVerificationId);
  };

  const [Essentials] = useState(false);
  const [Locationfeatures] = useState(false);
  const [Parking] = useState(false);
  const [internet] = useState(false);
  const [entertainment] = useState(false);
  const [smoking] = useState(false);
  const [drinking] = useState(false);
  const [littering] = useState(false);
  const [cancellation] = useState(false);
  const [locationdirections] = useState(null);
  const [otherInstruction] = useState(null);

  // function to request for a verification code
  // do something amazing

  function update() {
    let asd = {
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
      u_id: firebase.auth().currentUser.uid,
    };
    firebase
      .firestore()
      .collection("amenities")
      .add(asd)
      .then(() => {
        console.log("Item added");
        // navigation.goBack();
      })
      .catch((e) => {
        console.log(e);
      });
  }

  const confirmCode = () => {
    const credential = firebase.auth.PhoneAuthProvider.credential(
      verificationId,
      code
    );
    firebase
      .auth()
      .signInWithCredential(credential)
      .then((result) => {
        // do something amazing
        let userId = firebase.auth().currentUser.uid;

        const firestore = firebase.firestore();
        firestore.collection("users").doc(userId).set({
          username: username,
          name: name,
          gender: gender,
          district: district,
          province: province,
          type: usertype,
          phone: phoneNumber,
        });
        console.log(userId);
      });
  };

  return (
    <ScrollView
      style={{
        backgroundColor: COLORS.white,
        padding: SIZES.padding * 3,
        flex: 1,
      }}
    >
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifire}
        firebaseConfig={firebase.app().options}
        attemptInvisibleVerification={false}
      />
      <Text style={{ ...FONTS.h2, marginBottom: 30 }}>
        Register to get Started
      </Text>
      <View style={styles.miniContainer}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          keyboardType="default"
          placeholder="Enter user namer here"
          placeholderTextColor="rgb(135, 135, 135)"
          //   caption={errors.email.length > 0 && errors.email}
          //   status={errors.email.length > 0 ? "danger" : ""}
          style={styles.input}
          onChangeText={setusername}
        />

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          keyboardType="default"
          placeholder="*Enter full name here"
          placeholderTextColor="rgb(135, 135, 135)"
          style={styles.input}
          onChangeText={setname}
        />

        <Text style={styles.label}>Gender</Text>
        <TextInput
          keyboardType="default"
          placeholder="Male / Female"
          placeholderTextColor="rgb(135, 135, 135)"
          style={styles.input}
          onChangeText={setgender}
        />
      </View>

      <View style={styles.miniContainer}>
        <Text style={styles.label}>District</Text>
        <TextInput
          keyboardType="default"
          placeholder="Enter district here"
          placeholderTextColor="rgb(135, 135, 135)"
          style={styles.input}
          onChangeText={setdistrict}
        />

        <Text style={styles.label}>Province</Text>
        <TextInput
          keyboardType="default"
          placeholder="Enter your province here"
          placeholderTextColor="rgb(135, 135, 135)"
          style={styles.input}
          onChangeText={setprovince}
        />
      </View>

      <Text style={styles.label}>User Type</Text>
      <TextInput
        keyboardType="default"
        placeholder="Buyer / Seller"
        placeholderTextColor="rgb(135, 135, 135)"
        style={styles.input}
        onChangeText={setusertype}
      />

      <Text style={styles.label}>Phone</Text>
      <TextInput
        keyboardType="default"
        placeholder="phone number e.g. 0977 123 456"
        placeholderTextColor="rgb(135, 135, 135)"
        autoCompleteType="tel"
        style={styles.input}
        onChangeText={setPhoneNumber}
      />

      <TouchableOpacity style={styles.buttonLogin} onPress={sendVerification}>
        <Text style={styles.buttonText}>Get OTP</Text>
      </TouchableOpacity>
      <View style={{ height: 20 }}></View>
      <TextInput
        // value="OTP"
        keyboardType="number-pad"
        placeholder="Enter OTP"
        placeholderTextColor="black"
        onChangeText={setCode}
        style={styles.input}
      />

      <TouchableOpacity style={styles.buttonLogin} onPress={confirmCode}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.buttonLogin_}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.buttonLoginText}>
          Already have an account? Login.
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Just some styles

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 40,

    padding: SIZES.padding * 2,
  },
  input: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  label: {
    ...FONTS.h5,
    marginVertical: 5,
  },
  buttonLogin: {
    backgroundColor: COLORS.black,
    borderRadius: 10,
    paddingVertical: 20,
    marginVertical: 5,
  },
  buttonText: {
    color: COLORS.white,
    textAlign: "center",
    ...FONTS.h5,
  },
  buttonLoginText: {
    color: COLORS.black,
    textAlign: "center",
    ...FONTS.h5,
  },
  buttonLogin_: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingVertical: 20,
    marginVertical: 5,
  },
});

export default Signup;
