---
{
    "title": "LIKE",
    "language": "en"
}
---

## like
### description
#### syntax

`BOOLEAN like(VARCHAR str, VARCHAR pattern)`

Perform fuzzy matching on the string str, return true if it matches, and false if it doesn't match.

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

// Return the data containing a in the k1 string
mysql> select k1 from test where k1 like '%a%';
+-------+
| k1    |
+-------+
| a     |
| bab   |
+-------+

// Return the data equal to a in the k1 string
mysql> select k1 from test where k1 like 'a';
+-------+
| k1    |
+-------+
| a     |
+-------+
```

### keywords
    LIKE
