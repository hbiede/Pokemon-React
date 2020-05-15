/**
 * Pokemon Battle app built in React Native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {Text, View, Button} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {Picker} from '@react-native-community/picker';

class PokemonPickerView extends React.Component {
  state = {
    value: 'key1',
  };

  constructor(props) {
    super(props);
    this.state = {
      pokemon: [],
      error: null,
      isLoaded: false,
      selectedPokemon: null,
    };
  }

  async componentDidMount() {
    let pokemonFetched = [];
    for (let i = 1; i < 152 && this.state.error == null; i++) {
      await fetch('https://pokeapi.co/api/v2/pokemon/' + i)
        .then((result) => result.json())
        .then(
          (result) => pokemonFetched.push(result),
          (error) =>
            this.setState({
              isLoaded: true,
              error: error,
            }),
        );
    }

    // Not sure how else to do this:
    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState({
      pokemon: pokemonFetched,
      isLoaded: true,
    });
  }

  render(): View {
    if (this.state.error) {
      return <Text>{this.state.error}</Text>;
    } else if (this.state.isLoaded) {
      let pokemonListEntries = this.state.pokemon.map((s, i) => {
        return (
          <Picker.Item
            label={s.name[0].toUpperCase() + s.name.substring(1)}
            value={s.name}
            key={i}
          />
        );
      });

      if (pokemonListEntries.length > 0) {
        if (!this.state.selectedPokemon) {
          this.state.selectedPokemon = pokemonListEntries[0];
        }
        return (
          <View>
            <Picker
              selectedValue={this.state.selectedPokemon}
              onValueChange={(pokemon) =>
                this.setState({selectedPokemon: pokemon})
              }>
              {pokemonListEntries}
            </Picker>
            <Button title="Battle!" />
          </View>
        );
      } else {
        return <Text>No Pokemon found</Text>;
      }
    } else {
      return <Text>Loading...</Text>;
    }
  }
}

const Stack = createStackNavigator();
const App: () => React$Node = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Pick your Pokemon" component={PokemonPickerView} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
