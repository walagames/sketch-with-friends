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
		{
			name:     "valid hyphenated word",
			input:    "well-known",
			expected: "well-known",
		},
		{
			name:     "hyphenated word with spaces",
			input:    "well - known",
			expected: "well known",
		},
		{
			name:     "multiple valid hyphens",
			input:    "up-to-date",
			expected: "up-to-date",
		},
		{
			name:     "leading hyphen",
			input:    "-test",
			expected: "test",
		},
		{
			name:     "trailing hyphen",
			input:    "test-",
			expected: "test",
		},
		{
			name:     "multiple consecutive hyphens",
			input:    "test--word",
			expected: "test-word",
		},
		{
			name:     "hyphen with apostrophe",
			input:    "don't-worry",
			expected: "don't-worry",
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

func TestFilterDuplicateWords(t *testing.T) {
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
			name:     "no duplicates",
			input:    []string{"hello", "world", "test"},
			expected: []string{"hello", "world", "test"},
		},
		{
			name:     "with duplicates",
			input:    []string{"hello", "world", "hello", "test", "world"},
			expected: []string{"hello", "world", "test"},
		},
		{
			name:     "all duplicates",
			input:    []string{"test", "test", "test"},
			expected: []string{"test"},
		},
		{
			name:     "case sensitive duplicates",
			input:    []string{"hello", "Hello", "HELLO"},
			expected: []string{"hello", "Hello", "HELLO"},
		},
		{
			name:     "with empty strings",
			input:    []string{"", "test", ""},
			expected: []string{"", "test"},
		},
		{
			name:     "with spaces",
			input:    []string{"hello world", "hello world", "test"},
			expected: []string{"hello world", "test"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := filterDuplicateWords(tt.input)
			if !reflect.DeepEqual(got, tt.expected) {
				t.Errorf("filterDuplicateWords() = %v, want %v", got, tt.expected)
			}
		})
	}
}

func TestSanitizeUsername(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "simple lowercase",
			input:    "john",
			expected: "john",
		},
		{
			name:     "mixed case preserved",
			input:    "JohnDoe",
			expected: "JohnDoe",
		},
		{
			name:     "valid apostrophe",
			input:    "John's",
			expected: "John's",
		},
		{
			name:     "multiple valid apostrophes",
			input:    "O'Neil's",
			expected: "O'Neil's",
		},
		{
			name:     "consecutive apostrophes",
			input:    "John''Doe",
			expected: "John'Doe",
		},
		{
			name:     "leading apostrophe",
			input:    "'John",
			expected: "John",
		},
		{
			name:     "trailing apostrophe",
			input:    "John'",
			expected: "John",
		},
		{
			name:     "with valid space",
			input:    "John Doe",
			expected: "John Doe",
		},
		{
			name:     "with multiple spaces",
			input:    "John   Doe",
			expected: "John Doe",
		},
		{
			name:     "with numbers",
			input:    "John123",
			expected: "John123",
		},
		{
			name:     "with special characters",
			input:    "John!@#$%",
			expected: "John",
		},
		{
			name:     "with emojis",
			input:    "John👋Doe",
			expected: "JohnDoe",
		},
		{
			name:     "empty string",
			input:    "",
			expected: "",
		},
		{
			name:     "only invalid characters",
			input:    "123!@#",
			expected: "123",
		},
		{
			name:     "non-English characters",
			input:    "Jöhn",
			expected: "Jhn",
		},
		{
			name:     "too long",
			input:    "thisiswaytoolongggg",
			expected: "",
		},
		{
			name:     "too short",
			input:    "",
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := sanitizeUsername(tt.input)
			if result != tt.expected {
				t.Errorf("sanitizeUsername(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}
