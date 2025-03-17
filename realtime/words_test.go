package main

import (
	"testing"
)

func TestRandomWordOptions(t *testing.T) {
	// setup test word bank
	wordBank = []Word{
		{Value: "easy1", Difficulty: WordDifficultyEasy},
		{Value: "easy2", Difficulty: WordDifficultyEasy},
		{Value: "medium1", Difficulty: WordDifficultyMedium},
		{Value: "medium2", Difficulty: WordDifficultyMedium},
		{Value: "hard1", Difficulty: WordDifficultyHard},
		{Value: "hard2", Difficulty: WordDifficultyHard},
	}

	tests := []struct {
		name         string
		numWords     int
		difficulty   WordDifficulty
		customWords  []Word
		validateFunc func(t *testing.T, result []Word)
	}{
		{
			name:        "custom words only",
			numWords:    2,
			difficulty:  WordDifficultyEasy,
			customWords: []Word{{Value: "custom1"}, {Value: "custom2"}},
			validateFunc: func(t *testing.T, result []Word) {
				if len(result) != 2 {
					t.Errorf("expected 2 words, got %d", len(result))
				}
				for _, w := range result {
					if w.Value != "custom1" && w.Value != "custom2" {
						t.Errorf("unexpected word: %s", w.Value)
					}
				}
			},
		},
		{
			name:       "easy difficulty",
			numWords:   2,
			difficulty: WordDifficultyEasy,
			validateFunc: func(t *testing.T, result []Word) {
				if len(result) != 2 {
					t.Errorf("expected 2 words, got %d", len(result))
				}
				for _, w := range result {
					if w.Difficulty != WordDifficultyEasy {
						t.Errorf("expected easy difficulty, got %s", w.Difficulty)
					}
				}
			},
		},
		{
			name:       "all difficulties",
			numWords:   3,
			difficulty: WordDifficultyAll,
			validateFunc: func(t *testing.T, result []Word) {
				if len(result) != 3 {
					t.Errorf("expected 3 words, got %d", len(result))
				}
				// should have one of each difficulty
				difficulties := make(map[WordDifficulty]bool)
				for _, w := range result {
					difficulties[w.Difficulty] = true
				}
				if len(difficulties) != 3 {
					t.Errorf("expected one word of each difficulty, got %v", difficulties)
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := randomWordOptions(tt.numWords, tt.difficulty, tt.customWords)
			tt.validateFunc(t, result)
		})
	}
}
