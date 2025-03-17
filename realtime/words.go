package main // Loads the word bank from the CSV file.

import (
	"encoding/csv"
	"log"
	"log/slog"
	"math/rand"
	"os"
)

type WordDifficulty string

const (
	WordDifficultyEasy   WordDifficulty = "easy"
	WordDifficultyMedium WordDifficulty = "medium"
	WordDifficultyHard   WordDifficulty = "hard"
	WordDifficultyAll    WordDifficulty = "all"
	WordDifficultyCustom WordDifficulty = "custom"
)

type WordBank string

const (
	WordBankDefault WordBank = "default"
	WordBankCustom  WordBank = "custom"
	WordBankMixed   WordBank = "mixed"
)

// Word represents a word that the drawer can choose from.
type Word struct {
	Category   string         `json:"-"`
	Value      string         `json:"value"`
	Difficulty WordDifficulty `json:"difficulty"`
}

func NewWord(value string, difficulty WordDifficulty) Word {
	return Word{Value: value, Difficulty: difficulty}
}

var wordBank []Word

// This runs when the package is first imported.
// We use this to load the word bank from the CSV file once at startup.
func init() {
	loadWordBank()
}

func loadWordBank() {
	file, err := os.Open("words.csv")
	if err != nil {
		log.Fatalf("Failed to open CSV file: %v", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	// Skip header row
	if _, err := reader.Read(); err != nil {
		log.Fatalf("Failed to read CSV header: %v", err)
	}

	records, err := reader.ReadAll()
	if err != nil {
		log.Fatalf("Failed to read CSV data: %v", err)
	}

	wordBank = make([]Word, 0, len(records))
	for _, record := range records {
		if len(record) == 3 {
			wordBank = append(wordBank, Word{
				Category:   record[0],
				Value:      record[1],
				Difficulty: WordDifficulty(record[2]),
			})
		}
	}

	slog.Info("Loaded word bank", "word_count", len(wordBank))
}

// Returns unique, random words from the word bank based on the specified difficulty.
func randomWordOptions(numberOfWords int, difficulty WordDifficulty, customWords []Word) []Word {
	// handle custom words case
	if len(customWords) > 0 {
		return customWords[:min(numberOfWords, len(customWords))]
	}

	// handle all difficulties case
	if difficulty == WordDifficultyAll {
		return getOneOfEachDifficulty(customWords)
	}

	// handle specific difficulty case
	return getRandomWordsOfDifficulty(numberOfWords, difficulty)
}

// helper to get words of specific difficulty
func getRandomWordsOfDifficulty(count int, difficulty WordDifficulty) []Word {
	// filter words by difficulty
	filtered := make([]Word, 0)
	for _, word := range wordBank {
		if word.Difficulty == difficulty {
			filtered = append(filtered, word)
		}
	}

	// ensure we don't try to get more words than available
	count = min(count, len(filtered))

	// get random unique words
	result := make([]Word, 0, count)
	used := make(map[string]bool)

	for len(result) < count {
		word := filtered[rand.Intn(len(filtered))]
		if !used[word.Value] {
			used[word.Value] = true
			result = append(result, word)
		}
	}

	return result
}

// helper to get one word of each difficulty
func getOneOfEachDifficulty(customWords []Word) []Word {
	result := make([]Word, 3)

	// group words by difficulty
	byDifficulty := make(map[WordDifficulty][]Word)
	for _, w := range wordBank {
		byDifficulty[w.Difficulty] = append(byDifficulty[w.Difficulty], w)
	}

	// get one random word of each difficulty
	result[0] = byDifficulty[WordDifficultyEasy][rand.Intn(len(byDifficulty[WordDifficultyEasy]))]
	result[1] = byDifficulty[WordDifficultyMedium][rand.Intn(len(byDifficulty[WordDifficultyMedium]))]

	// 30% chance for custom word instead of hard word
	if len(customWords) > 0 && rand.Float32() < 0.3 {
		result[2] = customWords[rand.Intn(len(customWords))]
	} else {
		result[2] = byDifficulty[WordDifficultyHard][rand.Intn(len(byDifficulty[WordDifficultyHard]))]
	}

	return result
}
