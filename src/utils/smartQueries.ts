import lunr from 'lunr';
import { SmartQuery, SmartTerm } from '../../shared/interfaces';
import { smartTerms } from './smartTerms';
import { language, removeDefaultStopWordFilter } from './proxiedGenerated';

/**
 * Get all possible queries for a list of tokens consists of words mixed English and Chinese,
 * by a Chinese words dictionary.
 *
 * @param tokens - Tokens consists of English words or strings of consecutive Chinese words.
 * @param zhDictionary - A Chinese words dictionary.
 *
 * @returns A smart query list.
 */
export function smartQueries(tokens: string[], zhDictionary: string[]): SmartQuery[] {
    const terms = smartTerms(tokens, zhDictionary);

    if (terms.length === 0) {
        // There are no matched terms.
        // All tokens are considered required and with wildcard.
        return [
            {
                tokens,
                term: tokens.map(value => ({
                    value,
                    presence: lunr.Query.presence.REQUIRED,
                    wildcard: lunr.Query.wildcard.LEADING | lunr.Query.wildcard.TRAILING,
                })),
            },
        ];
    }

    // The last token of a term maybe incomplete while user is typing.
    for (const term of terms) {
        term[term.length - 1].maybeTyping = true;
    }

    lunr.generateStopWordFilter = function (stopWords) {
        var words = stopWords.reduce(function (memo, stopWord) {
            memo[stopWord] = stopWord;
            return memo;
        }, {});

        return function (token) {
            if (token && words[token.toString()] !== token.toString()) return token;
        };
    };
    lunr.stopWordFilter = lunr.generateStopWordFilter([
        'a',
        'able',
        'about',
        'across',
        'after',
        'all',
        'almost',
        'also',
        'am',
        'among',
        'an',
        'and',
        'any',
        'are',
        'as',
        'at',
        'be',
        'because',
        'been',
        'but',
        'by',
        'can',
        'cannot',
        'could',
        'dear',
        'did',
        'do',
        'does',
        'either',
        'else',
        'ever',
        'every',
        'for',
        'from',
        'get',
        'got',
        'had',
        'has',
        'have',
        'he',
        'her',
        'hers',
        'him',
        'his',
        'how',
        'however',
        'i',
        'if',
        'in',
        'into',
        'is',
        'it',
        'its',
        'just',
        'least',
        'let',
        'like',
        'likely',
        'may',
        'me',
        'might',
        'most',
        'must',
        'my',
        'neither',
        'no',
        'nor',
        'not',
        'of',
        'off',
        'often',
        'on',
        'only',
        'or',
        'other',
        'our',
        'own',
        'rather',
        'said',
        'say',
        'says',
        'she',
        'should',
        'since',
        'so',
        'some',
        'than',
        'that',
        'the',
        'their',
        'them',
        'then',
        'there',
        'these',
        'they',
        'this',
        'tis',
        'to',
        'too',
        'twas',
        'us',
        'wants',
        'was',
        'we',
        'were',
        'what',
        'when',
        'where',
        'which',
        'while',
        'who',
        'whom',
        'why',
        'will',
        'with',
        'would',
        'yet',
        'you',
        'your',
    ]);
    lunrLanguageZh(lunr);
    // Try to append terms without stop words,
    // since they are removed in the index.
    const stopWordPipelines: lunr.PipelineFunction[] = [];
    for (const lang of language) {
        if (lang === 'en') {
            if (!removeDefaultStopWordFilter) {
                stopWordPipelines.unshift(lunr.stopWordFilter);
            }
        } else {
            const lunrLang = (lunr as any)[lang] as typeof lunr;
            if (lunrLang.stopWordFilter) {
                stopWordPipelines.unshift(lunrLang.stopWordFilter);
            }
        }
    }

    let refinedTerms: SmartTerm[];

    if (stopWordPipelines.length > 0) {
        const pipe = (term: SmartTerm) =>
            stopWordPipelines.reduce(
                (term, p) => term.filter(item => (p as unknown as (str: string) => string | undefined)(item.value)),
                term,
            );
        refinedTerms = [];
        const newTerms: SmartTerm[] = [];
        for (const term of terms) {
            const filteredTerm = pipe(term);
            refinedTerms.push(filteredTerm);
            // Add extra terms only if some stop words are removed,
            // and some non-stop-words exist too.
            if (filteredTerm.length < term.length && filteredTerm.length > 0) {
                newTerms.push(filteredTerm);
            }
        }
        terms.push(...newTerms);
    } else {
        refinedTerms = terms.slice();
    }

    // Also try to add extra terms which miss one of the searched tokens,
    // when the term contains 3 or more tokens,
    // to improve the search precision.
    const extraTerms: SmartTerm[] = [];
    for (const term of refinedTerms) {
        if (term.length > 2) {
            for (let i = term.length - 1; i >= 0; i -= 1) {
                extraTerms.push(term.slice(0, i).concat(term.slice(i + 1)));
            }
        }
    }

    return getQueriesMaybeTyping(terms).concat(getQueriesMaybeTyping(extraTerms));
}

