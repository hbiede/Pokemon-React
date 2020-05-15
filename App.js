/**
 * Pokemon Battle app built in React Native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {Text, View, Button, Image, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {Picker} from '@react-native-community/picker';

function titleCase(input: String): String {
  return input[0].toUpperCase() + input.substring(1);
}

function findHealth(userPokemon): Number {
  const statName: String = 'hp';
  for (let i = 0; i < userPokemon.stats.length; i++) {
    if (statName === userPokemon.stats[i].stat.name) {
      return userPokemon.stats[i].base_stat;
    }
  }

  return -1;
}

class PokemonPickerView extends React.Component {
  state = {
    value: 'key1',
  };

  constructor(props) {
    super(props);
    this.navigation = props.navigation;
    this.state = {
      pokemon: [],
      error: null,
      isLoaded: false,
      selectedPokemon: 0,
    };
    this.getPokemon();
  }

  async getPokemon() {
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
        return <Picker.Item label={titleCase(s.name)} value={i} key={i} />;
      });

      if (pokemonListEntries.length > 0) {
        return (
          <View>
            <Picker
              selectedValue={this.state.selectedPokemon}
              onValueChange={(pokemon) =>
                this.setState({selectedPokemon: pokemon})
              }>
              {pokemonListEntries}
            </Picker>
            <Button
              title="Battle!"
              onPress={() =>
                this.navigation.navigate('Battle!', {
                  userPokemon: this.state.pokemon[this.state.selectedPokemon],
                  listOfOpponents: this.state.pokemon,
                })
              }
            />
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

class BattleView extends React.Component {
  constructor(props: Props) {
    super(props);
    this.state = {
      userPokemon: props.route.params.userPokemon,
      listOfOpponents: props.route.params.listOfOpponents,
      currentOpponentIndex: -1,
      userHealth: findHealth(props.route.params.userPokemon),
    };
    this.startBattle();
  }

  startBattle() {
    let newOpponentIndex = Math.floor(
      Math.abs(Math.random() * this.state.listOfOpponents.length),
    );
    this.state.currentOpponentIndex = newOpponentIndex;
    this.state.opponentHealth = findHealth(
      this.state.listOfOpponents[newOpponentIndex],
    );
  }

  render(): React$Node {
    if (this.state.userPokemon) {
      return (
        <View>
          <Image
            style={styles.opponentPokemon}
            source={{
              uri: this.state.listOfOpponents[this.state.currentOpponentIndex]
                .sprites.front_default,
            }}
            resizeMode="contain"
          />
          <Text style={styles.center}>
            {titleCase(
              this.state.listOfOpponents[this.state.currentOpponentIndex].name,
            )}
            's Health: {this.state.opponentHealth}
          </Text>
          <Image
            style={styles.userPokemon}
            source={{
              uri: this.state.userPokemon.sprites.back_default,
            }}
            resizeMode="contain"
          />
          <Text style={styles.center}>
            {titleCase(this.state.userPokemon.name)}'s Health:{' '}
            {this.state.userHealth}
          </Text>
        </View>
      );
    } else {
      return <Text>No pokemon selected</Text>;
    }
  }
}

const styles = StyleSheet.create({
  userPokemon: {
    paddingTop: 150,
    width: 'auto',
  },
  opponentPokemon: {
    paddingTop: 200,
    width: 'auto',
  },
  center: {
    textAlign: 'center',
  },
});
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
