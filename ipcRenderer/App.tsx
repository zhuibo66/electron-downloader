import React, { useEffect } from "react";
import { useModule } from "@/store/index";
const App = (props) => {
  const { aria2cModule, downloadModule } = useModule();
  const handleClick = () => {
    console.log("aria2cModule.disconnect");
    aria2cModule.disconnect();
  };
  return (
    <div>
      <p onClick={handleClick}>我是APPs1页面,关闭定时器</p>
    </div>
  );
};
export default App;
