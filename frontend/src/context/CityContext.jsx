import React, { createContext, useContext, useState } from 'react';

const CityContext = createContext();

export const CITIES = [
  'Vijayawada', 'Visakhapatnam', 'Guntur', 'Tirupati', 'Nellore', 'Kadapa', 'Kurnool',
  'Rajahmundry', 'Kakinada', 'Anantapur', 'Eluru', 'Ongole', 'Machilipatnam',
  'Srikakulam', 'Vizianagaram', 'Bhimavaram',
];

export const CityProvider = ({ children }) => {
  const [selectedCity, setSelectedCity] = useState(
    CITIES.includes(localStorage.getItem('user_city')) ? localStorage.getItem('user_city') : 'Vijayawada'
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
