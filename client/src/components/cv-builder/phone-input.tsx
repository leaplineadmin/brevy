import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { detectCountry, clearCountryCache, debugDetectCountry } from "@/utils/geo-detection";
import { useLanguage } from "@/contexts/LanguageContext";

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

interface PhoneInputProps {
  value: string;
  countryCode: string;
  onPhoneChange: (phone: string) => void;
  onCountryChange: (countryCode: string) => void;
}

const countries: Country[] = [
  { code: 'AD', name: 'Andorra', dialCode: '+376', flag: '🇦🇩' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { code: 'AF', name: 'Afghanistan', dialCode: '+93', flag: '🇦🇫' },
  { code: 'AG', name: 'Antigua and Barbuda', dialCode: '+1268', flag: '🇦🇬' },
  { code: 'AI', name: 'Anguilla', dialCode: '+1264', flag: '🇦🇮' },
  { code: 'AL', name: 'Albania', dialCode: '+355', flag: '🇦🇱' },
  { code: 'AM', name: 'Armenia', dialCode: '+374', flag: '🇦🇲' },
  { code: 'AO', name: 'Angola', dialCode: '+244', flag: '🇦🇴' },
  { code: 'AQ', name: 'Antarctica', dialCode: '+672', flag: '🇦🇶' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'AS', name: 'American Samoa', dialCode: '+1684', flag: '🇦🇸' },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'AW', name: 'Aruba', dialCode: '+297', flag: '🇦🇼' },
  { code: 'AX', name: 'Åland Islands', dialCode: '+358', flag: '🇦🇽' },
  { code: 'AZ', name: 'Azerbaijan', dialCode: '+994', flag: '🇦🇿' },
  { code: 'BA', name: 'Bosnia and Herzegovina', dialCode: '+387', flag: '🇧🇦' },
  { code: 'BB', name: 'Barbados', dialCode: '+1246', flag: '🇧🇧' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪' },
  { code: 'BF', name: 'Burkina Faso', dialCode: '+226', flag: '🇧🇫' },
  { code: 'BG', name: 'Bulgaria', dialCode: '+359', flag: '🇧🇬' },
  { code: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭' },
  { code: 'BI', name: 'Burundi', dialCode: '+257', flag: '🇧🇮' },
  { code: 'BJ', name: 'Benin', dialCode: '+229', flag: '🇧🇯' },
  { code: 'BL', name: 'Saint Barthélemy', dialCode: '+590', flag: '🇧🇱' },
  { code: 'BM', name: 'Bermuda', dialCode: '+1441', flag: '🇧🇲' },
  { code: 'BN', name: 'Brunei', dialCode: '+673', flag: '🇧🇳' },
  { code: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴' },
  { code: 'BQ', name: 'Caribbean Netherlands', dialCode: '+599', flag: '🇧🇶' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'BS', name: 'Bahamas', dialCode: '+1242', flag: '🇧🇸' },
  { code: 'BT', name: 'Bhutan', dialCode: '+975', flag: '🇧🇹' },
  { code: 'BV', name: 'Bouvet Island', dialCode: '+47', flag: '🇧🇻' },
  { code: 'BW', name: 'Botswana', dialCode: '+267', flag: '🇧🇼' },
  { code: 'BY', name: 'Belarus', dialCode: '+375', flag: '🇧🇾' },
  { code: 'BZ', name: 'Belize', dialCode: '+501', flag: '🇧🇿' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'CC', name: 'Cocos Islands', dialCode: '+61', flag: '🇨🇨' },
  { code: 'CD', name: 'Congo (DRC)', dialCode: '+243', flag: '🇨🇩' },
  { code: 'CF', name: 'Central African Republic', dialCode: '+236', flag: '🇨🇫' },
  { code: 'CG', name: 'Congo', dialCode: '+242', flag: '🇨🇬' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭' },
  { code: 'CI', name: 'Côte d\'Ivoire', dialCode: '+225', flag: '🇨🇮' },
  { code: 'CK', name: 'Cook Islands', dialCode: '+682', flag: '🇨🇰' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { code: 'CM', name: 'Cameroon', dialCode: '+237', flag: '🇨🇲' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
  { code: 'CR', name: 'Costa Rica', dialCode: '+506', flag: '🇨🇷' },
  { code: 'CU', name: 'Cuba', dialCode: '+53', flag: '🇨🇺' },
  { code: 'CV', name: 'Cape Verde', dialCode: '+238', flag: '🇨🇻' },
  { code: 'CW', name: 'Curaçao', dialCode: '+599', flag: '🇨🇼' },
  { code: 'CX', name: 'Christmas Island', dialCode: '+61', flag: '🇨🇽' },
  { code: 'CY', name: 'Cyprus', dialCode: '+357', flag: '🇨🇾' },
  { code: 'CZ', name: 'Czech Republic', dialCode: '+420', flag: '🇨🇿' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'DJ', name: 'Djibouti', dialCode: '+253', flag: '🇩🇯' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰' },
  { code: 'DM', name: 'Dominica', dialCode: '+1767', flag: '🇩🇲' },
  { code: 'DO', name: 'Dominican Republic', dialCode: '+1809', flag: '🇩🇴' },
  { code: 'DZ', name: 'Algeria', dialCode: '+213', flag: '🇩🇿' },
  { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨' },
  { code: 'EE', name: 'Estonia', dialCode: '+372', flag: '🇪🇪' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬' },
  { code: 'EH', name: 'Western Sahara', dialCode: '+212', flag: '🇪🇭' },
  { code: 'ER', name: 'Eritrea', dialCode: '+291', flag: '🇪🇷' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { code: 'ET', name: 'Ethiopia', dialCode: '+251', flag: '🇪🇹' },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮' },
  { code: 'FJ', name: 'Fiji', dialCode: '+679', flag: '🇫🇯' },
  { code: 'FK', name: 'Falkland Islands', dialCode: '+500', flag: '🇫🇰' },
  { code: 'FM', name: 'Micronesia', dialCode: '+691', flag: '🇫🇲' },
  { code: 'FO', name: 'Faroe Islands', dialCode: '+298', flag: '🇫🇴' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'GA', name: 'Gabon', dialCode: '+241', flag: '🇬🇦' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'GD', name: 'Grenada', dialCode: '+1473', flag: '🇬🇩' },
  { code: 'GE', name: 'Georgia', dialCode: '+995', flag: '🇬🇪' },
  { code: 'GF', name: 'French Guiana', dialCode: '+594', flag: '🇬🇫' },
  { code: 'GG', name: 'Guernsey', dialCode: '+44', flag: '🇬🇬' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭' },
  { code: 'GI', name: 'Gibraltar', dialCode: '+350', flag: '🇬🇮' },
  { code: 'GL', name: 'Greenland', dialCode: '+299', flag: '🇬🇱' },
  { code: 'GM', name: 'Gambia', dialCode: '+220', flag: '🇬🇲' },
  { code: 'GN', name: 'Guinea', dialCode: '+224', flag: '🇬🇳' },
  { code: 'GP', name: 'Guadeloupe', dialCode: '+590', flag: '🇬🇵' },
  { code: 'GQ', name: 'Equatorial Guinea', dialCode: '+240', flag: '🇬🇶' },
  { code: 'GR', name: 'Greece', dialCode: '+30', flag: '🇬🇷' },
  { code: 'GS', name: 'South Georgia', dialCode: '+500', flag: '🇬🇸' },
  { code: 'GT', name: 'Guatemala', dialCode: '+502', flag: '🇬🇹' },
  { code: 'GU', name: 'Guam', dialCode: '+1671', flag: '🇬🇺' },
  { code: 'GW', name: 'Guinea-Bissau', dialCode: '+245', flag: '🇬🇼' },
  { code: 'GY', name: 'Guyana', dialCode: '+592', flag: '🇬🇾' },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852', flag: '🇭🇰' },
  { code: 'HM', name: 'Heard Island', dialCode: '+672', flag: '🇭🇲' },
  { code: 'HN', name: 'Honduras', dialCode: '+504', flag: '🇭🇳' },
  { code: 'HR', name: 'Croatia', dialCode: '+385', flag: '🇭🇷' },
  { code: 'HT', name: 'Haiti', dialCode: '+509', flag: '🇭🇹' },
  { code: 'HU', name: 'Hungary', dialCode: '+36', flag: '🇭🇺' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪' },
  { code: 'IL', name: 'Israel', dialCode: '+972', flag: '🇮🇱' },
  { code: 'IM', name: 'Isle of Man', dialCode: '+44', flag: '🇮🇲' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'IO', name: 'British Indian Ocean Territory', dialCode: '+246', flag: '🇮🇴' },
  { code: 'IQ', name: 'Iraq', dialCode: '+964', flag: '🇮🇶' },
  { code: 'IR', name: 'Iran', dialCode: '+98', flag: '🇮🇷' },
  { code: 'IS', name: 'Iceland', dialCode: '+354', flag: '🇮🇸' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { code: 'JE', name: 'Jersey', dialCode: '+44', flag: '🇯🇪' },
  { code: 'JM', name: 'Jamaica', dialCode: '+1876', flag: '🇯🇲' },
  { code: 'JO', name: 'Jordan', dialCode: '+962', flag: '🇯🇴' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
  { code: 'KG', name: 'Kyrgyzstan', dialCode: '+996', flag: '🇰🇬' },
  { code: 'KH', name: 'Cambodia', dialCode: '+855', flag: '🇰🇭' },
  { code: 'KI', name: 'Kiribati', dialCode: '+686', flag: '🇰🇮' },
  { code: 'KM', name: 'Comoros', dialCode: '+269', flag: '🇰🇲' },
  { code: 'KN', name: 'Saint Kitts and Nevis', dialCode: '+1869', flag: '🇰🇳' },
  { code: 'KP', name: 'North Korea', dialCode: '+850', flag: '🇰🇵' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼' },
  { code: 'KY', name: 'Cayman Islands', dialCode: '+1345', flag: '🇰🇾' },
  { code: 'KZ', name: 'Kazakhstan', dialCode: '+7', flag: '🇰🇿' },
  { code: 'LA', name: 'Laos', dialCode: '+856', flag: '🇱🇦' },
  { code: 'LB', name: 'Lebanon', dialCode: '+961', flag: '🇱🇧' },
  { code: 'LC', name: 'Saint Lucia', dialCode: '+1758', flag: '🇱🇨' },
  { code: 'LI', name: 'Liechtenstein', dialCode: '+423', flag: '🇱🇮' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰' },
  { code: 'LR', name: 'Liberia', dialCode: '+231', flag: '🇱🇷' },
  { code: 'LS', name: 'Lesotho', dialCode: '+266', flag: '🇱🇸' },
  { code: 'LT', name: 'Lithuania', dialCode: '+370', flag: '🇱🇹' },
  { code: 'LU', name: 'Luxembourg', dialCode: '+352', flag: '🇱🇺' },
  { code: 'LV', name: 'Latvia', dialCode: '+371', flag: '🇱🇻' },
  { code: 'LY', name: 'Libya', dialCode: '+218', flag: '🇱🇾' },
  { code: 'MA', name: 'Morocco', dialCode: '+212', flag: '🇲🇦' },
  { code: 'MC', name: 'Monaco', dialCode: '+377', flag: '🇲🇨' },
  { code: 'MD', name: 'Moldova', dialCode: '+373', flag: '🇲🇩' },
  { code: 'ME', name: 'Montenegro', dialCode: '+382', flag: '🇲🇪' },
  { code: 'MF', name: 'Saint Martin', dialCode: '+590', flag: '🇲🇫' },
  { code: 'MG', name: 'Madagascar', dialCode: '+261', flag: '🇲🇬' },
  { code: 'MH', name: 'Marshall Islands', dialCode: '+692', flag: '🇲🇭' },
  { code: 'MK', name: 'North Macedonia', dialCode: '+389', flag: '🇲🇰' },
  { code: 'ML', name: 'Mali', dialCode: '+223', flag: '🇲🇱' },
  { code: 'MM', name: 'Myanmar', dialCode: '+95', flag: '🇲🇲' },
  { code: 'MN', name: 'Mongolia', dialCode: '+976', flag: '🇲🇳' },
  { code: 'MO', name: 'Macao', dialCode: '+853', flag: '🇲🇴' },
  { code: 'MP', name: 'Northern Mariana Islands', dialCode: '+1670', flag: '🇲🇵' },
  { code: 'MQ', name: 'Martinique', dialCode: '+596', flag: '🇲🇶' },
  { code: 'MR', name: 'Mauritania', dialCode: '+222', flag: '🇲🇷' },
  { code: 'MS', name: 'Montserrat', dialCode: '+1664', flag: '🇲🇸' },
  { code: 'MT', name: 'Malta', dialCode: '+356', flag: '🇲🇹' },
  { code: 'MU', name: 'Mauritius', dialCode: '+230', flag: '🇲🇺' },
  { code: 'MV', name: 'Maldives', dialCode: '+960', flag: '🇲🇻' },
  { code: 'MW', name: 'Malawi', dialCode: '+265', flag: '🇲🇼' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
  { code: 'MZ', name: 'Mozambique', dialCode: '+258', flag: '🇲🇿' },
  { code: 'NA', name: 'Namibia', dialCode: '+264', flag: '🇳🇦' },
  { code: 'NC', name: 'New Caledonia', dialCode: '+687', flag: '🇳🇨' },
  { code: 'NE', name: 'Niger', dialCode: '+227', flag: '🇳🇪' },
  { code: 'NF', name: 'Norfolk Island', dialCode: '+672', flag: '🇳🇫' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
  { code: 'NI', name: 'Nicaragua', dialCode: '+505', flag: '🇳🇮' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱' },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴' },
  { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵' },
  { code: 'NR', name: 'Nauru', dialCode: '+674', flag: '🇳🇷' },
  { code: 'NU', name: 'Niue', dialCode: '+683', flag: '🇳🇺' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿' },
  { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲' },
  { code: 'PA', name: 'Panama', dialCode: '+507', flag: '🇵🇦' },
  { code: 'PE', name: 'Peru', dialCode: '+51', flag: '🇵🇪' },
  { code: 'PF', name: 'French Polynesia', dialCode: '+689', flag: '🇵🇫' },
  { code: 'PG', name: 'Papua New Guinea', dialCode: '+675', flag: '🇵🇬' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱' },
  { code: 'PM', name: 'Saint Pierre and Miquelon', dialCode: '+508', flag: '🇵🇲' },
  { code: 'PN', name: 'Pitcairn', dialCode: '+64', flag: '🇵🇳' },
  { code: 'PR', name: 'Puerto Rico', dialCode: '+1787', flag: '🇵🇷' },
  { code: 'PS', name: 'Palestine', dialCode: '+970', flag: '🇵🇸' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
  { code: 'PW', name: 'Palau', dialCode: '+680', flag: '🇵🇼' },
  { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦' },
  { code: 'RE', name: 'Réunion', dialCode: '+262', flag: '🇷🇪' },
  { code: 'RO', name: 'Romania', dialCode: '+40', flag: '🇷🇴' },
  { code: 'RS', name: 'Serbia', dialCode: '+381', flag: '🇷🇸' },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺' },
  { code: 'RW', name: 'Rwanda', dialCode: '+250', flag: '🇷🇼' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'SB', name: 'Solomon Islands', dialCode: '+677', flag: '🇸🇧' },
  { code: 'SC', name: 'Seychelles', dialCode: '+248', flag: '🇸🇨' },
  { code: 'SD', name: 'Sudan', dialCode: '+249', flag: '🇸🇩' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { code: 'SH', name: 'Saint Helena', dialCode: '+290', flag: '🇸🇭' },
  { code: 'SI', name: 'Slovenia', dialCode: '+386', flag: '🇸🇮' },
  { code: 'SJ', name: 'Svalbard and Jan Mayen', dialCode: '+47', flag: '🇸🇯' },
  { code: 'SK', name: 'Slovakia', dialCode: '+421', flag: '🇸🇰' },
  { code: 'SL', name: 'Sierra Leone', dialCode: '+232', flag: '🇸🇱' },
  { code: 'SM', name: 'San Marino', dialCode: '+378', flag: '🇸🇲' },
  { code: 'SN', name: 'Senegal', dialCode: '+221', flag: '🇸🇳' },
  { code: 'SO', name: 'Somalia', dialCode: '+252', flag: '🇸🇴' },
  { code: 'SR', name: 'Suriname', dialCode: '+597', flag: '🇸🇷' },
  { code: 'SS', name: 'South Sudan', dialCode: '+211', flag: '🇸🇸' },
  { code: 'ST', name: 'São Tomé and Príncipe', dialCode: '+239', flag: '🇸🇹' },
  { code: 'SV', name: 'El Salvador', dialCode: '+503', flag: '🇸🇻' },
  { code: 'SX', name: 'Sint Maarten', dialCode: '+1721', flag: '🇸🇽' },
  { code: 'SY', name: 'Syria', dialCode: '+963', flag: '🇸🇾' },
  { code: 'SZ', name: 'Eswatini', dialCode: '+268', flag: '🇸🇿' },
  { code: 'TC', name: 'Turks and Caicos Islands', dialCode: '+1649', flag: '🇹🇨' },
  { code: 'TD', name: 'Chad', dialCode: '+235', flag: '🇹🇩' },
  { code: 'TF', name: 'French Southern Territories', dialCode: '+262', flag: '🇹🇫' },
  { code: 'TG', name: 'Togo', dialCode: '+228', flag: '🇹🇬' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭' },
  { code: 'TJ', name: 'Tajikistan', dialCode: '+992', flag: '🇹🇯' },
  { code: 'TK', name: 'Tokelau', dialCode: '+690', flag: '🇹🇰' },
  { code: 'TL', name: 'Timor-Leste', dialCode: '+670', flag: '🇹🇱' },
  { code: 'TM', name: 'Turkmenistan', dialCode: '+993', flag: '🇹🇲' },
  { code: 'TN', name: 'Tunisia', dialCode: '+216', flag: '🇹🇳' },
  { code: 'TO', name: 'Tonga', dialCode: '+676', flag: '🇹🇴' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷' },
  { code: 'TT', name: 'Trinidad and Tobago', dialCode: '+1868', flag: '🇹🇹' },
  { code: 'TV', name: 'Tuvalu', dialCode: '+688', flag: '🇹🇻' },
  { code: 'TW', name: 'Taiwan', dialCode: '+886', flag: '🇹🇼' },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255', flag: '🇹🇿' },
  { code: 'UA', name: 'Ukraine', dialCode: '+380', flag: '🇺🇦' },
  { code: 'UG', name: 'Uganda', dialCode: '+256', flag: '🇺🇬' },
  { code: 'UM', name: 'U.S. Minor Outlying Islands', dialCode: '+1', flag: '🇺🇲' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾' },
  { code: 'UZ', name: 'Uzbekistan', dialCode: '+998', flag: '🇺🇿' },
  { code: 'VA', name: 'Vatican City', dialCode: '+39', flag: '🇻🇦' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', dialCode: '+1784', flag: '🇻🇨' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪' },
  { code: 'VG', name: 'British Virgin Islands', dialCode: '+1284', flag: '🇻🇬' },
  { code: 'VI', name: 'U.S. Virgin Islands', dialCode: '+1340', flag: '🇻🇮' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳' },
  { code: 'VU', name: 'Vanuatu', dialCode: '+678', flag: '🇻🇺' },
  { code: 'WF', name: 'Wallis and Futuna', dialCode: '+681', flag: '🇼🇫' },
  { code: 'WS', name: 'Samoa', dialCode: '+685', flag: '🇼🇸' },
  { code: 'YE', name: 'Yemen', dialCode: '+967', flag: '🇾🇪' },
  { code: 'YT', name: 'Mayotte', dialCode: '+262', flag: '🇾🇹' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  { code: 'ZM', name: 'Zambia', dialCode: '+260', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe', dialCode: '+263', flag: '🇿🇼' },
];

// Formatage automatique du numéro selon le pays
const formatPhoneNumber = (phone: string, countryCode: string): string => {
  // Supprimer tout ce qui n'est pas un chiffre
  const digits = phone.replace(/\D/g, '');
  
  // Formatage spécifique par pays
  switch (countryCode) {
    case 'FR': // France: 01 23 45 67 89
      if (digits.length <= 2) return digits;
      if (digits.length <= 4) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
      if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)}`;
      if (digits.length <= 8) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6)}`;
      return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
    
    case 'US': // États-Unis: (123) 456-7890
    case 'CA': // Canada: (123) 456-7890
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    
    case 'GB': // Royaume-Uni: 01234 567890
      if (digits.length <= 5) return digits;
      return `${digits.slice(0, 5)} ${digits.slice(5, 11)}`;
    
    case 'DE': // Allemagne: 030 12345678
      if (digits.length <= 3) return digits;
      if (digits.length <= 4) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    
    case 'IT': // Italie: 06 1234 5678
      if (digits.length <= 2) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
      return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6, 10)}`;
    
    case 'ES': // Espagne: 91 123 45 67
      if (digits.length <= 2) return digits;
      if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
      if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
      return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
    
    case 'GR': // Grèce: 123 456 7890
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
    
    case 'NL': // Pays-Bas: 06-12345678
      if (digits.length <= 2) return digits;
      return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    
    case 'BE': // Belgique: 0123 45 67 89
      if (digits.length <= 4) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
      if (digits.length <= 8) return `${digits.slice(0, 4)} ${digits.slice(4, 6)} ${digits.slice(6)}`;
      return `${digits.slice(0, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
    
    case 'CH': // Suisse: 012 345 67 89
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      if (digits.length <= 8) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
    
    case 'JP': // Japon: 03-1234-5678
      if (digits.length <= 2) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
    
    case 'AU': // Australie: 02 1234 5678
      if (digits.length <= 2) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
      return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6, 10)}`;
    
    default:
      // Format générique pour les autres pays
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
};

// Validation de la longueur selon le pays
const getMaxLength = (countryCode: string): number => {
  switch (countryCode) {
    case 'FR': return 10;
    case 'US':
    case 'CA': return 10;
    case 'GB': return 11;
    case 'DE': return 11;
    case 'IT': return 10;
    case 'ES': return 9;
    case 'GR': return 10;
    case 'NL': return 9;
    case 'BE': return 9;
    case 'CH': return 9;
    case 'JP': return 10;
    case 'AU': return 9;
    default: return 15;
  }
};

// Placeholder adapté selon le pays
const getPlaceholder = (countryCode: string): string => {
  switch (countryCode) {
    case 'FR': return '6 12 34 56 78';
    case 'US':
    case 'CA': return '(123) 456-7890';
    case 'GB': return '01234 567890';
    case 'DE': return '030 12345678';
    case 'IT': return '06 1234 5678';
    case 'ES': return '91 123 45 67';
    case 'GR': return '123 456 7890';
    case 'NL': return '06-12345678';
    case 'BE': return '0123 45 67 89';
    case 'CH': return '012 345 67 89';
    case 'JP': return '03-1234-5678';
    case 'AU': return '02 1234 5678';
    default: return '123 456 789';
  }
};

export function PhoneInput({ value, countryCode, onPhoneChange, onCountryChange }: PhoneInputProps) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('');
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Trouver le pays sélectionné
  const selectedCountry = (() => {
    // Si on a un code de pays sélectionné localement, l'utiliser
    if (selectedCountryCode) {
      const found = countries.find(c => c.code === selectedCountryCode);
      if (found) return found;
    }
    
    // Sinon, essayer de trouver par dialCode avec logique de préférence
    let found = countries.find(c => c.dialCode === countryCode);
    
    // Logique de préférence pour les codes partagés
    if (countryCode === '+1') {
      found = countries.find(c => c.code === 'US') || countries.find(c => c.dialCode === '+1');
    } else if (countryCode === '+61') {
      found = countries.find(c => c.code === 'AU') || countries.find(c => c.dialCode === '+61');
    } else if (countryCode === '+7') {
      found = countries.find(c => c.code === 'RU') || countries.find(c => c.dialCode === '+7');
    }
    
    return found || countries[0];
  })();
  
  if (!selectedCountry) {
    return <div>Loading phone input...</div>;
  }
  const filteredCountries = countries
    .filter(country =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.dialCode.includes(searchTerm)
    )
    .filter(country => country.code !== selectedCountry.code) // Exclure le pays sélectionné
    .sort((a, b) => a.name.localeCompare(b.name)); // Trier par ordre alphabétique

  // Initialiser le code du pays sélectionné
  useEffect(() => {
    if (!selectedCountryCode && selectedCountry) {
      setSelectedCountryCode(selectedCountry.code);
    }
  }, [selectedCountry, selectedCountryCode]);

  // Initialiser avec le pays de l'utilisateur
  useEffect(() => {
    // Toujours essayer la détection au montage pour s'assurer qu'on a le bon pays
    
    // Clear cache pour forcer une nouvelle détection
    clearCountryCache();
    
    debugDetectCountry().then(userCountry => {
      const country = countries.find(c => c.code === userCountry);
      
      if (country) {
        // Toujours mettre à jour si on détecte un pays différent
        if (countryCode !== country.dialCode) {
          setSelectedCountryCode(country.code);
          onCountryChange(country.dialCode);
        } else {
          setSelectedCountryCode(country.code);
        }
      } else {
        // Fallback: FR si langue fr, sinon US
        const fallbackCode = language === 'fr' ? 'FR' : 'US';
        const fallbackCountry = countries.find(c => c.code === fallbackCode);
        if (fallbackCountry && countryCode !== fallbackCountry.dialCode) {
          setSelectedCountryCode(fallbackCountry.code);
          onCountryChange(fallbackCountry.dialCode);
        }
      }
    }).catch(error => {
      // En cas d'erreur, fallback basé sur la langue
      const fallbackCode = language === 'fr' ? 'FR' : 'US';
      const fallbackCountry = countries.find(c => c.code === fallbackCode);
      if (fallbackCountry && countryCode !== fallbackCountry.dialCode) {
        setSelectedCountryCode(fallbackCountry.code);
        onCountryChange(fallbackCountry.dialCode);
      }
    });
  }, [language]); // Réagir si la langue change pour ajuster le fallback

  const handlePhoneInput = (inputValue: string) => {
    // Ne permettre que les chiffres
    const digitsOnly = inputValue.replace(/\D/g, '');
    const maxLength = getMaxLength(selectedCountry.code);
    
    // Vérifier la longueur
    if (digitsOnly.length > maxLength) {
      setIsError(true);
      setErrorMessage('Phone number seems too long');
    } else {
      setIsError(false);
      setErrorMessage('');
    }
    
    // Formater et mettre à jour
    const formatted = formatPhoneNumber(digitsOnly, selectedCountry.code);
    onPhoneChange(formatted);
  };

  const updateDropdownPosition = () => {
    if (buttonRef.current && typeof window !== 'undefined') {
      const rect = buttonRef.current.getBoundingClientRect();
      const parentRect = buttonRef.current.closest('.cv-section-content')?.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + (window.scrollY || 0),
        left: rect.left + (window.scrollX || 0),
        width: parentRect ? parentRect.width : 400
      });
    }
  };

  const handleCountrySelect = (country: Country) => {
    // Stocker le code du pays sélectionné localement
    setSelectedCountryCode(country.code);
    onCountryChange(country.dialCode);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggleDropdown = () => {
    if (!isOpen) {
      updateDropdownPosition();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative w-full">
      <div className="flex w-full">
        {/* Sélecteur de pays */}
        <div className="relative">
          <Button
            ref={buttonRef}
            type="button"
            variant="outline"
            className="h-[var(--input-height)] px-3 rounded-r-none border-r-0 text-gray-500"
            onClick={handleToggleDropdown}
          >
            <span className="flex items-center gap-1">
              <span>{selectedCountry.flag}</span>
              <span>{selectedCountry.dialCode}</span>
              <ChevronDown className="h-4 w-4 ml-1" />
            </span>
          </Button>
          

        </div>
        
        {/* Input du numéro */}
        <Input
          id="phone"
          type="tel"
          value={value}
          onChange={(e) => handlePhoneInput(e.target.value)}
          placeholder={getPlaceholder(selectedCountry.code)}
          className={`flex-1 rounded-l-none ${isError ? '' : ''}`}
          style={isError ? { borderColor: 'var(--danger)', height: 'var(--input-height)' } : { height: 'var(--input-height)' }}
          autoComplete="tel"
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
          data-bwignore
        />
      </div>
      
      {/* Message d'erreur */}
      {isError && (
        <div className="text-xs mt-1" style={{ color: 'var(--danger)' }}>
          {errorMessage}
        </div>
      )}
      
      {/* Dropdown des pays rendu via portal */}
      {isOpen && createPortal(
        <>
          {/* Overlay pour fermer le dropdown */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div 
            className="fixed z-[9999] bg-white border border-lightGrey rounded-md shadow-lg max-h-60 overflow-auto"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              minWidth: '320px',
              maxWidth: '400px'
            }}
          >
            <div className="p-2 border-b">
              <Input
                placeholder="Rechercher un pays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8"
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
                data-bwignore
              />
            </div>
            
            {/* Pays sélectionné en premier */}
            <div
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b bg-gray-50"
              onClick={() => handleCountrySelect(selectedCountry)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{selectedCountry.flag}</span>
                  <span className="font-medium">{selectedCountry.name}</span>
                </div>
                <span className="text-gray-600">{selectedCountry.dialCode}</span>
              </div>
            </div>
            
            {/* Tous les pays */}
            <div className="px-3 py-1 text-xs text-gray-500 bg-gray-50">Tous les pays</div>
            
            {filteredCountries.map((country) => (
              <div
                key={country.code}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleCountrySelect(country)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{country.flag}</span>
                    <span>{country.name}</span>
                  </div>
                  <span className="text-gray-600">{country.dialCode}</span>
                </div>
              </div>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}