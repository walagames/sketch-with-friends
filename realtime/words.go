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
// ! this is garbage and we need to revist it
func randomWordOptions(numberOfWords int, difficulty WordDifficulty, customWords []Word) []Word {
	// If the word bank is custom only, we use the custom words if there are any
	if len(customWords) > 0 {
		return customWords[:min(numberOfWords, len(customWords))]
	}

	// For non-all difficulty, use the original filtering logic
	if difficulty != WordDifficultyAll {
		filteredWords := wordBank
		if len(customWords) > 0 {
			const customWordWeight = 3
			weightedCustomWords := make([]Word, 0, len(customWords)*customWordWeight)
			for i := 0; i < customWordWeight; i++ {
				weightedCustomWords = append(weightedCustomWords, customWords...)
			}
			filteredWords = append(filteredWords, weightedCustomWords...)
		}

		wordsByDifficulty := make([]Word, 0)
		for _, word := range filteredWords {
			if word.Difficulty == difficulty || word.Difficulty == WordDifficultyCustom {
				wordsByDifficulty = append(wordsByDifficulty, word)
			}
		}

		// Create a set to ensure uniqueness
		wordSet := make(map[Word]struct{})
		for len(wordSet) < numberOfWords && len(wordSet) < len(wordsByDifficulty) {
			word := wordsByDifficulty[rand.Intn(len(wordsByDifficulty))]
			wordSet[word] = struct{}{}
		}

		words := make([]Word, 0, len(wordSet))
		for word := range wordSet {
			words = append(words, word)
		}
		return words
	}

	// For random difficulty, get one word of each difficulty
	var easyWords, mediumWords, hardWords []Word
	for _, word := range wordBank {
		switch word.Difficulty {
		case WordDifficultyEasy:
			easyWords = append(easyWords, word)
		case WordDifficultyMedium:
			mediumWords = append(mediumWords, word)
		case WordDifficultyHard:
			hardWords = append(hardWords, word)
		}
	}

	result := make([]Word, 3)
	result[0] = easyWords[rand.Intn(len(easyWords))]
	result[1] = mediumWords[rand.Intn(len(mediumWords))]

	// 30% chance to use a custom word instead of a hard word if available and using mixed word bank
	if difficulty == WordDifficultyAll && len(customWords) > 0 && rand.Float32() < 0.3 {
		result[2] = customWords[rand.Intn(len(customWords))]
	} else {
		result[2] = hardWords[rand.Intn(len(hardWords))]
	}

	return result
}
