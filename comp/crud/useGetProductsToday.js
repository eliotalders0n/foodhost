import React from "react";
import firebase from "../..//firebase";

const useGetProductsToday = () => {
  const [docs, setDocs] = React.useState([]);

  React.useEffect(() => {
    firebase
      .firestore()
      .collection("products")
      .where("createdAt", "==", new Date(Date.now()).toString().slice(0, 15))
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

export default useGetProductsToday;
