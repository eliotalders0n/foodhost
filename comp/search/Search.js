import React, { useState, useRef, useEffect } from "react";
import {
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from "react-native";
import firebase from "../../firebase";
import { SIZES, FONTS, COLORS } from "../../constants";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import useGetCategories from "../crud/useGetCategories";
// import useGetAllProducts from "../crud/useGetAllProducts";
import useGetProductsToday from "../crud/useGetProductsToday";
import SearchItem from "./SearchItem";
import useSearch from "../crud/useSearch";

function Search() {
  let categories = useGetCategories().docs;

  const searchBOx = useRef();
  const searchButton = useRef();
  const navigation = useNavigation();
  let products = useGetProductsToday().docs;

  const [search, setSearch] = useState(null);
  const [status, setStatus] = useState(false);
  const [tag, setTag] = useState(0);
  let searchResults = useSearch(search, tag).docs;

  const renderProducts = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("viewProduce", { item })}
      key={item.id}
      style={{
        paddingVertical: 10,
        width: "97%",
        height: 400,
        borderRadius: 10,
        marginBottom: 5,
        margin: 5,
        backgroundColor: COLORS.white,
      }}
    >
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
          {item.produce}
        </Text>
        <Text
          style={{
            paddingHorizontal: 20,
            ...FONTS.h6,
            color: COLORS.white,
          }}
        >
          {item.produce_category}
        </Text>
        <Text
          style={{
            paddingHorizontal: 20,
            ...FONTS.h6,
            color: COLORS.white,
          }}
        >
          Price: {item.price}
        </Text>
      </View>
    </TouchableOpacity>
  );

  //from text search input
  function searchStuff(value) {
    setSearch(searchBOx.current.value);
    setTag(value);
  }

  //from the tag cloud
  function searchTags(value) {
    searchBOx.current.clear();
    setTag(0);
    setSearch(value);
  }

  //get search term in texrt input
  function getSearchTerm(value) {
    setSearch(value);
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => searchTags(item.name)}
      style={{
        paddingVertical: 10,
        marginHorizontal: 5,
        borderColor: COLORS.lightGray,
        borderRadius: 10,
        backgroundColor: COLORS.secondary,
        borderWidth: 0.4,
      }}
    >
      <Text style={{ paddingHorizontal: 20, color: "white", ...FONTS.h5 }}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderSearchItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("viewProduce", { item })}
      key={item.id}
      style={{
        paddingVertical: 10,
        width: "97%",
        height: 400,
        borderRadius: 10,
        marginBottom: 5,
        margin: 5,
        backgroundColor: COLORS.white,
      }}
    >
      <SearchItem data={item} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ marginBottom: 50 }}>
      <View style={{ padding: SIZES.padding, backgroundColor: COLORS.white }}>
        <View style={{ padding: SIZES.padding * 2 }}>
          {/* <Text style={{ ...FONTS.h2 }}>Search</Text> */}
          <Text
            style={{
              ...FONTS.h2,
              textAlign: "left",
              width: "70%",
              paddingBottom: 20,
            }}
          >
            Find food in your area, search below.
          </Text>
          <View style={{ flexDirection: "row", width: "100%" }}>
            <TextInput
              returnKeyType="search"
              ref={searchBOx}
              placeholder="search for something"
              onChangeText={(value) => getSearchTerm(value)}
              style={{
                padding: SIZES.padding,
                borderRadius: 10,
                borderColor: COLORS.lightGray,
                borderWidth: 0.4,
                marginRight: 10,
                flex: 1,
              }}
            />
            <TouchableOpacity
              onPress={() => searchStuff(1)}
              style={{
                backgroundColor: COLORS.black,
                alignSelf: "flex-end",
                padding: SIZES.padding,
                borderRadius: 10,
              }}
            >
              <Feather name="search" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={{ marginTop: 10, ...FONTS.h5 }}></Text>
          {categories && (
            <FlatList
              data={categories}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `${item.id}`}
              renderItem={renderItem}
              contentContainerStyle={{}}
            />
          )}
        </View>
        {/* {searchResults.length !== 0 ? (
          <View>
            <Text style={{ paddingHorizontal: 20, ...FONTS.h5 }}>
              {searchResults.length} {search} results
            </Text>
            <FlatList
              data={searchResults}
              vertical
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `${item.id}`}
              renderItem={renderSearchItem}
              contentContainerStyle={{}}
            />
          </View>
        ) : ( */}
        <View style={{ marginTop: 10 }}>
          {products && (
            <FlatList
              data={products}
              vertical
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `${item.id}`}
              renderItem={renderProducts}
              contentContainerStyle={{}}
            />
          )}
        </View>
        {/* )} */}
      </View>
    </ScrollView>
  );
}

export default Search;
