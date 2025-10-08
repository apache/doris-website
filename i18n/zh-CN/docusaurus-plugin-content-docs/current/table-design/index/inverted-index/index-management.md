---
{
    "title": "索引管理",
    "language": "zh-CN"
}
---

## 建表时定义倒排索引

在建表语句中 COLUMN 的定义之后是索引定义：

```sql
CREATE TABLE table_name
(
  column_name1 TYPE1,
  column_name2 TYPE2,
  column_name3 TYPE3,
  INDEX idx_name1(column_name1) USING INVERTED [PROPERTIES(...)] [COMMENT 'your comment'],
  INDEX idx_name2(column_name2) USING INVERTED [PROPERTIES(...)] [COMMENT 'your comment']
)
table_properties;
```

语法说明如下：

**1. `idx_column_name(column_name)` 是必须的，`column_name` 是建索引的列名，必须是前面列定义中出现过的，`idx_column_name` 是索引名字，必须表级别唯一，建议命名规范：列名前面加前缀 `idx_`**

**2. `USING INVERTED` 是必须的，用于指定索引类型是倒排索引**

**3. `PROPERTIES` 是可选的，用于指定倒排索引的额外属性，目前支持的属性如下：**

<details>
  <summary>parser 指定分词器</summary>
  <p>- 默认不指定代表不分词</p>
  <p>- `english` 是英文分词，适合被索引列是英文的情况，用空格和标点符号分词，性能高</p>
  <p>- `chinese` 是中文分词，适合被索引列主要是中文的情况，性能比 English 分词低</p>
  <p>- `unicode` 是多语言混合类型分词，适用于中英文混合、多语言混合的情况。它能够对邮箱前缀和后缀、IP 地址以及字符数字混合进行分词，并且可以对中文按字符分词。</p>

  分词的效果可以通过 `TOKENIZE` SQL 函数进行验证，具体参考后续章节。
</details>

<details>
  <summary>parser_mode</summary>

  **用于指定分词的模式，目前 parser = chinese 时支持如下几种模式：**
  <p>- fine_grained：细粒度模式，倾向于分出比较短、较多的词，比如 '武汉市长江大桥' 会分成 '武汉', '武汉市', '市长', '长江', '长江大桥', '大桥' 6 个词</p>
  <p>- coarse_grained：粗粒度模式，倾向于分出比较长、较少的词，，比如 '武汉市长江大桥' 会分成 '武汉市' '长江大桥' 2 个词</p>
  <p>- 默认 coarse_grained</p>
</details>

<details>
  <summary>support_phrase</summary>

  **用于指定索引是否支持 MATCH_PHRASE 短语查询加速**
  <p>- true 为支持，但是索引需要更多的存储空间</p>
  <p>- false 为不支持，更省存储空间，可以用 MATCH_ALL 查询多个关键字</p>
  <p>- 从 2.0.14, 2.1.5 和 3.0.1 版本开始，如果指定了 parser 则默认为 true，否则默认为 false</p>

  例如下面的例子指定中文分词，粗粒度模式，支持短语查询加速。
```sql
   INDEX idx_name(column_name) USING INVERTED PROPERTIES("parser" = "chinese", "parser_mode" = "coarse_grained", "support_phrase" = "true")
```
</details>

<details>
  <summary>char_filter</summary>

  **用于指定在分词前对文本进行预处理，通常用于影响分词行为**

  <p>char_filter_type：指定使用不同功能的 char_filter（目前仅支持 char_replace）</p>

  <p>char_replace 将 pattern 中每个 char 替换为一个 replacement 中的 char</p>
  <p>- char_filter_pattern：需要被替换掉的字符数</p>
  <p>- char_filter_replacement：替换后的字符数组，可以不用配置，默认为一个空格字符</p>

  例如下面的例子将点和下划线替换成空格，达到将点和下划线作为单词分隔符的目的，影响分词行为。
```sql
   INDEX idx_name(column_name) USING INVERTED PROPERTIES("parser" = "unicode", "char_filter_type" = "char_replace", "char_filter_pattern" = "._", "char_filter_replacement" = " ")
```
`
</details>

<details>
  <summary>ignore_above</summary>

  **用于指定不分词字符串索引（没有指定 parser）的长度限制**
  <p>- 长度超过 ignore_above 设置的字符串不会被索引。对于字符串数组，ignore_above 将分别应用于每个数组元素，长度超过 ignore_above 的字符串元素将不被索引。</p>
  <p>- 默认为 256，单位是字节</p>

</details>

<details>
  <summary>lower_case</summary>

  **是否将分词进行小写转换，从而在匹配的时候实现忽略大小写**
  <p>- true: 转换小写</p>
  <p>- false：不转换小写</p>
  <p>- 从 2.0.7 和 2.1.2 版本开始默认为 true，自动转小写，之前的版本默认为 false</p>
</details>

<details>
  <summary>stopwords</summary>

  **指明使用的停用词表，会影响分词器的行为**
  <p>默认的内置停用词表包含一些无意义的词：'is'、'the'、'a' 等。在写入或者查询时，分词器会忽略停用词表中的词。</p>
  <p>- none: 使用空的停用词表</p>
</details>

**4. `COMMENT` 是可选的，用于指定索引注释**

## 已有表增加倒排索引

**1. ADD INDEX**

支持`CREATE INDEX` 和 `ALTER TABLE ADD INDEX` 两种语法，参数跟建表时索引定义相同

```sql
-- 语法 1
CREATE INDEX idx_name ON table_name(column_name) USING INVERTED [PROPERTIES(...)] [COMMENT 'your comment'];
-- 语法 2
ALTER TABLE table_name ADD INDEX idx_name(column_name) USING INVERTED [PROPERTIES(...)] [COMMENT 'your comment'];
```

## 已有表删除倒排索引

```sql
-- 语法 1
DROP INDEX idx_name ON table_name;
-- 语法 2
ALTER TABLE table_name DROP INDEX idx_name;
```

:::tip

`DROP INDEX` 会删除索引定义，新写入数据不会再写索引，同时会生成一个异步任务执行索引删除操作，在每个 BE 上有多个线程执行索引删除任务，通过 BE 参数 `alter_index_worker_count` 可以设置，默认值是 3。

:::

## 查看倒排索引

```sql
-- 语法 1，表的 schema 中 INDEX 部分 USING INVERTED 是倒排索引
SHOW CREATE TABLE table_name;

-- 语法 2，IndexType 为 INVERTED 的是倒排索引
SHOW INDEX FROM idx_name;
```
