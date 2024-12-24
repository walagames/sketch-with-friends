package main

import "math"

const (
	BASE_POINTS_PER_PLAYER = 100.0
	DECAY_RATE             = 1.25
)

// CalculateScore calculates the points for both guesser and drawer using exponential decay
//
// Parameters:
// - maxGuessers: total number of players who can guess (excluding drawer)
// - correctGuesses: number of players who have already guessed correctly
// - timeRemaining: percentage of time remaining (1.0 = full time, 0.0 = no time)
// Returns:
// - guesserScore: points awarded to the current guesser
// - drawerScore: points awarded to the drawer for this guess
func CalculateScore(maxGuessers, correctGuesses int, timeRemaining float64, wordDifficulty WordDifficulty) (guesserScore, drawerScore int) {
	// Validate inputs
	if timeRemaining < 0 {
		timeRemaining = 0
	}
	if timeRemaining > 1 {
		timeRemaining = 1
	}
	if correctGuesses >= maxGuessers {
		return 0, 0
	}

	wordDifficultyMultiplier := 1.0
	drawerShareMultiplier := 0.25
	// adjust multipliers based on word difficulty
	switch wordDifficulty {
	case WordDifficultyEasy:
		wordDifficultyMultiplier = 1.0
		drawerShareMultiplier = 0.25
	case WordDifficultyMedium:
		wordDifficultyMultiplier = 1.5
		drawerShareMultiplier = 0.50
	case WordDifficultyHard:
		wordDifficultyMultiplier = 2.0
		drawerShareMultiplier = 0.75
	}

	basePoints := int(BASE_POINTS_PER_PLAYER * float64(maxGuessers) * wordDifficultyMultiplier)

	// Calculate time decay (e^(-2x) where x is the time elapsed)
	// Using -2 as decay rate - can be adjusted for faster/slower decay
	timeElapsed := 1.0 - timeRemaining
	timeMultiplier := math.Exp(-DECAY_RATE * timeElapsed)

	// Calculate position multiplier (earlier guessers get larger share)
	positionMultiplier := float64(maxGuessers-correctGuesses) / float64(maxGuessers)

	// Calculate guesser points with decay
	guesserPoints := float64(basePoints) * timeMultiplier * positionMultiplier

	// Calculate drawer points - their share also decays with time
	drawerSharePercent := drawerShareMultiplier * timeMultiplier // decays with time
	drawerPoints := guesserPoints * drawerSharePercent

	return int(guesserPoints), int(drawerPoints)
}
