import React, { createContext, useContext, useState } from 'react';

const CityContext = createContext();

export const CITIES = [
  'Mumbai',
  'Delhi-NCR',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Pune',
  'Kolkata',
  'Ahmedabad',
];

export const CityProvider = ({ children }) => {
  const [selectedCity, setSelectedCity] = useState(
    localStorage.getItem('user_city') || 'Mumbai'
  );

  const changeCity = (city) => {
    setSelectedCity(city);
    localStorage.setItem('user_city', city);
  };

  return (
    <CityContext.Provider value={{ selectedCity, changeCity, availableCities: CITIES }}>
      {children}
    </CityContext.Provider>
  );
};

export const useCity = () => useContext(CityContext);
