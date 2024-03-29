import React from "react";
import firebase from "../..//firebase";

const useGetCategories = () => {
  const [docs, setDocs] = React.useState([]);

  React.useEffect(() => {
    firebase
      .firestore()
      .collection("categories")
      .onSnapshot((snap) => {
        let data = [];
        snap.docs.forEach((e) => {
          let asd = {
            id: e.id,
            ...e.data(),
          };
          data.push(asd);
        });
        setDocs(data);
      });
  }, []);
  return { docs };
};

export default useGetCategories;
