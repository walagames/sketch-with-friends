package main

import (
	"fmt"
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

// validateRoomSettings checks if room settings are within allowed bounds
func validateRoomSettings(settings *RoomSettings) error {
	if settings.PlayerLimit < MIN_PLAYERS || settings.PlayerLimit > MAX_PLAYERS {
		return fmt.Errorf("player limit must be between %d and %d", MIN_PLAYERS, MAX_PLAYERS)
	}

	if settings.DrawingTimeAllowed < MIN_DRAWING_TIME || settings.DrawingTimeAllowed > MAX_DRAWING_TIME {
		return fmt.Errorf("drawing time must be between %d and %d seconds", MIN_DRAWING_TIME, MAX_DRAWING_TIME)
	}

	if settings.TotalRounds < MIN_ROUNDS || settings.TotalRounds > MAX_ROUNDS {
		return fmt.Errorf("total rounds must be between %d and %d", MIN_ROUNDS, MAX_ROUNDS)
	}

	// Validate word difficulty
	switch settings.WordDifficulty {
	case WordDifficultyEasy, WordDifficultyMedium, WordDifficultyHard, WordDifficultyAll, WordDifficultyCustom:
		// Valid values
	default:
		return fmt.Errorf("invalid word difficulty: %s", settings.WordDifficulty)
	}

	// Validate word bank
	switch settings.WordBank {
	case WordBankDefault, WordBankCustom, WordBankMixed:
		// Valid values
	default:
		return fmt.Errorf("invalid word bank: %s", settings.WordBank)
	}

	// Validate game mode
	switch settings.GameMode {
	case GameModeClassic, GameModeNoHints:
		// Valid values
	default:
		return fmt.Errorf("invalid game mode: %s", settings.GameMode)
	}

	return nil
}

// Helper function to return first non-empty string
func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}

// validatePlayerProfile validates and sanitizes player profile data
func validatePlayerProfile(profile *playerProfile) (*playerProfile, error) {
	if profile == nil {
		return &playerProfile{
			Username:     randomUsername(),
			AvatarConfig: DefaultAvatarConfig,
		}, nil
	}

	// Create a new profile to avoid modifying the input
	validated := &playerProfile{
		Username:     sanitizeUsername(profile.Username),
		AvatarConfig: &AvatarConfig{},
	}

	// Validate username
	if validated.Username == "" || len(validated.Username) > MAX_NAME_LENGTH {
		validated.Username = randomUsername()
	}

	// Handle nil AvatarConfig
	if profile.AvatarConfig == nil {
		validated.AvatarConfig = DefaultAvatarConfig
		return validated, nil
	}

	// Validate each avatar field
	validated.AvatarConfig = &AvatarConfig{
		HairStyle:       firstNonEmpty(profile.AvatarConfig.HairStyle, DefaultAvatarConfig.HairStyle),
		HairColor:       firstNonEmpty(profile.AvatarConfig.HairColor, DefaultAvatarConfig.HairColor),
		Mood:            firstNonEmpty(profile.AvatarConfig.Mood, DefaultAvatarConfig.Mood),
		SkinColor:       firstNonEmpty(profile.AvatarConfig.SkinColor, DefaultAvatarConfig.SkinColor),
		BackgroundColor: firstNonEmpty(profile.AvatarConfig.BackgroundColor, DefaultAvatarConfig.BackgroundColor),
	}

	return validated, nil
}
