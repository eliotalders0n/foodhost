import React, { useState, useEffect } from "react";
import { Text, View, TextInput, TouchableOpacity, Alert } from "react-native";
import firebase from "../../firebase";
import { SIZES, FONTS, COLORS } from "../../constants";
import { useNavigation } from "@react-navigation/native";
import useGetUser from "../crud/useGetUser";

const Inquiry = ({ route }) => {
  const navigation = useNavigation();
  let data = route.params.data;
  let user = useGetUser(data.u_id).docs;
  const [bags, setBags] = useState(null);
  const [instruction, setInstruction] = useState(null);
  // console.log(user.id);
  // console.log(firebase.auth().currentUser.uid);

  function sendInquiry() {
    if (data.u_id == firebase.auth().currentUser.uid) {
      Alert.alert("Denied", "Cant inquire from yourself", [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
      console.log("Cant inquire from yourself");
    } else {
      let inquiry = {
        buyer: firebase.auth().currentUser.uid,
        createdAt: new Date(Date.now()).toString(),
        price: parseInt(data.price),
        produce: data.produce,
        quant: parseInt(bags),
        ProductID: data.id,
        instruction: instruction,
        seller: data.u_id,
        status: "pending",
      };
      firebase
        .firestore()
        .collection("inquires")
        .add(inquiry)
        .then(() => {
          console.log("Inquiry sent");
          navigation.goBack();
        })
        .catch((e) => {
          console.log(e);
        });
    }
  }

  return (
    <View
      style={{
        backgroundColor: COLORS.white,
        height: "100%",
        padding: SIZES.padding,
      }}
    >
      <View style={{ backgroundColor: COLORS.white, flexDirection: "row" }}>
        <View
          style={{
            backgroundColor: COLORS.secondary,
            marginHorizontal: 5,
            flex: 1,
            padding: SIZES.padding * 2,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: COLORS.white, ...FONTS.h4 }}>{user.name}</Text>
          <Text style={{ color: COLORS.white, ...FONTS.h6 }}>
            {data.items} plates remaining
          </Text>
          <Text style={{ color: COLORS.white, ...FONTS.h6 }}>
            {data.produce_category}
          </Text>
        </View>
      </View>
      {/* <View>
                <Text>Am offering to pay K15kwacha for 1 KG, i will need 10 bags of 5KG</Text>
            </View> */}
      <View style={{ padding: SIZES.padding }}>
        <Text style={{ ...FONTS.h4 }}>Make offer</Text>
        <Text>
          My current price for 1 plate of {data.produce} is ZMW {data.price}.{" "}
          {"\n"}
          {"\n"}
        </Text>
        <Text>How many plates of {data.produce} do you need?</Text>
        <TextInput
          keyboardType="number-pad"
          placeholder="e.g. 10"
          onChangeText={(value) => setBags(value)}
          style={{
            padding: SIZES.padding,
            borderRadius: 5,
            marginVertical: 10,
            borderWidth: 0.2,
          }}
        />
        <Text style={{ ...FONTS.h4 }}>Meal instructions</Text>
        <TextInput
          keyboardType="number-pad"
          placeholder="I would prefer :"
          onChangeText={(value) => setInstruction(value)}
          style={{
            padding: SIZES.padding,
            borderRadius: 5,
            marginVertical: 10,
            borderWidth: 0.2,
          }}
        />
      </View>
      <TouchableOpacity
        style={{
          backgroundColor: COLORS.black,
          marginTop: 40,
          borderRadius: 10,
          paddingHorizontal: 30,
          paddingVertical: 20,
        }}
        onPress={() => sendInquiry()}
      >
        <Text style={{ color: COLORS.white, textAlign: "right", ...FONTS.h4 }}>
          Make Offer
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Inquiry;