function getQueriesMaybeTyping(terms: SmartTerm[]): SmartQuery[] {
    return termsToQueries(terms).concat(
        termsToQueries(
            // Ignore terms whose last token already has a trailing wildcard,
            // or the last token is not `maybeTyping`.
            terms.filter(term => {
                const token = term[term.length - 1];
                return !token.trailing && token.maybeTyping;
            }),
            true,
        ),
    );
}

function termsToQueries(terms: SmartTerm[], maybeTyping?: boolean): SmartQuery[] {
    return terms.map(term => ({
        tokens: term.map(item => item.value),
        term: term.map(item => ({
            value: item.value,
            presence: lunr.Query.presence.REQUIRED,
            // The last token of a term maybe incomplete while user is typing.
            // So append more queries with trailing wildcard added.
            wildcard: (maybeTyping ? item.trailing || item.maybeTyping : item.trailing)
                ? lunr.Query.wildcard.TRAILING
                : lunr.Query.wildcard.NONE,
        })),
    }));
}

// `lunr-languages/lunr.stemmer.support` is required.
function generateTrimmer(wordCharacters) {
  const startRegex = new RegExp("^[^" + wordCharacters + "]+", "u");
  const endRegex = new RegExp("[^" + wordCharacters + "]+$", "u");
  return function (token) {
      return token.update(function (str) {
          return str.replace(startRegex, "").replace(endRegex, "");
      });
  };
}


function lunrLanguageZh(lunr, tokenizer) {
  lunr.trimmerSupport.generateTrimmer = generateTrimmer;
  lunr.zh = function () {
      this.pipeline.reset();
      this.pipeline.add(lunr.zh.trimmer, lunr.zh.stopWordFilter);
      if (tokenizer) {
          this.tokenizer = tokenizer;
      }
  };
  if (tokenizer) {
      lunr.zh.tokenizer = tokenizer;
  }
  // https://zhuanlan.zhihu.com/p/33335629
  // https://mothereff.in/regexpu#input=const+regex+%3D+/%5Cp%7BUnified_Ideograph%7D/u%3B&unicodePropertyEscape=1
  lunr.zh.wordCharacters =
      "\\u3400-\\u4DBF\\u4E00-\\u9FFC\\uFA0E\\uFA0F\\uFA11\\uFA13\\uFA14\\uFA1F\\uFA21\\uFA23\\uFA24\\uFA27-\\uFA29\\u{20000}-\\u{2A6DD}\\u{2A700}-\\u{2B734}\\u{2B740}-\\u{2B81D}\\u{2B820}-\\u{2CEA1}\\u{2CEB0}-\\u{2EBE0}\\u{30000}-\\u{3134A}";
  lunr.zh.trimmer = lunr.trimmerSupport.generateTrimmer(lunr.zh.wordCharacters);
  lunr.Pipeline.registerFunction(lunr.zh.trimmer, "trimmer-zh");
  /* lunr stop word filter. see https://www.ranks.nl/stopwords/chinese-stopwords */
  lunr.zh.stopWordFilter = lunr.generateStopWordFilter("的 一 不 在 人 有 是 为 以 于 上 他 而 后 之 来 及 了 因 下 可 到 由 这 与 也 此 但 并 个 其 已 无 小 我 们 起 最 再 今 去 好 只 又 或 很 亦 某 把 那 你 乃 它 吧 被 比 别 趁 当 从 到 得 打 凡 儿 尔 该 各 给 跟 和 何 还 即 几 既 看 据 距 靠 啦 了 另 么 每 们 嘛 拿 哪 那 您 凭 且 却 让 仍 啥 如 若 使 谁 虽 随 同 所 她 哇 嗡 往 哪 些 向 沿 哟 用 于 咱 则 怎 曾 至 致 着 诸 自".split(" "));
  lunr.Pipeline.registerFunction(lunr.zh.stopWordFilter, "stopWordFilter-zh");
}
