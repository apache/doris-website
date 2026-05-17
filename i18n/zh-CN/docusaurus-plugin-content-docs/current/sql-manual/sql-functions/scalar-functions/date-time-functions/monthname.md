---
{
    "title": "MONTHNAME",
    "language": "zh-CN",
    "description": "MONTHNAME 函数用于返回日期时间值对应的英文月份名称。该函数支持处理 DATE、DATETIME 类型，返回值为完整的英文月份名称（1月 至 12月）。"
}
---

## 描述

MONTHNAME 函数用于返回日期时间值对应的英文月份名称。该函数支持处理 DATE、DATETIME 类型，返回值为完整的英文月份名称（1月 至 12月）。

可以通过会话变量 [lc_time_names](#附表lc_time_names-支持的语言地区代码不区分大小写) 设置输出结果的语言，该变量默认为 `en_US`，即输出英文。

该函数与 mysql 的 [monthname 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_monthname) 使用 MINUTE 为单位的行为一致。

## 语法

```sql
MONTHNAME(`<date_or_time_expr>`)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| ``<date_or_time_expr>`` | 输入的日期时间值，支持输入 date/datetime 类型,具体 datetime 和 date 格式请查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 和 [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## 返回值

返回类型为 VARCHAR，表示月份的英文名称：
- 返回值范围：January, February, March, April, May, June, July, August, September, October, November, December
- 如果输入为 NULL，返回 NULL
- 返回值首字母大写，其余字母小写

## 举例

```sql
--- 从 DATE 类型中获取英文月份名称
SELECT MONTHNAME('2008-02-03') AS result;
+----------+
| result   |
+----------+
| February |
+----------+

--- 从 DATETIME 类型中获取英文月份名称
SELECT MONTHNAME('2023-07-13 22:28:18') AS result;
+---------+
| result  |
+---------+
| July    |
+---------+

--- 输入为 NULL 时返回 NULL
SELECT MONTHNAME(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

---通过设置 `lc_time_namse` 控制输出语言
SET lc_time_names='zh_CN';
SELECT MONTHNAME('2023-07-13 22:28:18') AS result;
+--------+
| result |
+--------+
| 七月   |
+--------+

SET lc_time_names='AR_sa';
SELECT MONTHNAME('2023-07-13 22:28:18') AS result;
+------------+
| result     |
+------------+
| يوليو      |
+------------+
```

## 附表：lc_time_names 支持的语言地区代码(不区分大小写)

| Locale Value | Meaning |
| --- | --- |
| ar_AE | Arabic - United Arab Emirates |
| ar_BH | Arabic - Bahrain |
| ar_DZ | Arabic - Algeria |
| ar_EG | Arabic - Egypt |
| ar_IN | Arabic - India |
| ar_IQ | Arabic - Iraq |
| ar_JO | Arabic - Jordan |
| ar_KW | Arabic - Kuwait |
| ar_LB | Arabic - Lebanon |
| ar_LY | Arabic - Libya |
| ar_MA | Arabic - Morocco |
| ar_OM | Arabic - Oman |
| ar_QA | Arabic - Qatar |
| ar_SA | Arabic - Saudi Arabia |
| ar_SD | Arabic - Sudan |
| ar_SY | Arabic - Syria |
| ar_TN | Arabic - Tunisia |
| ar_YE | Arabic - Yemen |
| be_BY | Belarusian - Belarus |
| bg_BG | Bulgarian - Bulgaria |
| ca_ES | Catalan - Spain |
| cs_CZ | Czech - Czech Republic |
| da_DK | Danish - Denmark |
| de_AT | German - Austria |
| de_BE | German - Belgium |
| de_CH | German - Switzerland |
| de_DE | German - Germany |
| de_LU | German - Luxembourg |
| el_GR | Greek - Greece |
| en_AU | English - Australia |
| en_CA | English - Canada |
| en_GB | English - United Kingdom |
| en_IN | English - India |
| en_NZ | English - New Zealand |
| en_PH | English - Philippines |
| en_US | English - United States |
| en_ZA | English - South Africa |
| en_ZW | English - Zimbabwe |
| es_AR | Spanish - Argentina |
| es_BO | Spanish - Bolivia |
| es_CL | Spanish - Chile |
| es_CO | Spanish - Colombia |
| es_CR | Spanish - Costa Rica |
| es_DO | Spanish - Dominican Republic |
| es_EC | Spanish - Ecuador |
| es_ES | Spanish - Spain |
| es_GT | Spanish - Guatemala |
| es_HN | Spanish - Honduras |
| es_MX | Spanish - Mexico |
| es_NI | Spanish - Nicaragua |
| es_PA | Spanish - Panama |
| es_PE | Spanish - Peru |
| es_PR | Spanish - Puerto Rico |
| es_PY | Spanish - Paraguay |
| es_SV | Spanish - El Salvador |
| es_US | Spanish - United States |
| es_UY | Spanish - Uruguay |
| es_VE | Spanish - Venezuela |
| et_EE | Estonian - Estonia |
| eu_ES | Basque - Spain |
| fi_FI | Finnish - Finland |
| fo_FO | Faroese - Faroe Islands |
| fr_BE | French - Belgium |
| fr_CA | French - Canada |
| fr_CH | French - Switzerland |
| fr_FR | French - France |
| fr_LU | French - Luxembourg |
| gl_ES | Galician - Spain |
| gu_IN | Gujarati - India |
| he_IL | Hebrew - Israel |
| hi_IN | Hindi - India |
| hr_HR | Croatian - Croatia |
| hu_HU | Hungarian - Hungary |
| id_ID | Indonesian - Indonesia |
| is_IS | Icelandic - Iceland |
| it_CH | Italian - Switzerland |
| it_IT | Italian - Italy |
| ja_JP | Japanese - Japan |
| ko_KR | Korean - Republic of Korea |
| lt_LT | Lithuanian - Lithuania |
| lv_LV | Latvian - Latvia |
| mk_MK | Macedonian - North Macedonia |
| mn_MN | Mongolia - Mongolian |
| ms_MY | Malay - Malaysia |
| nb_NO | Norwegian(Bokmål) - Norway |
| nl_BE | Dutch - Belgium |
| nl_NL | Dutch - The Netherlands |
| no_NO | Norwegian - Norway |
| pl_PL | Polish - Poland |
| pt_BR | Portugese - Brazil |
| pt_PT | Portugese - Portugal |
| rm_CH | Romansh - Switzerland |
| ro_RO | Romanian - Romania |
| ru_RU | Russian - Russia |
| ru_UA | Russian - Ukraine |
| sk_SK | Slovak - Slovakia |
| sl_SI | Slovenian - Slovenia |
| sq_AL | Albanian - Albania |
| sr_RS | Serbian - Serbia |
| sv_FI | Swedish - Finland |
| sv_SE | Swedish - Sweden |
| ta_IN | Tamil - India |
| te_IN | Telugu - India |
| th_TH | Thai - Thailand |
| tr_TR | Turkish - Turkey |
| uk_UA | Ukrainian - Ukraine |
| ur_PK | Urdu - Pakistan |
| vi_VN | Vietnamese - Vietnam |
| zh_CN | Chinese - China |
| zh_HK | Chinese - Hong Kong |
| zh_TW | Chinese - Taiwan |