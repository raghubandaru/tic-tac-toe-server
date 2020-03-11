const mongoose = require('mongoose')

const Schema = mongoose.Schema

const gameSchema = new Schema(
  {
    status: {
      type: String,
      enum: ['waiting', 'active', 'over'],
      default: 'waiting'
    },
    player1: {
      type: Schema.Types.ObjectId,
      required: true
    },
    player2: {
      type: Schema.Types.ObjectId
    },
    turn: {
      type: String,
      default: null
    },
    board: {
      type: [String],
      enum: ['X', 'O', null],
      default: Array(9).fill(null)
    },
    step: {
      type: Number,
      default: 0
    },
    result: {
      winner: Schema.Types.ObjectId,
      loser: Schema.Types.ObjectId,
      draw: {
        type: Boolean,
        default: false
      },
      winningIndexes: {
        type: Array
      }
    }
  },
  { timestamps: true }
)

const Game = mongoose.model('Game', gameSchema)

module.exports = Game
