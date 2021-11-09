import React, { useState, useRef } from "react";
import {
  TextInput,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { SIZES, COLORS, FONTS } from "../../constants";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import firebase from "../../firebase";
import { useNavigation } from "@react-navigation/native";
import useCheckUser from "../crud/useCheckUser";
// import useGetUser from "../crud/useGetUser";

function Signin() {
  let navigation = useNavigation();
  const [phoneNumber, setPhoneNumber] = useState("");
  const recaptchaVerifire = useRef(null);
  const [verificationId, setVerificationId] = useState(null);
  const [code, setCode] = useState("");
  const user = useCheckUser(phoneNumber + "").docs;

  const sendVerification = () => {
    console.log("entered number: ", phoneNumber);
    console.log("database phone number: ", user);
    if (phoneNumber.length < 10) {
      alert("Please enter a valid phone number, DON'T ADD +26");
      return;
    }
    if (user.length === 0) {
      alert("No account found please register");
      navigation.navigate("Register");
      return;
    } else {
      const phoneProvider = new firebase.auth.PhoneAuthProvider();
      phoneProvider
        .verifyPhoneNumber("+26" + phoneNumber, recaptchaVerifire.current)
        .then(setVerificationId)
        .catch((e) => {
          console.log(e);
        });
      alert("please wait for OTP SMS and enter it below");
    }
  };

  const confirmCode = () => {
    if (code.length < 6) {
      console.log(" code is less than 6");
      alert("Your OTP is less than 6 characters, please try again.");
      return;
    }
    const credential = firebase.auth.PhoneAuthProvider.credential(
      verificationId,
      code
    );

    // console.log("credential", credential);
    firebase
      .auth()
      .signInWithCredential(credential)
      .then((result) => {
        // do something amazing
        let userId = firebase.auth().currentUser.uid;
        console.log(userId);
      })
      .catch((e) => {
        console.log(e);
        const errorCode = e.code;
        if (errorCode) {
          console.log("Wrong password please try again");
          alert("Wrong password, please try again.");
        }
      });
  };

  return (
    <View style={styles.container}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifire}
        firebaseConfig={firebase.app().options}
        attemptInvisibleVerification={false}
      />
      <Text style={styles.titleText2}>Welcome back,</Text>
      <Text style={styles.titleText}>
        Enter phone number to login (Do not add +26)
      </Text>
      <TextInput
        // value="Phone Number"
        keyboardType="number-pad"
        placeholder="097XX XXX XXX"
        placeholderTextColor={COLORS.Gray}
        style={styles.input}
        autoCompleteType="tel"
        onChangeText={setPhoneNumber}
      />

      <TouchableOpacity style={styles.buttonLogin_} onPress={sendVerification}>
        <Text style={styles.buttonLoginText}>Get OTP </Text>
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
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.buttonReg_}
        onPress={() => navigation.navigate("Register")}
      >
        <Text style={styles.buttonRegText}>
          Press here to create an account.
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonLoginText: {
    color: COLORS.black,
    textAlign: "center",
    ...FONTS.h5,
  },
  buttonLogin_: {
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    paddingVertical: 20,
    marginVertical: 5,
  },
  buttonRegText: {
    color: COLORS.black,
    textAlign: "center",
    ...FONTS.h5,
  },
  buttonReg_: {
    backgroundColor: "pink",
    borderRadius: 10,
    paddingVertical: 20,
    marginVertical: 5,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SIZES.padding * 3,
    justifyContent: "center",
  },
  titleText: {
    ...FONTS.h5,
    color: COLORS.black,
  },
  titleText2: {
    marginBottom: 80,
    fontSize: 22,
    color: "black",
  },
  buttonText: {
    color: COLORS.white,
    textAlign: "center",
    ...FONTS.h5,
  },
  input: {
    padding: 10,
    borderRadius: 10,
  },
  button: {
    padding: 3,
    margin: 3,
    marginTop: 50,
  },
  buttonLoginText: {
    color: COLORS.black,
    textAlign: "center",
    ...FONTS.h5,
  },
  buttonLogin: {
    backgroundColor: COLORS.black,
    borderRadius: 10,
    paddingVertical: 20,
    marginVertical: 10,
  },
});
export default Signin;
