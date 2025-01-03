package main

import (
	"math"
	"slices"
	"strings"

	"github.com/google/uuid"
)

const (
	// Base points for a correct guess
	BASE_POINTS       = 300
	POINTS_PER_PLAYER = 25

	// Share of points for the drawer based on word difficulty
	HARD_WORD_SHARE   = 0.6
	MEDIUM_WORD_SHARE = 0.35
	EASY_WORD_SHARE   = 0.15

	// Base points for a streak bonus (per streak)
	BASE_STREAK_BONUS = 10.0

	// Maximum streak bonus
	MAX_STREAK = 10
)

// GuessPoints calculates the points for both guesser and drawer using exponential decay
//
// Parameters:
// - maxGuessers: total number of players who can guess (excluding drawer)
// - correctGuesses: number of players who have already guessed correctly
// - wordDifficulty: the difficulty of the word being guessed
//
// Returns:
// - guesserScore: points awarded to the current guesser
// - drawerScore: points awarded to the drawer for this guess
func GuessPoints(maxGuessers, correctGuesses int, wordDifficulty WordDifficulty) (guesserScore, drawerScore int) {
	drawerSharePercent := EASY_WORD_SHARE

	// Adjust the drawer's share based on the word difficulty
	switch wordDifficulty {
	case WordDifficultyEasy:
		drawerSharePercent = EASY_WORD_SHARE
	case WordDifficultyMedium, WordDifficultyCustom:
		drawerSharePercent = MEDIUM_WORD_SHARE
	case WordDifficultyHard:
		drawerSharePercent = HARD_WORD_SHARE
	}

	maxPoints := BASE_POINTS + POINTS_PER_PLAYER*maxGuessers

	// Calculate position multiplier (earlier guessers get larger share)
	positionMultiplier := float32(maxGuessers-correctGuesses) / float32(maxGuessers)
	guesserPoints := float32(maxPoints) * positionMultiplier

	// Calculate the drawer's share of the points
	drawerPoints := guesserPoints * float32(drawerSharePercent)

	return int(guesserPoints), int(drawerPoints)
}

// StreakBonus calculates the points for a streak bonus with exponential decay for top players
//
// Parameters:
// - position: the position of the player in the game (1-based ranking)
// - totalPlayers: the total number of players in the game
// - streak: the number of consecutive correct guesses
//
// Returns:
// - streakBonus: the points for the streak bonus
func StreakBonus(position int, totalPlayers int, streak int) int {
	// Convert position to 0-based for calculation
	zeroBasedPos := position - 1

	// Calculate exponential multiplier (e^(-3x/n)) where x is position and n is total players
	exponent := -2.0 * float32(zeroBasedPos) / float32(totalPlayers)
	multiplier := 1.0 - float32(1.0-math.Exp(float64(exponent)))

	// Invert the multiplier so last place gets highest bonus
	multiplier = 1.0 - multiplier

	// Adjust range to be between 0.25 and 1.0 instead of 0 to 1.0
	multiplier = 0.25 + (multiplier * 0.75)

	return int(BASE_STREAK_BONUS * float32(totalPlayers) * float32(min(streak, MAX_STREAK)) * multiplier)
}

// Returns a sorted slice of player IDs by score (highest to lowest).
// This is useful for determining player rankings.
func getSortedPlayersByScore(players map[uuid.UUID]*player) []uuid.UUID {
	// Create a slice of player IDs
	playerIDs := make([]uuid.UUID, 0, len(players))
	for id := range players {
		playerIDs = append(playerIDs, id)
	}

	// Sort the IDs based on player scores
	slices.SortFunc(playerIDs, func(a, b uuid.UUID) int {
		// Sort by score (descending)
		scoreA := players[a].Score
		scoreB := players[b].Score
		if scoreA != scoreB {
			return int(scoreB - scoreA)
		}
		// If scores are equal, sort by name (ascending) to ensure stable ordering
		return strings.Compare(players[a].Profile.Username, players[b].Profile.Username)
	})

	return playerIDs
}

// Returns a map of player IDs to their position (1-based ranking)
func getPlayerPositions(players map[uuid.UUID]*player) map[uuid.UUID]int {
	// Create position map
	positions := make(map[uuid.UUID]int, len(players))

	// Get sorted players first
	playerIDs := getSortedPlayersByScore(players)

	// Assign positions (1-based)
	for i, id := range playerIDs {
		positions[id] = i + 1
	}

	return positions
}

// CheckLeadChange determines if there was a change in who's leading the game
// based on the points awarded in the current round.
//
// Parameters:
// - roundPoints: map of player IDs to points awarded in this round
// - players: map of player IDs to player objects (contains current total scores)
//
// Returns:
// - string: a message describing the lead change, or empty string if no change
func CheckLeadChange(roundPoints map[uuid.UUID]int, players map[uuid.UUID]*player) string {
	// Find previous leader (by subtracting round points from current scores)
	var oldLeader uuid.UUID
	highestOldScore := -1
	for id, player := range players {
		oldScore := player.Score - roundPoints[id]
		if oldScore > highestOldScore {
			highestOldScore = oldScore
			oldLeader = id
		}
	}

	// Find current leader
	var newLeader uuid.UUID
	highestNewScore := -1
	for id, player := range players {
		if player.Score > highestNewScore {
			highestNewScore = player.Score
			newLeader = id
		}
	}

	// If the leader changed, return appropriate message
	if oldLeader != newLeader {
		oldLeaderName := players[oldLeader].Profile.Username
		newLeaderName := players[newLeader].Profile.Username
		return newLeaderName + " took the lead from " + oldLeaderName
	}

	return ""
}
