package main

import (
	"strings"
)

const (
	// Maximum length of a word
	MAX_WORD_LENGTH  = 24
	MAX_GUESS_LENGTH = 128
)

func sanitizeUsername(username string) string {
	var result strings.Builder
	var lastRune rune
	var lastWasSpace bool

	for i, r := range username {
		// Allow uppercase letters (A-Z), lowercase letters (a-z), apostrophe, and space
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') ||
			r == '\'' || r == ' ' {
			// Handle spaces: only allow single spaces, not at start/end
			if r == ' ' {
				if lastWasSpace || i == 0 || i == len(username)-1 {
					continue
				}
				lastWasSpace = true
			} else {
				lastWasSpace = false
			}

			// Handle apostrophes
			if r == '\'' {
				if lastRune == '\'' || i == 0 || i == len(username)-1 {
					continue
				}
			}

			result.WriteRune(r)
			lastRune = r
		}
	}

	// Add length validation
	sanitized := result.String()
	if len(sanitized) < MIN_NAME_LENGTH || len(sanitized) > MAX_NAME_LENGTH {
		return ""
	}
	return sanitized
}

func filterInvalidRunes(word string) string {
	// Convert to lowercase first
	word = strings.ToLower(word)

	var result strings.Builder
	var lastRune rune

	for i, r := range word {
		// Allow lowercase letters (a-z), apostrophe, space, and dash
		if (r >= 'a' && r <= 'z') || r == '\'' || r == ' ' || r == '-' {
			// Skip if this is a space and either:
			// - it's the first character (no leading spaces)
			// - it's right after another space (no consecutive spaces)
			// - it's the last character (no trailing spaces)
			if r == ' ' {
				if i == 0 || lastRune == ' ' || i == len(word)-1 {
					continue
				}
			}

			// Skip dash if:
			// - it's the first or last character
			// - it's next to another dash
			// - it's next to a space
			// - it's next to an apostrophe
			if r == '-' {
				if i == 0 || i == len(word)-1 ||
					lastRune == '-' || lastRune == ' ' || lastRune == '\'' {
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
		if len(cleaned) > MAX_WORD_LENGTH {
			continue
		}
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
	trimed := strings.TrimSpace(guess)
	if len(trimed) == 0 || len(trimed) > MAX_GUESS_LENGTH {
		return ""
	}

	return trimed
}
