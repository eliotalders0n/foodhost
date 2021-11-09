import React from "react";
import firebase from "../..//firebase";

const useCheckUser = (phone) => {
  const [docs, setDocs] = React.useState([]);

  //   console.log("useEffect", phone);
  React.useEffect(() => {
    firebase
      .firestore()
      .collection("users")
      .where("phone", "==", phone)
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
  }, [phone]);

  return { docs };
};

export default useCheckUser;
