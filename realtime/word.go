package main

import (
	"math/rand"
	"strings"
)

var wordBank = []string{
	"cat",
	"dog",
	"house",
	"tree",
	"book",
	"chair",
	"sun",
	"moon",
	"flower",
	"computer",
}

func wordOptions(n int) []string {
	// Create a set to ensure uniqueness
	wordSet := make(map[string]struct{})

	// Keep adding words until we have the required number
	for len(wordSet) < n {
		word := wordBank[rand.Intn(len(wordBank))]
		wordSet[word] = struct{}{}
	}

	// Convert set to slice
	words := make([]string, 0, n)
	for word := range wordSet {
		words = append(words, word)
	}

	return words
}

func applyHint(prevWord string, fullWord string) string {
	if prevWord == fullWord {
		// First iteration: create initial hinted word
		prevWord = strings.Repeat("*", len(fullWord))
	}

	prevRunes := []rune(prevWord)
	fullRunes := []rune(fullWord)
	hiddenIndices := []int{}

	// Find all hidden letter positions
	for i, r := range prevRunes {
		if r == '*' {
			hiddenIndices = append(hiddenIndices, i)
		}
	}

	if len(hiddenIndices) == 0 {
		return prevWord // All letters are already revealed
	}

	// Choose a random hidden position
	randomIndex := hiddenIndices[rand.Intn(len(hiddenIndices))]

	// Replace the star with the actual letter
	prevRunes[randomIndex] = fullRunes[randomIndex]

	return string(prevRunes)
}
