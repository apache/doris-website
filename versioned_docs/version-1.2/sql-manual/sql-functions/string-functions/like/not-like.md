---
{
    "title": "NOT LIKE",
    "language": "en"
}
---

## not like
### description
#### syntax

`BOOLEAN not like(VARCHAR str, VARCHAR pattern)`

Perform fuzzy matching on the string str, return false if it matches, and return true if it doesn't match.

like match/fuzzy match, will be used in combination with % and _.

the percent sign ('%') represents zero, one, or more characters.

the underscore ('_') represents a single character.

```
'a'   // Precise matching, the same effect as `=`
'%a'  // data ending with a
'a%'  // data starting with a
'%a%' // data containing a
'_a_' // three digits and the middle letter is a
'_a'  // two digits and the ending letter is a
'a_'  // two digits and the initial letter is a
'a__b'  // four digits, starting letter is a and ending letter is b
```
### example

```
// table test
+-------+
| k1    |
+-------+
| b     |
| bb    |
| bab   |
| a     |
+-------+

// Return data that does not contain a in the k1 string
mysql> select k1 from test where k1 not like '%a%';
+-------+
| k1    |
+-------+
| b     |
| bb    |
+-------+

// Return the data that is not equal to a in the k1 string
mysql> select k1 from test where k1 not like 'a';
+-------+
| k1    |
+-------+
| b     |
| bb    |
| bab   |
+-------+
```

### keywords
    LIKE, NOT, NOT LIKE
