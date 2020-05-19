/**
 * Pokemon Battle app built in React Native
 *
 * @format
 * @flow strict-local
 */

// TODO: Implement the type system
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {PokemonPickerView, BattleView} from './screens';

const Stack = createStackNavigator();
const App: () => React$Node = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Pick your Pokemon">
        <Stack.Screen name="Pick your Pokemon" component={PokemonPickerView} />
        <Stack.Screen name="Battle!" component={BattleView} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
