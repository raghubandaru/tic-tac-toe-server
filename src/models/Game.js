const mongoose = require('mongoose')

const Schema = mongoose.Schema

const gameSchema = new Schema(
  {
    status: {
      type: String,
      enum: ['waiting', 'active', 'over'],
      default: 'waiting'
    },
    code: {
      type: String,
      required: true
    },
    player1: {
      type: Schema.Types.ObjectId,
      required: true
    },
    player1Connections: [
      {
        type: String
      }
    ],
    player2: {
      type: Schema.Types.ObjectId
    },
    player2Connections: [
      {
        type: String
      }
    ],
    board: {
      type: [String],
      enum: ['X', 'O', null],
      default: Array(9).fill(null)
    },
    step: {
      type: Number,
      default: 0
    },
    winner: Schema.Types.ObjectId,
    loser: Schema.Types.ObjectId,
    draw: {
      type: Boolean,
      default: false
    },
    winningIndexes: {
      type: Array
    }
  },
  { timestamps: true }
)

const Game = mongoose.model('Game', gameSchema)

module.exports = Game
