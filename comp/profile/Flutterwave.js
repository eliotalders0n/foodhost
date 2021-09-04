import React from "react";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";

export default function Flutterwave() {
  const config = {
    public_key: "FLWPUBK_TEST-b843beaf03d0af903cc72d12744b2676-X",
    tx_ref: Date.now(),
    amount: 12,
    currency: "ZMW",
    payment_options: "mobile_money_zambia",
    customer: {
      email: "eliot.alderson20@gmail.com",
      phonenumber: "+260974755027",
      name: "Pukata Mwanza",
    },
    customizations: {
      title: "Inquiry",
      description: "Payment for inquiry",
      logo: "https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg",
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  return (
    <div className="App">
      <h1>Hello Test user</h1>

      <button
        onClick={() => {
          handleFlutterPayment({
            callback: (response) => {
              console.log(response);
              closePaymentModal(); // this will close the modal programmatically
            },
            onClose: () => {},
          });
        }}
      >
        Payment with React hooks
      </button>
    </div>
  );
}
