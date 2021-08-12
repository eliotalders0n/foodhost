import React, { useState, useEffect } from "react";
import { Text, View, Image } from "react-native";
import firebase from "../../firebase";
import { SIZES, FONTS, COLORS } from "../../constants";
import { useNavigation } from "@react-navigation/native";
import useGetUser from "../crud/useGetUser";

const SearchItem = ({ data }) => {
  let user = useGetUser(data.u_id).docs;
  return (
    <View>
      <Image
        style={{
          width: "100%",
          height: 400,
          borderRadius: 10,
          resizeMode: "cover",
        }}
        source={data.images}
      />
      <View
        style={{
          width: "70%",
          marginTop: -100,
          paddingVertical: 10,
          marginLeft: 10,
          borderRadius: 10,
          backgroundColor: "rgba(0, 0, 0, 0.1)",
        }}
      >
        <Text
          style={{
            paddingHorizontal: 20,
            ...FONTS.h5,
            color: COLORS.white,
          }}
        >
          {data.produce}
        </Text>
        <Text
          style={{
            paddingHorizontal: 20,
            ...FONTS.h6,
            color: COLORS.white,
          }}
        >
          {data.produce_category}
        </Text>
        <Text
          style={{
            paddingHorizontal: 20,
            ...FONTS.h6,
            color: COLORS.white,
          }}
        >
          ZMW: {data.price}
        </Text>
      </View>
    </View>
  );
};

export default SearchItem;
