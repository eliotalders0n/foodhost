import React, { useState, useRef } from "react";
import {
  Alert,
  TextInput,
  StyleSheet,
  Text,
  ScrollView,
  View,
  TouchableOpacity,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { SIZES, COLORS, FONTS } from "../../constants";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import firebase from "./../../firebase";
import useCheckUser from "../crud/useCheckUser";

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
  const user = useCheckUser(phoneNumber + "").docs;

  // function to request for a verification code

  const sendVerification = () => {
    // validation checkUser
    if (name.length < 3) {
      alert("Please enter valid full name not less than 2 characters");
      return;
    }
    if (username.length < 2) {
      alert("Please enter valid user name not less than 2 characters");
      return;
    }
    if (phoneNumber.length < 10) {
      alert("Please enter a valid phone number, DON'T ADD +26");
      return;
    }
    if (user.length !== 0) {
      alert("You already have an account please sign in");
      navigation.navigate("Login");
      return;
    } else {
      const phoneProvider = new firebase.auth.PhoneAuthProvider();
      phoneProvider
        .verifyPhoneNumber("+26" + phoneNumber, recaptchaVerifire.current)
        .then(setVerificationId)
        .catch((e) => {
          console.log(e);
        });
    }
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
    if (code.length < 6) {
      console.log(" code is less than 6");
      alert("Your OTP is less than 6 characters, please try again.");
      console.log("verification id : ", verificationId);
      return;
    }
    if (verificationId == null) {
      console.log("verification failed ", verificationId);
      alert("Your verification is incomplete please verify with OTP.");
      return;
    }
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
          type: "seller",
          phone: phoneNumber,
        });
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

  const districtList = ["lusaka", "ndola", "kitwe", "ndola"];
  const districs = () => {
    return districtList.map((x, i) => {
      return <Picker.Item label={x} key={i} value={x} />;
    });
  };

  const provinceList = [
    "lusaka",
    "copperbelt",
    "eastern",
    "southern",
    "northen",
    "luapula",
    "western",
    "north western",
    "central",
    "luapula",
    "muchinga",
  ];
  const provinces = () => {
    return provinceList.map((x, i) => {
      return <Picker.Item label={x} key={i} value={x} />;
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
      <Text style={{ ...FONTS.h4, marginBottom: 20 }}>
        Please note that lables marked with ( * ) are required.
      </Text>
      <View style={styles.miniContainer}>
        <Text style={styles.label}>Username *</Text>
        <TextInput
          keyboardType="default"
          placeholder="Enter user namer here"
          placeholderTextColor="rgb(135, 135, 135)"
          style={styles.input}
          onChangeText={setusername}
        />

        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          keyboardType="default"
          placeholder="*Enter full name here"
          placeholderTextColor="rgb(135, 135, 135)"
          style={styles.input}
          onChangeText={setname}
        />

        <Text style={styles.label}>Gender</Text>
        <Picker
          style={{ borderRadius: 10 }}
          selectedValue={gender}
          onValueChange={(itemValue, itemIndex) => setgender(itemValue)}
          prompt={"select gender"}
        >
          <Picker.Item label="Male" value="Male" />
          <Picker.Item label="Female" value="Female" />
        </Picker>
      </View>

      <View style={styles.miniContainer}>
        <Text style={styles.label}>{"\n"}District</Text>
        <Picker
          selectedValue={district}
          onValueChange={(value) => setdistrict(value)}
        >
          {districs()}
        </Picker>
        <Text style={styles.label}>{"\n"}Province </Text>
        <Picker
          selectedValue={province}
          onValueChange={(value) => setprovince(value)}
        >
          {provinces()}
        </Picker>
      </View>

      {/* <Text style={styles.label}>User Type</Text> */}
      {/* <TextInput
        keyboardType="default"
        placeholder="Buyer / Seller"
        placeholderTextColor="rgb(135, 135, 135)"
        style={styles.input}
        onChangeText={setusertype}
      /> */}

      <Text style={styles.label}>{"\n"}Phone *</Text>
      <TextInput
        keyboardType="number-pad"
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
        style={styles.buttonReg_}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.buttonRegText}>
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
