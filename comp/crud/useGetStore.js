import React from "react";
import firebase from "../..//firebase";

function useGetStore() {
  const [docs, setDocs] = React.useState([]);

  React.useEffect(() => {
    const unsub = firebase
      .firestore()
      .collection("amenities")
      .doc("33907S056DShCxOGo4Zq")
      .onSnapshot((doc) => {
        setDocs(doc.data());
      });
  }, []);
  console.log("store dets", docs);
  return { docs };
}

export default useGetStore;
