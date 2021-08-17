import React, { useState, useEffect } from "react";
import { Text, View, TextInput, TouchableOpacity, Alert } from "react-native";
import firebase from "../../firebase";
import { SIZES, FONTS, COLORS } from "../../constants";
import { useNavigation } from "@react-navigation/native";
import useGetUser from "../crud/useGetUser";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";

const Inquiry = ({ route }) => {
  const navigation = useNavigation();
  let data = route.params.data;
  let user = useGetUser(data.u_id).docs;
  const [bags, setBags] = useState(null);
  const [instruction, setInstruction] = useState(null);
  console.log("first number", data);

  function sendInquiry(trans_id, tx_ref) {
    let inquiry = {
      buyer: firebase.auth().currentUser.uid,
      createdAt: new Date(Date.now()).toString(),
      price: parseInt(data.price),
      totalPrice: parseInt(data.price) * parseInt(bags),
      transactionId: trans_id,
      tx_ref: tx_ref,
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

  const config = {
    public_key: "FLWPUBK_TEST-b843beaf03d0af903cc72d12744b2676-X",
    tx_ref: Date.now(),
    amount: parseInt(bags) * parseInt(data.price),
    currency: "ZMW",
    payment_options: "mobile_money_zambia",
    customer: {
      email: "eliot.alderson20@gmail.com",
      phonenumber: firebase.auth().currentUser.phoneNumber,
      name: user.name,
    },
    subaccounts: [
      {
        id: "RS_A40A6285D1F6E36AD4ED9392A86E70A9",
        transaction_split_ratio: 2,
        transaction_charge_type: "percentage",
        transaction_charge: 0.15,
      },
    ],
    callback: function (data) {
      console.log(data);
    },
    customizations: {
      title: "Inquiry",
      description: "Payment for inquiry",
      logo: "https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg",
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  console.log("second number test before view");
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
      <View style={{ padding: SIZES.padding }}>
        <Text style={{ ...FONTS.h4 }}>Make offer</Text>
        <Text>
          My current price for 1 plate of {data.produce} is ZMW {data.price}
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
          keyboardType="default"
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
        onPress={() => {
          handleFlutterPayment({
            callback: (response) => {
              console.log(response);
              sendInquiry(response.transaction_id, response.tx_ref);
              closePaymentModal();
              // this will close the modal programmatically
            },
            onClose: () => {},
          });
        }}
      >
        <Text style={{ color: COLORS.white, textAlign: "right", ...FONTS.h4 }}>
          Make Offer
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Inquiry;
