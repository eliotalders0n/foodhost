import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList,
  Alert,
} from "react-native";
import firebase from "../../firebase";
import { SIZES, FONTS, COLORS } from "../../constants";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import useGetUser from "../crud/useGetUser";
import useGetProduct from "../crud/useGetProduct";

const ViewProduce = ({ route }) => {
  let id = route.params.item;
  let item = useGetProduct(id.id).docs;
  console.log("products XXX : ", item);
  console.log("params : ", id);
  let data = useGetUser(id.u_id).docs;
  console.log("from item: ", data);
  const navigation = useNavigation();

  useEffect(() => {
    firebase
      .firestore()
      .collection("products")
      .doc(item.id)
      .update({
        views: firebase.firestore.FieldValue.increment(1),
      });
  }, []);

  const renderItem = ({ data }) => (
    <TouchableOpacity
      style={{
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: COLORS.white,
      }}
    >
      <Image
        style={{ flex: 1, height: 220, borderRadius: 10, resizeMode: "cover" }}
        source={{
          uri: data,
        }}
      />
    </TouchableOpacity>
  );
  const checkUser = () => {
    if (item.u_id !== firebase.auth().currentUser.uid) {
      return (
        <TouchableOpacity
          onPress={() => navigation.navigate("inquire", { item })}
          style={{
            flex: 1,
            width: SIZES.width,
            borderRadius: 10,
            backgroundColor: COLORS.black,
            marginHorizontal: 5,
          }}
        >
          <Text
            style={{
              color: COLORS.white,
              ...FONTS.h5,
              padding: SIZES.padding * 2,
              textAlign: "center",
            }}
          >
            Inquire from {data && data.name}
          </Text>
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity
          onPress={() => navigation.navigate("editProduct", { item })}
          style={{
            flex: 1,
            width: SIZES.width,
            borderRadius: 10,
            backgroundColor: COLORS.secondary,
            marginHorizontal: 5,
          }}
        >
          <Text
            style={{
              color: COLORS.white,
              ...FONTS.h5,
              padding: SIZES.padding * 2,
              textAlign: "center",
            }}
          >
            Edit this meal
          </Text>
        </TouchableOpacity>
      );
    }
  };

  return (
    <ScrollView style={{ backgroundColor: COLORS.white }}>
      <View
        style={{
          backgroundColor: COLORS.white,
          flex: 1,
          padding: SIZES.padding * 2,
        }}
      >
        <View style={{ height: 250 }}>
          <Image
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 10,
              resizeMode: "cover",
            }}
            source={{
              uri: item.images,
            }}
          />
        </View>

        <View
          style={{
            paddingTop: 10,
            marginHorizontal: 20,
            marginTop: -30,
            backgroundColor: COLORS.white,
            borderRadius: 10,
          }}
        >
          <Text
            style={{
              color: COLORS.black,
              ...FONTS.h2,
              textAlign: "center",
              fontWeight: "900",
            }}
          >
            {item.produce}
          </Text>
          <Text
            style={{
              color: COLORS.secondary,
              ...FONTS.h4,
              textAlign: "center",
            }}
          >
            {item.produce_category}
          </Text>
          <Text
            style={{
              color: COLORS.darkgray,
              ...FONTS.h6,
              textAlign: "center",
            }}
          >
            {item.delivery === "0" ? "Stationary" : "Mobile"}
          </Text>
          <View style={{ flexDirection: "row", flex: 1, marginVertical: 20 }}>
            {checkUser()}
          </View>
        </View>

        <View style={{ flexDirection: "row", marginVertical: 10 }}>
          <View
            style={{
              flex: 1,
              marginHorizontal: 5,
              padding: SIZES.padding * 4,
              borderRadius: 10,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(225,225,225,0.3)",
            }}
          >
            <Text
              style={{
                color: COLORS.black,
                ...FONTS.h6,
                textAlign: "center",
              }}
            >
              Price
            </Text>
            <Text
              style={{
                color: COLORS.black,
                ...FONTS.h2,
                textAlign: "center",
              }}
            >
              K{item.price}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              marginHorizontal: 5,
              padding: SIZES.padding * 4,
              borderRadius: 10,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(225,225,225,0.3)",
            }}
          >
            <Text
              style={{
                color: COLORS.black,
                ...FONTS.h6,
                textAlign: "center",
              }}
            >
              Items available
            </Text>
            <Text
              style={{
                color: COLORS.black,
                ...FONTS.h2,
                textAlign: "center",
              }}
            >
              {item.items}
            </Text>
          </View>
        </View>

        <Text style={{ ...FONTS.h4, marginVertical: 20 }}>Gallery</Text>
        {item && (
          <FlatList
            data={item.gallery}
            veertical
            showsHorizontalScrollIndicator={false}
            keyExtractor={(data) => `${data}`}
            renderItem={renderItem}
            contentContainerStyle={{}}
          />
        )}
      </View>
    </ScrollView>
  );
};

export default ViewProduce;
