import { createContext, useContext, useState } from "react";

const AppContext = createContext();

export function AppProvider({ children }) {

  const [advisor, setAdvisor] = useState("");

  const [status, setStatus] = useState("OFF");

  const [currentTimer, setCurrentTimer] = useState(null);

  const [history, setHistory] = useState([]);

  const value = {

    advisor,
    setAdvisor,

    status,
    setStatus,

    currentTimer,
    setCurrentTimer,

    history,
    setHistory

  };

  return (

    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>

  );

}

export function useApp(){

    return useContext(AppContext);

}