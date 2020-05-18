/**
 * Pokemon Battle app built in React Native
 *
 * @format
 * @flow strict-local
 */

// TODO: Count number of victories and display when defeated
// TODO: Deal with Ditto's lack of moves
import React from 'react';
import {Button, Image, StyleSheet, Text, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {Picker} from '@react-native-community/picker';

/**
 * @typedef {Object} PokemonAttackMove
 * @property {String} name
 * @property {Array.<PokemonAttackMove>} url
 */

/**
 * @typedef {Object} Stat
 * @property {String} name
 * @property {Number} power
 * @property {Number} accuracy
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
 * @typedef {Object} Pokemon
 * @property {String} name
 * @property {Array.<PokemonAttackMove>} moves
 * @property {Array.<StatCollection>} stats
 * @property {PokemonCharacterSprite} sprites
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
 * @param accuracy {Number} The accuracy of the move
 * @param power {Number} The power of the move
 * @param attack {Number} The attack value of the Pokemon
 * @param opponentDefense {Number} The defense value of the opponent Pokemon
 * @param speed {Number} The speed of the Pokemon
 * @returns {{damage: number, criticalHit: boolean, missed: boolean}} The damage done, and booleans representing if the move was a critical hit or a miss (the booleans are exclusive)
 */
function calculateDamage(
  level: Number,
  accuracy: Number,
  power: Number,
  attack: Number,
  opponentDefense: Number,
  speed: Number,
) {
  /**
   * Calculates if the hit was landed critically
   * @param pokemonSpeed The speed of the pokemon in question
   * @returns {boolean} True iff the critical hit was landed, else false
   */
  function didCriticallyHit(pokemonSpeed: Number) {
    let critRate = Math.min(Math.floor(pokemonSpeed / 2), 255);
    return Math.floor(Math.random() * 255) < critRate;
  }

  let returnValue = {
    damage: 0,
    missed: accuracy <= Math.floor(Math.random() * 100),
    criticalHit: didCriticallyHit(speed),
  };
  if (!returnValue.missed) {
    // Use the convoluted equation for attack damage Pokemon uses
    returnValue.damage =
      Math.floor(
        Math.floor(
          (Math.floor((2 * level) / 5 + 2) * attack * power) / opponentDefense,
        ) / 50,
      ) + 2;

    if (returnValue.criticalHit) {
      returnValue.damage *= 1.5;
    }
  }
  return returnValue;
}

/**
 * Create a message describing the move performed
 * @param name {String} The name of the Pokemon
 * @param moveName {String} The name of the move performed
 * @param movePerformance {{damage: number, criticalHit: boolean, missed: boolean}} The information pertaining to the move's performance (as defined by {@link calculateDamage})
 * @returns {undefined}
 */
function formatAttackMessage(name, moveName, movePerformance) {
  let titledName = titleCase(name);
  if (movePerformance.missed) {
    return `${titledName} missed`;
  } else {
    return `${titledName} used ${moveName} and hit ${
      movePerformance.criticalHit ? 'critically ' : ''
    }for ${movePerformance.damage} damage`;
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
        return <Picker.Item label={titleCase(s.name)} value={i} key={i} />;
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
        userMoves: [],
        opponentMoves: [],
        movePickerItems: [],
        selectedMoveIndex: 0,
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
      await fetch(moves[i].move.url)
        .then((result) => result.json())
        .then((result) => {
          if (result.power && !isNaN(result.power)) {
            movePower = result.power;
          }
          if (result.accuracy && !isNaN(result.accuracy)) {
            moveAccuracy = result.accuracy;
          }
        });
      if (movePower !== -1) {
        moveItems.push({
          accuracy: moveAccuracy,
          name: moveName,
          power: movePower,
        });
      }
    }
    return moveItems;
  }

  getMovePicker(): React$Node {
    if (this.state.opponentMoves.length === 0) {
      return (
        <Text>
          Loading {titleCase(this.getOpponentPokemon().name)}'s Moves...
        </Text>
      );
    } else if (this.state.userMoves.length === 0) {
      return (
        <Text>Loading {titleCase(this.getUserPokemon().name)}'s Moves...</Text>
      );
    } else if (this.state.movePickerItems.length === 0) {
      let movePickerItems = this.state.userMoves.map((m, i) => {
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

    this.setState({
      opponentMoves: await this.getMoves(this.getOpponentPokemon()),
    });
    if (this.state.userMoves.length === 0) {
      this.setState({
        userMoves: await this.getMoves(this.getUserPokemon()),
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
    const move = this.state.opponentMoves[
      Math.floor(this.state.opponentMoves.length * Math.random())
    ];
    const opponent = this.getOpponentPokemon();
    const movePerformance = calculateDamage(
      isNaN(opponent.level) ? 1 : opponent.level,
      move.accuracy,
      move.power,
      findStat(opponent, 'attack'),
      findStat(this.getUserPokemon(), 'defense'),
      findStat(opponent, 'speed'),
    );
    const userNewHealth = Math.max(
      0,
      this.state.userHealth - movePerformance.damage,
    );
    this.setState({userHealth: userNewHealth});
    this.setState({
      opponentLastUsedMove: formatAttackMessage(
        opponent.name,
        move.name,
        movePerformance,
      ),
    });
  }

  processUserAttack() {
    const user = this.getUserPokemon();
    const move = this.state.userMoves[this.state.selectedMoveIndex];
    const movePerformance = calculateDamage(
      isNaN(user.level) ? 1 : user.level,
      move.accuracy,
      move.power,
      findStat(user, 'attack'),
      findStat(this.getOpponentPokemon(), 'defense'),
      findStat(user, 'speed'),
    );
    const opponentNewHealth = Math.max(
      0,
      this.state.opponentHealth - movePerformance.damage,
    );
    this.setState({opponentHealth: opponentNewHealth});
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
  }

  render(): React$Node {
    if (this.getUserPokemon()) {
      let opponentMoveReport = null;
      if (this.state.opponentLastUsedMove.length !== 0) {
        opponentMoveReport = (
          <Text style={styles.center}>{this.state.opponentLastUsedMove}</Text>
        );
      }

      let userMoveReport = null;
      if (this.state.userLastUsedMove.length !== 0) {
        userMoveReport = (
          <Text style={styles.center}>{this.state.userLastUsedMove}</Text>
        );
      }

      let actionButton = null;
      if (
        this.state.movePickerItems.length > 0 &&
        this.state.opponentMoves.length
      ) {
        if (this.state.userHealth === 0) {
          actionButton = (
            <Button
              title="Restart"
              onPress={() => this.state.navigation.goBack()}
            />
          );
        } else if (this.state.opponentHealth === 0) {
          actionButton = (
            <Button title="New Opponent" onPress={() => this.startBattle()} />
          );
        } else {
          actionButton = (
            <Button title="Attack" onPress={() => this.attack()} />
          );
        }
      }

      return (
        <View>
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
          {opponentMoveReport}
          {userMoveReport}
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
