package main

import (
	"strings"
)

func filterInvalidRunes(word string) string {
	// Convert to lowercase first
	word = strings.ToLower(word)

	var result strings.Builder
	var lastRune rune

	for i, r := range word {
		// Allow only lowercase letters (a-z), apostrophe, and space
		if (r >= 'a' && r <= 'z') || r == '\'' || r == ' ' {
			// Skip if this is a space and either:
			// - it's the first character (no leading spaces)
			// - it's right after another space (no consecutive spaces)
			// - it's the last character (no trailing spaces)
			if r == ' ' {
				if i == 0 || lastRune == ' ' || i == len(word)-1 {
					continue
				}
			}

			result.WriteRune(r)
			lastRune = r
		}
	}

	return strings.TrimSpace(result.String())
}

func filterInvalidWords(words []string) []string {
	result := make([]string, 0)

	for _, word := range words {
		cleaned := filterInvalidRunes(word)
		if cleaned != "" {
			result = append(result, cleaned)
		}
	}

	return result
}

func filterDuplicateWords(words []string) []string {
	seen := make(map[string]bool)
	result := make([]string, 0)

	for _, word := range words {
		if !seen[word] {
			seen[word] = true
			result = append(result, word)
		}
	}

	return result
}

func sanitizeGuess(guess string) string {
	return strings.TrimSpace(strings.ToLower(guess))
}
