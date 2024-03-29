import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Button,
  Platform,
} from "react-native";
import firebase from "../../firebase";
import { SIZES, FONTS, COLORS } from "../../constants";
import { useNavigation } from "@react-navigation/native";
import useGetUser from "../crud/useGetUser";
// import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const Inquiry = ({ route }) => {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();
  const navigation = useNavigation();
  let uid = firebase.auth().currentUser.uid;

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) =>
      setExpoPushToken(token)
    );

    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  let data = route.params.item;
  let user = useGetUser(data.u_id).docs;
  const [bags, setBags] = useState(null);
  const [instruction, setInstruction] = useState(null);
  console.log("produce", data.produce_category);
  console.log("second number", user.expoPushToken);

  // function sendInquiry(trans_id, tx_ref) {
  function sendInquiry() {
    async () => {
      await sendPushNotification();
      console.log("some sent");
    };
    let inquiry = {
      buyer: firebase.auth().currentUser.uid,
      createdAt: new Date(Date.now()).toString(),
      price: parseInt(data.price),
      totalPrice: parseInt(data.price) * parseInt(bags),
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
        sendPushNotification();
        console.log("Inquiry sent");
        navigation.goBack();
      })
      .catch((e) => {
        console.log(e);
      });
  }

  // const config = {
  //   public_key: "FLWPUBK_TEST-b843beaf03d0af903cc72d12744b2676-X",
  //   tx_ref: Date.now(),
  //   amount: parseInt(bags) * parseInt(data.price),
  //   currency: "ZMW",
  //   payment_options: "mobile_money_zambia",
  //   customer: {
  //     email: "eliot.alderson20@gmail.com",
  //     phonenumber: firebase.auth().currentUser.phoneNumber,
  //     name: user.name,
  //   },
  //   subaccounts: [
  //     {
  //       id: "RS_A40A6285D1F6E36AD4ED9392A86E70A9",
  //       transaction_split_ratio: 2,
  //       transaction_charge_type: "percentage",
  //       transaction_charge: 0.15,
  //     },
  //   ],
  //   callback: function (data) {
  //     console.log(data);
  //   },
  //   customizations: {
  //     title: "Inquiry",
  //     description: "Payment for inquiry",
  //     logo: "https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg",
  //   },
  // };

  // const handleFlutterPayment = useFlutterwave(config);

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
        onPress={() => sendInquiry()}
        // onPress={() => {
        //   handleFlutterPayment({
        //     callback: (response) => {
        //       console.log(response);
        //       sendInquiry(response.transaction_id, response.tx_ref);
        //       closePaymentModal();
        //       // this will close the modal programmatically
        //     },
        //     onClose: () => {},
        //   });
        // }}
      >
        <Text style={{ color: COLORS.white, textAlign: "right", ...FONTS.h4 }}>
          Make Offer
        </Text>
      </TouchableOpacity>
    </View>
  );

  async function sendPushNotification() {
    const expoPushToken = user.expoPushToken;
    console.log("some token", expoPushToken);
    const message = {
      to: expoPushToken,
      sound: "default",
      title: "Original Title",
      body: instruction,
      data: { someData: "goes here" },
    };

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
  }

  async function registerForPushNotificationsAsync() {
    let token;
    if (Constants.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        alert("Failed to get push token for push notification!");
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log(token);
    } else {
      alert("Must use physical device for Push Notifications");
    }

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    firebase.firestore().collection("users").doc(uid).update({
      expoPushToken: token,
    });
    return token;
  }
};

export default Inquiry;
