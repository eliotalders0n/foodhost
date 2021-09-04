import React from "react";
import firebase from "../../firebase";

const useGetUser = (id) => {
  const [docs, setDocs] = React.useState([]);

  React.useEffect(() => {
    const unsub = firebase
      .firestore()
      .collection("users")
      .doc(id)
      .onSnapshot((doc) => {
        let asd = {
          id: doc.id,
          ...doc.data(),
        };
        setDocs(asd);
      });
  }, []);

  return { docs };
};

export default useGetUser;
