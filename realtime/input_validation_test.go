package main

import (
	"reflect"
	"testing"
)

func TestFilterInvalidRunes(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "basic lowercase word",
			input:    "hello",
			expected: "hello",
		},
		{
			name:     "uppercase word",
			input:    "HELLO",
			expected: "hello",
		},
		{
			name:     "mixed case word",
			input:    "HeLLo",
			expected: "hello",
		},
		{
			name:     "word with apostrophe",
			input:    "don't",
			expected: "don't",
		},
		{
			name:     "word with invalid characters",
			input:    "hello123!@#",
			expected: "hello",
		},
		{
			name:     "multiple spaces",
			input:    "hello   world",
			expected: "hello world",
		},
		{
			name:     "leading spaces",
			input:    "   hello",
			expected: "hello",
		},
		{
			name:     "trailing spaces",
			input:    "hello   ",
			expected: "hello",
		},
		{
			name:     "emojis and special characters",
			input:    "hello 👋 world!",
			expected: "hello world",
		},
		{
			name:     "empty string",
			input:    "",
			expected: "",
		},
		{
			name:     "only invalid characters",
			input:    "123!@#",
			expected: "",
		},
		{
			name:     "phrase with apostrophes",
			input:    "i can't don't won't",
			expected: "i can't don't won't",
		},
		{
			name:     "non-English characters",
			input:    "héllö wørld",
			expected: "hll wrld",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := filterInvalidRunes(tt.input)
			if result != tt.expected {
				t.Errorf("filterInvalidRunes(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

func TestFilterInvalidWords(t *testing.T) {
	tests := []struct {
		name     string
		input    []string
		expected []string
	}{
		{
			name:     "empty slice",
			input:    []string{},
			expected: []string{},
		},
		{
			name:     "basic valid words",
			input:    []string{"hello", "world"},
			expected: []string{"hello", "world"},
		},
		{
			name:     "mixed case words",
			input:    []string{"Hello", "WORLD", "MiXeD"},
			expected: []string{"hello", "world", "mixed"},
		},
		{
			name:     "words with spaces",
			input:    []string{"hello world", "  spaces  ", " leading", "trailing "},
			expected: []string{"hello world", "spaces", "leading", "trailing"},
		},
		{
			name:     "words with invalid characters",
			input:    []string{"hello!", "world@123", "#special"},
			expected: []string{"hello", "world", "special"},
		},
		{
			name:     "words with apostrophes",
			input:    []string{"don't", "it's", "mary's"},
			expected: []string{"don't", "it's", "mary's"},
		},
		{
			name:     "empty strings and whitespace",
			input:    []string{"", " ", "  ", "\t", "\n"},
			expected: []string{},
		},
		{
			name:     "mixed valid and invalid strings",
			input:    []string{"hello!", "", "  world  ", "test@123", "don't"},
			expected: []string{"hello", "world", "test", "don't"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := filterInvalidWords(tt.input)
			if !reflect.DeepEqual(got, tt.expected) {
				t.Errorf("filterInvalidWords() = %v, want %v", got, tt.expected)
			}
		})
	}
}

func TestSanitizeGuess(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "lowercase remains unchanged",
			input:    "hello",
			expected: "hello",
		},
		{
			name:     "uppercase converted to lowercase",
			input:    "WORLD",
			expected: "world",
		},
		{
			name:     "mixed case converted to lowercase",
			input:    "HeLLo",
			expected: "hello",
		},
		{
			name:     "leading spaces removed",
			input:    "  test",
			expected: "test",
		},
		{
			name:     "trailing spaces removed",
			input:    "test  ",
			expected: "test",
		},
		{
			name:     "leading and trailing spaces removed",
			input:    "  test  ",
			expected: "test",
		},
		{
			name:     "empty string remains empty",
			input:    "",
			expected: "",
		},
		{
			name:     "only spaces becomes empty string",
			input:    "   ",
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := sanitizeGuess(tt.input)
			if got != tt.expected {
				t.Errorf("sanitizeGuess(%q) = %q, want %q", tt.input, got, tt.expected)
			}
		})
	}
}