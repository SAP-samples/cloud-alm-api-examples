'use strict';
/******************************************************************************
 * Codelist
 * Country/Region List
 */
const Countries = [
    {
        "ID": "XX",
        "name": "Generic"
    },
    {
        "ID": "AD",
        "name": "Andorra"
    },
    {
        "ID": "AE",
        "name": "United Arab Emirates"
    },
    {
        "ID": "AF",
        "name": "Afghanistan"
    },
    {
        "ID": "AG",
        "name": "Antigua & Barbuda"
    },
    {
        "ID": "AI",
        "name": "Anguilla"
    },
    {
        "ID": "AL",
        "name": "Albania"
    },
    {
        "ID": "AM",
        "name": "Armenia"
    },
    {
        "ID": "AO",
        "name": "Angola"
    },
    {
        "ID": "AQ",
        "name": "Antarctica"
    },
    {
        "ID": "AR",
        "name": "Argentina"
    },
    {
        "ID": "AS",
        "name": "American Samoa"
    },
    {
        "ID": "AT",
        "name": "Austria"
    },
    {
        "ID": "AU",
        "name": "Australia"
    },
    {
        "ID": "AW",
        "name": "Aruba"
    },
    {
        "ID": "AX",
        "name": "Åland Islands"
    },
    {
        "ID": "AZ",
        "name": "Azerbaijan"
    },
    {
        "ID": "BA",
        "name": "Bosnia & Herzegovina"
    },
    {
        "ID": "BB",
        "name": "Barbados"
    },
    {
        "ID": "BD",
        "name": "Bangladesh"
    },
    {
        "ID": "BE",
        "name": "Belgium"
    },
    {
        "ID": "BF",
        "name": "Burkina Faso"
    },
    {
        "ID": "BG",
        "name": "Bulgaria"
    },
    {
        "ID": "BH",
        "name": "Bahrain"
    },
    {
        "ID": "BI",
        "name": "Burundi"
    },
    {
        "ID": "BJ",
        "name": "Benin"
    },
    {
        "ID": "BL",
        "name": "St. Barthélemy"
    },
    {
        "ID": "BM",
        "name": "Bermuda"
    },
    {
        "ID": "BN",
        "name": "Brunei"
    },
    {
        "ID": "BO",
        "name": "Bolivia"
    },
    {
        "ID": "BQ",
        "name": "Caribbean Netherlands"
    },
    {
        "ID": "BR",
        "name": "Brazil"
    },
    {
        "ID": "BS",
        "name": "Bahamas"
    },
    {
        "ID": "BT",
        "name": "Bhutan"
    },
    {
        "ID": "BV",
        "name": "Bouvet Island"
    },
    {
        "ID": "BW",
        "name": "Botswana"
    },
    {
        "ID": "BY",
        "name": "Belarus"
    },
    {
        "ID": "BZ",
        "name": "Belize"
    },
    {
        "ID": "CA",
        "name": "Canada"
    },
    {
        "ID": "CC",
        "name": "Cocos (Keeling) Islands"
    },
    {
        "ID": "CD",
        "name": "Congo - Kinshasa"
    },
    {
        "ID": "CF",
        "name": "Central African Republic"
    },
    {
        "ID": "CG",
        "name": "Congo - Brazzaville"
    },
    {
        "ID": "CH",
        "name": "Switzerland"
    },
    {
        "ID": "CI",
        "name": "Côte d’Ivoire"
    },
    {
        "ID": "CK",
        "name": "Cook Islands"
    },
    {
        "ID": "CL",
        "name": "Chile"
    },
    {
        "ID": "CM",
        "name": "Cameroon"
    },
    {
        "ID": "CN",
        "name": "China"
    },
    {
        "ID": "CO",
        "name": "Colombia"
    },
    {
        "ID": "CR",
        "name": "Costa Rica"
    },
    {
        "ID": "CU",
        "name": "Cuba"
    },
    {
        "ID": "CV",
        "name": "Cape Verde"
    },
    {
        "ID": "CW",
        "name": "Curaçao"
    },
    {
        "ID": "CX",
        "name": "Christmas Island"
    },
    {
        "ID": "CY",
        "name": "Cyprus"
    },
    {
        "ID": "CZ",
        "name": "Czechia"
    },
    {
        "ID": "DE",
        "name": "Germany"
    },
    {
        "ID": "DJ",
        "name": "Djibouti"
    },
    {
        "ID": "DK",
        "name": "Denmark"
    },
    {
        "ID": "DM",
        "name": "Dominica"
    },
    {
        "ID": "DO",
        "name": "Dominican Republic"
    },
    {
        "ID": "DZ",
        "name": "Algeria"
    },
    {
        "ID": "EC",
        "name": "Ecuador"
    },
    {
        "ID": "EE",
        "name": "Estonia"
    },
    {
        "ID": "EG",
        "name": "Egypt"
    },
    {
        "ID": "EH",
        "name": "Western Sahara"
    },
    {
        "ID": "ER",
        "name": "Eritrea"
    },
    {
        "ID": "ES",
        "name": "Spain"
    },
    {
        "ID": "ET",
        "name": "Ethiopia"
    },
    {
        "ID": "FI",
        "name": "Finland"
    },
    {
        "ID": "FJ",
        "name": "Fiji"
    },
    {
        "ID": "FK",
        "name": "Falkland Islands"
    },
    {
        "ID": "FM",
        "name": "Micronesia"
    },
    {
        "ID": "FO",
        "name": "Faroe Islands"
    },
    {
        "ID": "FR",
        "name": "France"
    },
    {
        "ID": "GA",
        "name": "Gabon"
    },
    {
        "ID": "GB",
        "name": "United Kingdom"
    },
    {
        "ID": "GD",
        "name": "Grenada"
    },
    {
        "ID": "GE",
        "name": "Georgia"
    },
    {
        "ID": "GF",
        "name": "French Guiana"
    },
    {
        "ID": "GG",
        "name": "Guernsey"
    },
    {
        "ID": "GH",
        "name": "Ghana"
    },
    {
        "ID": "GI",
        "name": "Gibraltar"
    },
    {
        "ID": "GL",
        "name": "Greenland"
    },
    {
        "ID": "GM",
        "name": "Gambia"
    },
    {
        "ID": "GN",
        "name": "Guinea"
    },
    {
        "ID": "GP",
        "name": "Guadeloupe"
    },
    {
        "ID": "GQ",
        "name": "Equatorial Guinea"
    },
    {
        "ID": "GR",
        "name": "Greece"
    },
    {
        "ID": "GS",
        "name": "South Georgia & South Sandwich Islands"
    },
    {
        "ID": "GT",
        "name": "Guatemala"
    },
    {
        "ID": "GU",
        "name": "Guam"
    },
    {
        "ID": "GW",
        "name": "Guinea-Bissau"
    },
    {
        "ID": "GY",
        "name": "Guyana"
    },
    {
        "ID": "HK",
        "name": "Hong Kong"
    },
    {
        "ID": "HM",
        "name": "Heard & McDonald Islands"
    },
    {
        "ID": "HN",
        "name": "Honduras"
    },
    {
        "ID": "HR",
        "name": "Croatia"
    },
    {
        "ID": "HT",
        "name": "Haiti"
    },
    {
        "ID": "HU",
        "name": "Hungary"
    },
    {
        "ID": "ID",
        "name": "Indonesia"
    },
    {
        "ID": "IE",
        "name": "Ireland"
    },
    {
        "ID": "IL",
        "name": "Israel"
    },
    {
        "ID": "IM",
        "name": "Isle of Man"
    },
    {
        "ID": "IN",
        "name": "India"
    },
    {
        "ID": "IO",
        "name": "British Indian Ocean Territory"
    },
    {
        "ID": "IQ",
        "name": "Iraq"
    },
    {
        "ID": "IR",
        "name": "Iran"
    },
    {
        "ID": "IS",
        "name": "Iceland"
    },
    {
        "ID": "IT",
        "name": "Italy"
    },
    {
        "ID": "JE",
        "name": "Jersey"
    },
    {
        "ID": "JM",
        "name": "Jamaica"
    },
    {
        "ID": "JO",
        "name": "Jordan"
    },
    {
        "ID": "JP",
        "name": "Japan"
    },
    {
        "ID": "KE",
        "name": "Kenya"
    },
    {
        "ID": "KG",
        "name": "Kyrgyzstan"
    },
    {
        "ID": "KH",
        "name": "Cambodia"
    },
    {
        "ID": "KI",
        "name": "Kiribati"
    },
    {
        "ID": "KM",
        "name": "Comoros"
    },
    {
        "ID": "KN",
        "name": "St. Kitts & Nevis"
    },
    {
        "ID": "KP",
        "name": "North Korea"
    },
    {
        "ID": "KR",
        "name": "South Korea"
    },
    {
        "ID": "KW",
        "name": "Kuwait"
    },
    {
        "ID": "KY",
        "name": "Cayman Islands"
    },
    {
        "ID": "KZ",
        "name": "Kazakhstan"
    },
    {
        "ID": "LA",
        "name": "Laos"
    },
    {
        "ID": "LB",
        "name": "Lebanon"
    },
    {
        "ID": "LC",
        "name": "St. Lucia"
    },
    {
        "ID": "LI",
        "name": "Liechtenstein"
    },
    {
        "ID": "LK",
        "name": "Sri Lanka"
    },
    {
        "ID": "LR",
        "name": "Liberia"
    },
    {
        "ID": "LS",
        "name": "Lesotho"
    },
    {
        "ID": "LT",
        "name": "Lithuania"
    },
    {
        "ID": "LU",
        "name": "Luxembourg"
    },
    {
        "ID": "LV",
        "name": "Latvia"
    },
    {
        "ID": "LY",
        "name": "Libya"
    },
    {
        "ID": "MA",
        "name": "Morocco"
    },
    {
        "ID": "MC",
        "name": "Monaco"
    },
    {
        "ID": "MD",
        "name": "Moldova"
    },
    {
        "ID": "ME",
        "name": "Montenegro"
    },
    {
        "ID": "MF",
        "name": "St. Martin"
    },
    {
        "ID": "MG",
        "name": "Madagascar"
    },
    {
        "ID": "MH",
        "name": "Marshall Islands"
    },
    {
        "ID": "MK",
        "name": "Macedonia"
    },
    {
        "ID": "ML",
        "name": "Mali"
    },
    {
        "ID": "MM",
        "name": "Myanmar (Burma)"
    },
    {
        "ID": "MN",
        "name": "Mongolia"
    },
    {
        "ID": "MO",
        "name": "Macau"
    },
    {
        "ID": "MP",
        "name": "Northern Mariana Islands"
    },
    {
        "ID": "MQ",
        "name": "Martinique"
    },
    {
        "ID": "MR",
        "name": "Mauritania"
    },
    {
        "ID": "MS",
        "name": "Montserrat"
    },
    {
        "ID": "MT",
        "name": "Malta"
    },
    {
        "ID": "MU",
        "name": "Mauritius"
    },
    {
        "ID": "MV",
        "name": "Maldives"
    },
    {
        "ID": "MW",
        "name": "Malawi"
    },
    {
        "ID": "MX",
        "name": "Mexico"
    },
    {
        "ID": "MY",
        "name": "Malaysia"
    },
    {
        "ID": "MZ",
        "name": "Mozambique"
    },
    {
        "ID": "NA",
        "name": "Namibia"
    },
    {
        "ID": "NC",
        "name": "New Caledonia"
    },
    {
        "ID": "NE",
        "name": "Niger"
    },
    {
        "ID": "NF",
        "name": "Norfolk Island"
    },
    {
        "ID": "NG",
        "name": "Nigeria"
    },
    {
        "ID": "NI",
        "name": "Nicaragua"
    },
    {
        "ID": "NL",
        "name": "Netherlands"
    },
    {
        "ID": "NO",
        "name": "Norway"
    },
    {
        "ID": "NP",
        "name": "Nepal"
    },
    {
        "ID": "NR",
        "name": "Nauru"
    },
    {
        "ID": "NU",
        "name": "Niue"
    },
    {
        "ID": "NZ",
        "name": "New Zealand"
    },
    {
        "ID": "OM",
        "name": "Oman"
    },
    {
        "ID": "PA",
        "name": "Panama"
    },
    {
        "ID": "PE",
        "name": "Peru"
    },
    {
        "ID": "PF",
        "name": "French Polynesia"
    },
    {
        "ID": "PG",
        "name": "Papua New Guinea"
    },
    {
        "ID": "PH",
        "name": "Philippines"
    },
    {
        "ID": "PK",
        "name": "Pakistan"
    },
    {
        "ID": "PL",
        "name": "Poland"
    },
    {
        "ID": "PM",
        "name": "St. Pierre & Miquelon"
    },
    {
        "ID": "PN",
        "name": "Pitcairn Islands"
    },
    {
        "ID": "PR",
        "name": "Puerto Rico"
    },
    {
        "ID": "PS",
        "name": "Palestinian Territories"
    },
    {
        "ID": "PT",
        "name": "Portugal"
    },
    {
        "ID": "PW",
        "name": "Palau"
    },
    {
        "ID": "PY",
        "name": "Paraguay"
    },
    {
        "ID": "QA",
        "name": "Qatar"
    },
    {
        "ID": "RE",
        "name": "Réunion"
    },
    {
        "ID": "RO",
        "name": "Romania"
    },
    {
        "ID": "RS",
        "name": "Serbia"
    },
    {
        "ID": "RU",
        "name": "Russia"
    },
    {
        "ID": "RW",
        "name": "Rwanda"
    },
    {
        "ID": "SA",
        "name": "Saudi Arabia"
    },
    {
        "ID": "SB",
        "name": "Solomon Islands"
    },
    {
        "ID": "SC",
        "name": "Seychelles"
    },
    {
        "ID": "SD",
        "name": "Sudan"
    },
    {
        "ID": "SE",
        "name": "Sweden"
    },
    {
        "ID": "SG",
        "name": "Singapore"
    },
    {
        "ID": "SH",
        "name": "St. Helena"
    },
    {
        "ID": "SI",
        "name": "Slovenia"
    },
    {
        "ID": "SJ",
        "name": "Svalbard & Jan Mayen"
    },
    {
        "ID": "SK",
        "name": "Slovakia"
    },
    {
        "ID": "SL",
        "name": "Sierra Leone"
    },
    {
        "ID": "SM",
        "name": "San Marino"
    },
    {
        "ID": "SN",
        "name": "Senegal"
    },
    {
        "ID": "SO",
        "name": "Somalia"
    },
    {
        "ID": "SR",
        "name": "Suriname"
    },
    {
        "ID": "SS",
        "name": "South Sudan"
    },
    {
        "ID": "ST",
        "name": "São Tomé & Príncipe"
    },
    {
        "ID": "SV",
        "name": "El Salvador"
    },
    {
        "ID": "SX",
        "name": "Sint Maarten"
    },
    {
        "ID": "SY",
        "name": "Syria"
    },
    {
        "ID": "SZ",
        "name": "Swaziland"
    },
    {
        "ID": "TC",
        "name": "Turks & Caicos Islands"
    },
    {
        "ID": "TD",
        "name": "Chad"
    },
    {
        "ID": "TF",
        "name": "French Southern Territories"
    },
    {
        "ID": "TG",
        "name": "Togo"
    },
    {
        "ID": "TH",
        "name": "Thailand"
    },
    {
        "ID": "TJ",
        "name": "Tajikistan"
    },
    {
        "ID": "TK",
        "name": "Tokelau"
    },
    {
        "ID": "TL",
        "name": "Timor-Leste"
    },
    {
        "ID": "TM",
        "name": "Turkmenistan"
    },
    {
        "ID": "TN",
        "name": "Tunisia"
    },
    {
        "ID": "TO",
        "name": "Tonga"
    },
    {
        "ID": "TR",
        "name": "Turkey"
    },
    {
        "ID": "TT",
        "name": "Trinidad & Tobago"
    },
    {
        "ID": "TV",
        "name": "Tuvalu"
    },
    {
        "ID": "TW",
        "name": "Taiwan"
    },
    {
        "ID": "TZ",
        "name": "Tanzania"
    },
    {
        "ID": "UA",
        "name": "Ukraine"
    },
    {
        "ID": "UG",
        "name": "Uganda"
    },
    {
        "ID": "UM",
        "name": "U.S. Outlying Islands"
    },
    {
        "ID": "US",
        "name": "United States"
    },
    {
        "ID": "UY",
        "name": "Uruguay"
    },
    {
        "ID": "UZ",
        "name": "Uzbekistan"
    },
    {
        "ID": "VA",
        "name": "Vatican City"
    },
    {
        "ID": "VC",
        "name": "St. Vincent & Grenadines"
    },
    {
        "ID": "VE",
        "name": "Venezuela"
    },
    {
        "ID": "VG",
        "name": "British Virgin Islands"
    },
    {
        "ID": "VI",
        "name": "U.S. Virgin Islands"
    },
    {
        "ID": "VN",
        "name": "Vietnam"
    },
    {
        "ID": "VU",
        "name": "Vanuatu"
    },
    {
        "ID": "WF",
        "name": "Wallis & Futuna"
    },
    {
        "ID": "WS",
        "name": "Samoa"
    },
    {
        "ID": "YE",
        "name": "Yemen"
    },
    {
        "ID": "YT",
        "name": "Mayotte"
    },
    {
        "ID": "ZA",
        "name": "South Africa"
    },
    {
        "ID": "ZM",
        "name": "Zambia"
    },
    {
        "ID": "ZW",
        "name": "Zimbabwe"
    }
];

export default Countries;