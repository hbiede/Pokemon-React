/**
 * The view used to display the initial Pokemon picker pre-battle
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {Button, Text, View} from 'react-native';
import {Picker} from '@react-native-community/picker';
import {capitalCase} from '../utils';

/**
 * The number of Pokemon to include when downloading from the API (152 for first gen)
 * @type {Number}
 */
const POKEMON_TO_DOWNLOAD: Number = 152;

export class PokemonPickerView extends React.Component {
  constructor(props) {
    super(props);

    // Reuse the existing locally-cached version of the pokemon list if given to the view in the prop params
    let listOfPokemon: Array<Pokemon> = [];
    // noinspection JSUnresolvedVariable - Pokemon is being tested for existance
    if (props.route && props.route.params && props.route.params.pokemon) {
      // noinspection JSUnresolvedVariable
      listOfPokemon = props.route.params.pokemon;
    }

    let selectedPokemonIndex = 0;
    if (
      props.route &&
      props.route.params &&
      props.route.params.selectedPokemonIndex &&
      !isNaN(props.route.params.selectedPokemonIndex)
    ) {
      // Allow a previously used pokemon to continue being selected after going back
      selectedPokemonIndex = props.route.params.selectedPokemonIndex;
    }
    this.state = {
      navigation: props.navigation,
      listOfPokemon: listOfPokemon,
      error: null,
      selectedPokemonIndex: selectedPokemonIndex,
    };
    if (listOfPokemon.length === 0) {
      // noinspection JSIgnoredPromiseFromCall - void promise
      this.getPokemon();
    }
  }

  /**
   * Downloads all Pokemon for the generation (based on the value of {@code POKEMON_TO_DOWNLOAD})
   * @return {Promise<void>}
   */
  async getPokemon() {
    let pokemonFetched = [];
    for (let i = 1; i < POKEMON_TO_DOWNLOAD && this.state.error == null; i++) {
      await fetch('https://pokeapi.co/api/v2/pokemon/' + i)
        .then((result) => result.json())
        .then(
          (result) => pokemonFetched.push(result),
          (error) =>
            this.setState({
              error: error,
            }),
        );
    }
    if (pokemonFetched.length > 0) {
      // needs to setState instead of return to allow for a re-render
      this.setState({listOfPokemon: pokemonFetched});
    } else {
      this.setState({error: 'No Pokemon Found'});
    }
  }

  render(): View {
    if (this.state.error) {
      return <Text>Error: {this.state.error}</Text>;
    } else if (this.state.listOfPokemon.length > 0) {
      let pokemonListEntries = this.state.listOfPokemon.map((s, i) => {
        return (
          <Picker.Item
            label={`${capitalCase(s.name)} - #${i + 1}`}
            value={i}
            key={i}
          />
        );
      });

      return (
        <View>
          <Picker
            selectedValue={this.state.selectedPokemonIndex}
            onValueChange={(pokemon) =>
              this.setState({selectedPokemonIndex: pokemon})
            }>
            {pokemonListEntries}
          </Picker>
          <Button
            title="Battle!"
            onPress={() =>
              this.state.navigation.navigate('Battle!', {
                selectedPokemonIndex: this.state.selectedPokemonIndex,
                listOfPokemon: this.state.listOfPokemon,
              })
            }
          />
        </View>
      );
    } else {
      return <Text>Loading...</Text>;
    }
  }
}
