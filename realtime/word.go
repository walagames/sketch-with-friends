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

func hintWord(word string) string {
	hintedWord := strings.Repeat("*", len(word))

	wordRunes := []rune(word)
	hintedRunes := []rune(hintedWord)
	hiddenIndices := []int{}

	// Find all hidden letter positions
	for i, r := range hintedRunes {
		if r == '*' {
			hiddenIndices = append(hiddenIndices, i)
		}
	}

	if len(hiddenIndices) <= 1 {
		return hintedWord // Keep at least one letter hidden
	}

	// Choose a random hidden position
	randomIndex := hiddenIndices[rand.Intn(len(hiddenIndices)-1)]

	// Replace the star with the actual letter
	hintedRunes[randomIndex] = wordRunes[randomIndex]

	return string(hintedRunes)
}
