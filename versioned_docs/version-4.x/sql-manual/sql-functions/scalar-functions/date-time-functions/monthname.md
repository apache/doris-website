---
{
    "title": "MONTHNAME",
    "language": "en",
    "description": "The MONTHNAME function returns the English month name corresponding to a datetime value. This function supports processing DATE and DATETIME types,"
}
---

## Description

The MONTHNAME function returns the English month name corresponding to a datetime value. This function supports processing DATE and DATETIME types, returning the full English month name (January to December).

You can set the language of the output result through the session variable [lc_time_names](#appendix-lc_time_names-may-be-set-to-any-of-the-following-locale-valuescase-insensitive), which is set to `en_US` by default, meaning the output is in English.

This function behaves the same as MySQL's [monthname function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_monthname).

## Syntax

```sql
MONTHNAME(`<date_or_time_expr>`)
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<date_or_time_expr>` | The input datetime value. Supports date/datetime types. For specific datetime and date formats, see [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## Return Value

Returns a value of type VARCHAR, representing the English name of the month:
- Return value range: January, February, March, April, May, June, July, August, September, October, November, December
- If the input is NULL, returns NULL
- Return value has the first letter capitalized and the rest in lowercase

## Examples

```sql
-- Get English month name from DATE type
SELECT MONTHNAME('2008-02-03') AS result;
+----------+
| result   |
+----------+
| February |
+----------+

-- Get English month name from DATETIME type
SELECT MONTHNAME('2023-07-13 22:28:18') AS result;
+---------+
| result  |
+---------+
| July    |
+---------+

-- Returns NULL when input is NULL
SELECT MONTHNAME(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

---Control the output language by setting `lc_time_names`SET lc_time_names='zh_CN';
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

## Appendix: lc_time_names may be set to any of the following locale values(case insensitive).

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
