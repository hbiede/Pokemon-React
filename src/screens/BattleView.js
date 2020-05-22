/**
 * Generates the view for the battle interaction screen
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {
  calculateDamage,
  capitalCase,
  findStat,
  formatAttackMessage,
} from '../utils';
import {Button, Image, StyleSheet, Text, View} from 'react-native';
import {Picker} from '@react-native-community/picker';

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

export class BattleView extends React.Component {
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
    } else {
      this.state = {};
    }
  }

  /**
   * Start a battle once the UI is ready
   */
  componentDidMount() {
    this.startBattle();
  }

  /**
   * Halt game loop on unmount
   */
  componentWillUnmount() {
    this.setState({unmounting: true});
  }

  /**
   * Setups the data needed to start a new battle (be it the first, or a followup to a previous battle)
   */
  startBattle() {
    if (this.state.unmatched) {
      return;
    }

    // Used to trigger a re-render for new opponents
    if (this.state.userLastUsedMove.length !== 0) {
      this.setState({userLastUsedMove: '', opponentLastUsedMove: ''});
    }

    // Setup the opponent
    let newOpponentIndex = Math.floor(
      Math.random() * this.state.listOfPokemon.length,
    );
    this.setState({
      currentOpponentIndex: newOpponentIndex,
      opponentHealth: findStat(
        this.state.listOfPokemon[newOpponentIndex],
        'hp',
      ),
    }); // Must be a separate state to allow the Pokemon images to load prior to the moves loading
    this.getMoves(this.state.listOfPokemon[newOpponentIndex]).then((result) =>
      this.setState({
        opponentMoves: {
          moves: result,
          isCopyCat: result.length === 0,
          isLoaded: true,
        },
      }),
    );

    let stateUpdate = {};
    if (!this.state.userMoves.isLoaded) {
      this.getMoves(this.getUserPokemon())
        .then(
          (result) =>
            (stateUpdate.userMoves = {
              moves: result,
              isCopyCat: result.length === 0,
              isLoaded: true,
            }),
        )
        .then(() => {
          this.setState(stateUpdate);
        });
    }
  }

  /**
   * Get the Pokemon associated with the user
   * @return {Pokemon} the Pokemon associated with the user
   */
  getUserPokemon(): Pokemon {
    if (
      this.state.listOfPokemon &&
      this.state.listOfPokemon[this.state.selectedPokemonIndex]
    ) {
      return this.state.listOfPokemon[this.state.selectedPokemonIndex];
    } else {
      return null;
    }
  }

  /**
   * Get the Pokemon associated with the opponent
   * @return {Pokemon} the Pokemon associated with the opponent
   */
  getOpponentPokemon(): Pokemon {
    if (
      this.state.listOfPokemon &&
      this.state.listOfPokemon[this.state.currentOpponentIndex]
    ) {
      return this.state.listOfPokemon[this.state.currentOpponentIndex];
    } else {
      return null;
    }
  }

  /**
   * Get all move details associated with a given Pokemon
   * @param {Pokemon} pokemon The pokemon for which the moves are being sought after
   * @return {Promise<[].<MoveRecord>>} The list of MoveRecords found with valid associations
   */
  async getMoves(pokemon: Pokemon) {
    let moves = pokemon.moves;
    let moveItems = [];
    for (let i = 0; i < moves.length; i++) {
      let moveName = capitalCase(moves[i].move.name);
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

  /**
   * Creates the Move {@link Picker} items for the user to be able to select a move to use in battle
   * @param userMoves {{moves: Array.<MoveRecord>, isCopyCat: Boolean}} The moves to be used in generating the list
   * @return {Array<Picker.Item>} The resulting {@link Picker} items
   */
  generateMovePickerItems(userMoves: {
    moves: Array<MoveRecord>,
    isCopyCat: Boolean,
  }): Array<Picker.Item> {
    // Generate the user's picker entries
    let currUserMoves = userMoves;
    if (userMoves.isCopyCat) {
      // Account for Pokemon who use their opponent's moves (ie Ditto)
      currUserMoves.moves = [
        this.state.opponentMoves.moves[
          Math.floor(Math.random() * this.state.opponentMoves.moves.length)
        ],
      ];
    }

    // Map moves onto a list of Picker Item entries
    return currUserMoves.moves.map((m, i) => {
      return <Picker.Item label={capitalCase(m.name)} value={i} key={i} />;
    });
  }

  /**
   * Convert the user's moves into a picker to allow for UI selection
   * @return {React$Node} A {@link Picker} if the moves have been loaded for both sides, else a {@link Text} describing what is causing the delay
   */
  getMovePicker(): React$Node {
    if (!this.state.opponentMoves.isLoaded) {
      // Waiting on the opponent's move list to be loaded
      if (this.getOpponentPokemon()) {
        return (
          <Text>
            Loading {capitalCase(this.getOpponentPokemon().name)}'s Moves...
          </Text>
        );
      } else {
        return <Text>Selecting Opponent</Text>;
      }
    } else if (!this.state.userMoves.isLoaded) {
      // Waiting on the user's move list to be loaded
      return (
        <Text>
          Loading {capitalCase(this.getUserPokemon().name)}'s Moves...
        </Text>
      );
    }
    return (
      <Picker
        selectedValue={this.state.selectedMoveIndex}
        onValueChange={(moveIndex) => {
          this.setState({selectedMoveIndex: moveIndex});
        }}>
        {this.generateMovePickerItems(this.state.userMoves)}
      </Picker>
    );
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

  /**
   * Chooses a move for the opponent to use and then performs the attack and updates the game state accordingly
   * @return {Boolean} True if the opponent was knocked
   */
  processOpponentAttack(): Boolean {
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
      move,
      opponent,
      this.getUserPokemon(),
    );
    const targetHealth = Math.max(
      0,
      this.state.userHealth - movePerformance.damage,
    );
    this.setState({
      userHealth: targetHealth,
      opponentLastUsedMove: formatAttackMessage(
        opponent.name,
        move.name,
        movePerformance,
      ),
    });
    return targetHealth === 0;
  }

  /**
   * Performs the user chosen move and updates the game state accordingly
   * @return {Boolean} True if the opponent was knocked
   */
  processUserAttack(): Boolean {
    const user = this.getUserPokemon();
    const move = this.state.userMoves.moves[this.state.selectedMoveIndex];
    const movePerformance = calculateDamage(
      move,
      user,
      this.getOpponentPokemon(),
    );
    const newOppHealth = Math.max(
      0,
      this.state.opponentHealth - movePerformance.damage,
    );
    this.setState({
      opponentHealth: newOppHealth,
      userLastUsedMove: formatAttackMessage(
        user.name,
        move.name,
        movePerformance,
      ),
    });
    return newOppHealth === 0;
  }

  /**
   * Process the user and opponent attacks in the order specified by {@link calculateFirstMover}
   */
  attack() {
    let opponentDefeated;
    if (this.calculateFirstMover()) {
      this.processOpponentAttack();
      opponentDefeated = this.processUserAttack();
    } else {
      opponentDefeated = this.processUserAttack();
      this.processOpponentAttack();
    }
    if (opponentDefeated) {
      this.setState({victories: this.state.victories + 1});
    }
  }

  render(): React$Node {
    if (this.getUserPokemon()) {
      let opponentDisplay = <Text>Selecting opponent...</Text>;
      if (this.getOpponentPokemon()) {
        opponentDisplay = (
          <View>
            <Image
              style={styles.opponentPokemon}
              source={{
                uri: this.getOpponentPokemon().sprites.front_default,
              }}
              resizeMode="contain"
            />
            <Text style={styles.center}>
              {capitalCase(this.getOpponentPokemon().name)}
              's Health: {this.state.opponentHealth}
            </Text>
          </View>
        );
      }

      let actionButton = null;
      if (this.state.userMoves.isLoaded && this.state.opponentMoves.isLoaded) {
        if (this.state.userHealth === 0) {
          // User Pokemon was knocked out, allow game restart (kicks the user back to the Pokemon picker page)
          actionButton = (
            <Button
              color="#dc3545"
              title={`Your ${
                this.getUserPokemon().name
              } was knocked out. Restart?`}
              onPress={() =>
                this.state.navigation.navigate('Pick your Pokemon', {
                  selectedPokemonIndex: this.state.selectedPokemonIndex,
                  pokemon: this.state.listOfPokemon,
                })
              }
            />
          );
        } else if (this.state.opponentHealth === 0) {
          // Opponent was knocked out. Allow the user to start a new battle
          actionButton = (
            <Button
              color="#28a745"
              title={`You defeated ${
                this.getOpponentPokemon().name
              }. Battle again?`}
              onPress={() => this.startBattle()}
            />
          );
        } else {
          // Battle continues
          actionButton = (
            <Button
              title={`Use ${
                this.state.userMoves.moves[this.state.selectedMoveIndex].name
              }`}
              onPress={() => this.attack()}
            />
          );
        }
      }

      return (
        <View>
          <Text style={styles.center}>{this.state.victories} Battle Wins</Text>
          {opponentDisplay}
          <Image
            style={styles.userPokemon}
            source={{
              uri: this.getUserPokemon().sprites.back_default,
            }}
            resizeMode="contain"
          />
          <Text style={styles.center}>
            {capitalCase(this.getUserPokemon().name)}'s Health:{' '}
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
