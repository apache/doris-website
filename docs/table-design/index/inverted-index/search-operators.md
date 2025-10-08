---
{
    "title": "Search Operators",
    "language": "en"
}
---

## Full-Text Search Operators

| Operator | Typical Usage | Syntax Example | Additional Notes |
|----------|---------------|----------------|------------------|
| **MATCH_ANY** | Match documents containing any keyword | `SELECT * FROM table_name WHERE content MATCH_ANY 'keyword1 keyword2';` | Returns all rows where the content column contains at least one of keyword1 or keyword2. For example, documents containing "keyword1" or "keyword2" or both can match |
| **MATCH_ALL** | Match documents containing all keywords | `SELECT * FROM table_name WHERE content MATCH_ALL 'keyword1 keyword2';` | Returns all rows where the content column contains both keyword1 and keyword2. Only rows with both keywords will match |
| **MATCH_PHRASE** | Phrase matching, keywords in order and adjacent | `SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2';` | For example, "keyword1 keyword2", "wordx keyword1 keyword2", "wordx keyword1 keyword2 wordy" can match, because keyword2 must immediately follow keyword1. Note that `"support_phrase" = "true"` must be enabled in PROPERTIES |
| **MATCH_PHRASE slop** | Loose phrase matching, allows gaps between keywords but no more than the specified slop value | `SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3';` | slop=3 means there can be at most 3 words between keyword1 and keyword2. 'keyword1 keyword2', 'keyword1 a keyword2', 'keyword1 a b c keyword2' can all match, because the gaps are 0, 1, and 3 respectively, all not exceeding 3. 'keyword2 keyword1', 'keyword2 a keyword1', 'keyword2 a b c keyword1' can also match, because when slop > 0 is specified, the order of keyword1 and keyword2 is not required. Use + for fixed order requirement |
| **MATCH_PHRASE slop strict order mode** | Loose phrase matching with strict keyword order | `SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3+';` | slop=3 with strict order, "keyword1 a b c keyword2" can match, but "keyword2 a b c keyword1" cannot match because the order is reversed |
| **MATCH_PHRASE_PREFIX** | Phrase matching with prefix matching allowed for the last word | `SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1 keyword';` | "keyword1 keyword2abc", "keyword1 keyword2" can match, because keyword2abc and keyword2 both satisfy the prefix match of keyword2, while "keyword1 keyword3" cannot match |
| **MATCH_PHRASE_PREFIX single word degradation mode** | If only one word is specified, it degrades to prefix matching for that word | `SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1';` | Only matches words starting with keyword1 |
| **MATCH_REGEXP** | Regular expression matching for query terms, remember the query term is not tokenized here | `SELECT * FROM table_name WHERE content MATCH_REGEXP '^key_word.*';` | Matches any word starting with "key_word", such as "key_word", "key_words", while keyword will not match, even if _ is a stop word |
| **MATCH_PHRASE_EDGE** | ES query_string equivalent, edge phrase matching, matches documents with the specified phrase as a complete word boundary | `SELECT * FROM table WHERE column MATCH_PHRASE_EDGE 'GET';` | Suppose we have the following rows (field name is content):<br/>1. "The quick brown fox jumps over the lazy dog."<br/>2. "Spotlight on new lighthouse project."<br/>3. "Research shows search engine optimization is key."<br/>4. "Doris is a powerful SQL database."<br/><br/>User query: `content MATCH_PHRASE_EDGE 'search engine optim'`<br/><br/>**Principle:**<br/>- The first word "search" is treated as a suffix word, matching "research" and "search"<br/>- The middle word "engine" requires exact matching<br/>- The last word "optim" is treated as a prefix word, matching "optimization"<br/>- phrase also requires these three words to be adjacent<br/><br/>**Matching document:** Document 3 "Research shows search engine optimization is key." |

## Query Acceleration

### Index Acceleration Operators and Functions List

| Operator / Function | Inverted Index | BloomFilter Index | NGram BloomFilter Index |
|---------------------|----------------|-------------------|-------------------------|
| = | YES | YES | NO |
| != | YES | NO | NO |
| IN | YES | YES | NO |
| NOT IN | YES | NO | NO |
| >, >=, <, <=, BETWEEN | YES | NO | NO |
| IS NULL | YES | NO | NO |
| IS NOT NULL | YES | NO | NO |
| LIKE | NO | NO | YES |
| array_contains | YES | NO | NO |
| array_overlaps | YES | NO | NO |
| is_ip_address_in_range | YES | NO | NO |
