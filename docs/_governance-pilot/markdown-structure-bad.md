---
title: "Fixture: markdown structure issues"
description: "This fixture intentionally violates Markdown structure rules to trigger code fence, heading and CJK spacing lints."
---

# First H1 heading

Some intro text in English. 这里是中文和English单词直接相连，没空格，应该触发 markdown-cjk-spacing 规则。例如 Doris3.0 这种写法也会触发。

####  Skipped from H1 to H4 to trigger heading increment rule

Body under an invalid heading jump.

##

Above heading is empty so it should trigger markdown-empty-heading.

# Second H1 which should not exist

This second H1 should trigger markdown-single-h1.

## Code fence without language

```
SELECT * FROM tbl;
```

## Code fence with language (control)

```sql
SELECT 1;
```
