import lunr from "lunr";

/**
 * Split a sentence to tokens, considering a sequence of consecutive Chinese words as a single token.
 *
 * @param text - Text to be tokenized.
 * @param language - Languages used.
 *
 * @returns Tokens.
 */
// Languages that need their own segmenter instead of the default word regex.
const SEGMENTER_LANGUAGES = ["ja", "jp", "th"];

/**
 * Whether a language is indexed with its own segmenter.
 *
 * The segmenter also splits SQL identifiers on `_` and `-`, which the index
 * then drops as punctuation, so a query for a full identifier can come back
 * empty and has to be retried with its parts.
 */
export function usesSegmenterTokenizer(language: string[]): boolean {
  return language.length === 1 && SEGMENTER_LANGUAGES.includes(language[0]);
}

export function tokenize(text: string, language: string[]): string[] {
  // Some languages have their own tokenizer.
  if (usesSegmenterTokenizer(language)) {
    return ((lunr as any)[language[0]] as typeof lunr)
      .tokenizer(text)
      .map((token) => token.toString());
  }

  let regExpMatchWords = /[^-\s]+/g;

  // Especially optimization for `zh`.
  if (language.includes("zh")) {
    // Currently only works fine with letters in Latin alphabet and Chinese.
    // https://zhuanlan.zhihu.com/p/33335629
    regExpMatchWords = /\w+|\p{Unified_Ideograph}+/gu;
    // regExpMatchWords = /\p{Unified_Ideograph}+|[^-\s\p{Unified_Ideograph}]+/gu;
    // https://mothereff.in/regexpu#input=const+regex+%3D+/%5Cp%7BUnified_Ideograph%7D/u%3B&unicodePropertyEscape=1
    // regExpMatchWords = /\w+|[\u3400-\u4DBF\u4E00-\u9FFC\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29\u{20000}-\u{2A6DD}\u{2A700}-\u{2B734}\u{2B740}-\u{2B81D}\u{2B820}-\u{2CEA1}\u{2CEB0}-\u{2EBE0}\u{30000}-\u{3134A}]+/gu
  }

  return text.toLowerCase().match(regExpMatchWords) || [];
}
