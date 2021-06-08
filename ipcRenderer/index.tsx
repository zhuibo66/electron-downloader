import React from "react";
import ReactDOM from "react-dom";
import { Provider as ReduxProvider } from "react-redux";
import store from "@/store/index";
import RpcConnection from "@/GlobalComponents/RpcConnection";
ReactDOM.render(
  <ReduxProvider store={store}>
    <RpcConnection />
  </ReduxProvider>,
  document.getElementById("root")
);
