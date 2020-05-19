/**
 * Pokemon Battle app built in React Native
 *
 * @format
 * @flow strict-local
 */

// TODO: Implement the type system
// TODO: Finish documentation
import React from 'react';
import {Button, Image, StyleSheet, Text, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {Picker} from '@react-native-community/picker';

/**
 * @typedef {Object} MoveRecord
 * @property {String} name
 * @property {String} type
 * @property {Number} power
 * @property {Number} accuracy
 */

/**
 * @typedef {Object} PokemonAttackMove
 * @property {String} name
 * @property {String} url
 */

/**
 * @typedef {Object} Stat
 * @property {String} name
 */

/**
 * @typedef {Object} StatCollection
 * @property {String} name
 * @property {Number} base_stat
 * @property {Stat} stat
 */

/**
 * @typedef {Object} PokemonCharacterSprite
 * @property {String} front_default
 * @property {String} back_default
 */

/**
 * @typedef {Object} Type
 * @property {Number} slot
 * @property {Object} type
 * @property {String} type.name
 * @property {String} type.url
 */

/**
 * @typedef {Object} Pokemon
 * @property {String} name
 * @property {Array.<PokemonAttackMove>} moves
 * @property {Array.<StatCollection>} stats
 * @property {PokemonCharacterSprite} sprites
 * @property {Array.<Type>} types
 */

/**
 * Converts the first letter of a string to a capital letter
 * @param input {string} The string to be converted
 * @returns {string} The input string with the first character made capital
 */
function titleCase(input: String): String {
  return input[0].toUpperCase() + input.substring(1);
}

/**
 * Takes a Pokemon JSON object and search for a stat with the given name
 * @param userPokemon An object describing a Pokemon (will contain an array `stats` ideally containing the stat desired
 * @param statName {string} The name of the stat being sought after
 * @returns {number|*} The value associated with the statName given. Returns -1 if the stat does not exist, and -2 if the object given is invalid
 */
function findStat(userPokemon, statName: String): Number {
  if (!userPokemon.stats) {
    return -2;
  }
  for (let i = 0; i < userPokemon.stats.length; i++) {
    if (statName === userPokemon.stats[i].stat.name) {
      return userPokemon.stats[i].base_stat;
    }
  }

  return -1;
}

/**
 * Calculates the damage associated with the move being performed
 * @param level {Number} The level of the Pokemon
 * @param move {MoveRecord} The details about the move performed
 * @param attack {Number} The attack value of the Pokemon
 * @param opponentDefense {Number} The defense value of the opponent Pokemon
 * @param speed {Number} The speed of the Pokemon
 * @param typesOfPokemon {Array.<Type>} The types of Pokemon performing the move
 * @returns {{damage: number, criticalHit: boolean, missed: boolean, stab: boolean}} The damage done, and booleans representing if the move was a critical hit or a miss (the booleans are exclusive)
 */
function calculateDamage(
  level: Number,
  move: MoveRecord,
  attack: Number,
  opponentDefense: Number,
  speed: Number,
  typesOfPokemon: Array<Type>,
) {
  /**
   * Checks if the move performed gets a same-type attack bonus (STAB)
   * @param {String} moveType The type of the move performed
   * @param {Array.<Type>} pokemonTypes The types associated with the pokemon performing the move
   * @return {Boolean} True iff the move earns a STAB
   */
  function didStab(moveType: String, pokemonTypes: Array<Type>) {
    for (let i = 0; i < pokemonTypes.length; i++) {
      if (pokemonTypes[i].type.name === moveType) {
        return true;
      }
    }
    return false;
  }

  /**
   * Calculates if the hit was landed critically
   * @param pokemonSpeed The speed of the pokemon in question
   * @returns {boolean} True iff the critical hit was landed, else false
   */
  function didCriticallyHit(pokemonSpeed: Number): Boolean {
    let critRate = Math.min(Math.floor(pokemonSpeed / 2), 255);
    return Math.floor(Math.random() * 255) < critRate;
  }

  let returnValue = {
    damage: 0,
    missed: move.accuracy <= Math.floor(Math.random() * 100),
    criticalHit: didCriticallyHit(speed),
    stab: didStab(move.type, typesOfPokemon),
  };
  if (!returnValue.missed) {
    // Use the convoluted equation for attack damage Pokemon uses
    returnValue.damage =
      Math.floor(
        Math.floor(
          (Math.floor((2 * level) / 5 + 2) * attack * move.power) /
            opponentDefense,
        ) / 50,
      ) + 2;

    if (returnValue.criticalHit) {
      returnValue.damage *= 1.5;
    }
    if (returnValue.stab) {
      // Same-type attack bonus (STAB)
      returnValue.damage *= 1.5;
    }
  }
  return returnValue;
}

/**
 * Create a message describing the move performed
 * @param name {String} The name of the Pokemon
 * @param moveName {String} The name of the move performed
 * @param movePerformance {{damage: number, criticalHit: boolean, missed: boolean, stab: boolean}} The information pertaining to the move's performance (as defined by {@link calculateDamage})
 * @returns {undefined}
 */
function formatAttackMessage(name, moveName, movePerformance) {
  let titledName = titleCase(name);
  if (movePerformance.missed) {
    return `${titledName} missed`;
  } else {
    return `${titledName} used ${moveName} and hit ${
      movePerformance.criticalHit ? 'critically ' : ''
    }for ${movePerformance.damage} damage${
      movePerformance.stab ? ' (STAB)' : ''
    }`;
  }
}

class PokemonPickerView extends React.Component {
  constructor(props) {
    super(props);
    /**
     * @type {Array.<Pokemon>}
     */
    let listOfPokemon = [];
    // noinspection JSUnresolvedVariable
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
      selectedPokemonIndex = props.route.params.selectedPokemonIndex;
    }
    this.state = {
      navigation: props.navigation,
      listOfPokemon: listOfPokemon,
      error: null,
      selectedPokemonIndex: selectedPokemonIndex,
    };
    if (listOfPokemon.length === 0) {
      // noinspection JSIgnoredPromiseFromCall
      this.getPokemon();
    }
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
              error: error,
            }),
        );
    }
    if (pokemonFetched.length > 0) {
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
            label={`${titleCase(s.name)} - #${i + 1}`}
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

class BattleView extends React.Component {
  constructor(props: Props) {
    super(props);
    const {selectedPokemonIndex, listOfPokemon} = props.route.params;
    if (!isNaN(selectedPokemonIndex)) {
      // Only start if this is a proper instance of the navigation route
      this.state = {
        navigation: props.navigation,
        listOfPokemon: listOfPokemon,
        selectedPokemonIndex: selectedPokemonIndex,
        currentOpponentIndex: -1,
        userHealth: findStat(listOfPokemon[selectedPokemonIndex], 'hp'),
        opponentHealth: 0,
        userLastUsedMove: '',
        opponentLastUsedMove: '',
        userMoves: {moves: [], isCopyCat: false, isLoaded: false},
        opponentMoves: {moves: [], isCopyCat: false, isLoaded: false},
        movePickerItems: [],
        selectedMoveIndex: 0,
        victories: 0,
      };

      // noinspection JSIgnoredPromiseFromCall
      this.startBattle();
    } else {
      this.state = {};
    }
  }

  getUserPokemon(): Pokemon {
    return (
      this.state.listOfPokemon &&
      this.state.listOfPokemon[this.state.selectedPokemonIndex]
    );
  }

  getOpponentPokemon(): Pokemon {
    return (
      this.state.listOfPokemon &&
      this.state.listOfPokemon[this.state.currentOpponentIndex]
    );
  }

  async getMoves(pokemon) {
    let moves = pokemon.moves;
    let moveItems = [];
    for (let i = 0; i < moves.length; i++) {
      let moveName = titleCase(moves[i].move.name);
      let movePower: Number = -1;
      let moveAccuracy: Number = 100;
      let moveType: String = null;
      await fetch(moves[i].move.url)
        .then((result) => result.json())
        .then((result) => {
          if (result.power && !isNaN(result.power)) {
            movePower = result.power;
          }
          if (result.accuracy && !isNaN(result.accuracy)) {
            moveAccuracy = result.accuracy;
          }
          if (result.type && result.type.name) {
            moveType = result.type.name;
          }
        });
      if (movePower !== -1) {
        moveItems.push({
          accuracy: moveAccuracy,
          name: moveName,
          power: movePower,
          type: moveType,
        });
      }
    }
    return moveItems;
  }

  getMovePicker(): React$Node {
    if (!this.state.opponentMoves.isLoaded) {
      return (
        <Text>
          Loading {titleCase(this.getOpponentPokemon().name)}'s Moves...
        </Text>
      );
    } else if (!this.state.userMoves.isLoaded) {
      return (
        <Text>Loading {titleCase(this.getUserPokemon().name)}'s Moves...</Text>
      );
    } else if (this.state.movePickerItems.length === 0) {
      if (this.state.userMoves.isCopyCat) {
        this.state.userMoves.moves[0] = this.state.opponentMoves.moves[
          Math.floor(Math.random() * this.state.opponentMoves.moves.length)
        ];
      }
      let movePickerItems = this.state.userMoves.moves.map((m, i) => {
        return <Picker.Item label={titleCase(m.name)} value={i} key={i} />;
      });
      this.setState({movePickerItems: movePickerItems});
    }
    return (
      <Picker
        selectedValue={this.state.selectedMoveIndex}
        onValueChange={(moveIndex) => {
          this.setState({selectedMoveIndex: moveIndex});
        }}>
        {this.state.movePickerItems}
      </Picker>
    );
  }

  async startBattle() {
    let newOpponentIndex = Math.floor(
      Math.random() * this.state.listOfPokemon.length,
    );
    this.state.currentOpponentIndex = newOpponentIndex;
    this.state.opponentHealth = findStat(
      this.state.listOfPokemon[newOpponentIndex],
      'hp',
    );

    // Used to trigger a re-render for new opponents
    this.setState({userLastUsedMove: '', opponentLastUsedMove: ''});

    let oppMoves = await this.getMoves(this.getOpponentPokemon());
    this.setState({
      opponentMoves: {
        moves: oppMoves,
        isCopyCat: oppMoves.length === 0,
        isLoaded: true,
      },
    });
    if (this.state.userMoves.isLoaded) {
      if (this.state.userMoves.isCopyCat) {
        // Allow the Picker to have a new random move to copy for the new opponent
        this.state.movePickerItems = [];
      }
    } else {
      let userMoves = await this.getMoves(this.getUserPokemon());
      this.setState({
        userMoves: {
          moves: userMoves,
          isCopyCat: userMoves.length === 0,
          isLoaded: true,
        },
      });
      this.getMovePicker();
    }
  }

  /**
   * Calculate the first mover in the current move
   * @returns {boolean} Returns true if the user moves first, else false if the opponent moves first
   */
  calculateFirstMover(): Boolean {
    let userSpeed = findStat(this.getUserPokemon(), 'speed');
    let opponentSpeed = findStat(this.getOpponentPokemon(), 'speed');

    if (userSpeed === opponentSpeed) {
      return Math.random() >= 50;
    } else {
      return userSpeed > opponentSpeed;
    }
  }

  processOpponentAttack() {
    let move;
    if (this.state.opponentMoves.isCopyCat) {
      move = this.state.userMoves.moves[
        Math.floor(this.state.userMoves.moves.length * Math.random())
      ];
    } else {
      move = this.state.opponentMoves.moves[
        Math.floor(this.state.opponentMoves.moves.length * Math.random())
      ];
    }
    const opponent = this.getOpponentPokemon();
    const movePerformance = calculateDamage(
      isNaN(opponent.level) ? 1 : opponent.level,
      move,
      findStat(opponent, 'attack'),
      findStat(this.getUserPokemon(), 'defense'),
      findStat(opponent, 'speed'),
      opponent.types,
    );
    const userNewHealth = Math.max(
      0,
      this.state.userHealth - movePerformance.damage,
    );
    this.setState({
      userHealth: userNewHealth,
      opponentLastUsedMove: formatAttackMessage(
        opponent.name,
        move.name,
        movePerformance,
      ),
    });
  }

  processUserAttack() {
    const user = this.getUserPokemon();
    const move = this.state.userMoves.moves[this.state.selectedMoveIndex];
    const movePerformance = calculateDamage(
      isNaN(user.level) ? 1 : user.level,
      move,
      findStat(user, 'attack'),
      findStat(this.getOpponentPokemon(), 'defense'),
      findStat(user, 'speed'),
      user.types,
    );
    this.state.opponentHealth = Math.max(
      0,
      this.state.opponentHealth - movePerformance.damage,
    );
    this.setState({
      userLastUsedMove: formatAttackMessage(
        user.name,
        move.name,
        movePerformance,
      ),
    });
  }

  /**
   * Process the user and opponent attacks in the order specified by {@link calculateFirstMover}
   */
  attack() {
    if (this.calculateFirstMover()) {
      this.processOpponentAttack();
      this.processUserAttack();
    } else {
      this.processUserAttack();
      this.processOpponentAttack();
    }
    if (this.state.opponentHealth === 0) {
      this.state.victories++;
    }
  }

  render(): React$Node {
    if (this.getUserPokemon()) {
      let actionButton = null;
      if (
        this.state.movePickerItems.length > 0 &&
        this.state.opponentMoves.isLoaded
      ) {
        if (this.state.userHealth === 0) {
          actionButton = (
            <Button
              color="#dc3545"
              title="Restart"
              onPress={() => this.state.navigation.goBack()}
            />
          );
        } else if (this.state.opponentHealth === 0) {
          actionButton = (
            <Button
              color="#28a745"
              title="New Opponent"
              onPress={() => this.startBattle()}
            />
          );
        } else {
          actionButton = (
            <Button title="Attack" onPress={() => this.attack()} />
          );
        }
      }

      return (
        <View>
          <Text style={styles.center}>{this.state.victories} Battle Wins</Text>
          <Image
            style={styles.opponentPokemon}
            source={{
              uri: this.getOpponentPokemon().sprites.front_default,
            }}
            resizeMode="contain"
          />
          <Text style={styles.center}>
            {titleCase(this.getOpponentPokemon().name)}
            's Health: {this.state.opponentHealth}
          </Text>
          <Image
            style={styles.userPokemon}
            source={{
              uri: this.getUserPokemon().sprites.back_default,
            }}
            resizeMode="contain"
          />
          <Text style={styles.center}>
            {titleCase(this.getUserPokemon().name)}'s Health:{' '}
            {this.state.userHealth}
          </Text>
          <Text style={styles.center}>{this.state.opponentLastUsedMove}</Text>
          <Text style={styles.center}>{this.state.userLastUsedMove}</Text>
          {this.getMovePicker()}
          {actionButton}
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
