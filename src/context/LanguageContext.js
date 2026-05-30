import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../i18n/translations';

const LANG_KEY = '@gostock_lang_v2';           // 'km' | 'en'
const CURR_KEY = '@gostock_currency_v2';        // 'USD' | 'KHR'
const RATE_KEY = '@gostock_exchange_rate_v2';   // number string, default '4000'

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState('km');   // Default: Khmer
  const [currency, setCurrencyState] = useState('KHR'); // Default: Khmer Riel
  const [exchangeRate, setExchangeRateState] = useState(4000); // Default 4000 ៛ per $1
  const [loaded, setLoaded] = useState(false);

  // Load saved preferences — defaults to Khmer + KHR if no saved value
  useEffect(() => {
    (async () => {
      try {
        const [savedLang, savedCurrency, savedRate] = await Promise.all([
          AsyncStorage.getItem(LANG_KEY),
          AsyncStorage.getItem(CURR_KEY),
          AsyncStorage.getItem(RATE_KEY),
        ]);
        if (savedLang === 'km' || savedLang === 'en') {
          setLocale(savedLang);
        } else {
          // First launch — persist the Khmer default
          await AsyncStorage.setItem(LANG_KEY, 'km');
        }
        if (savedCurrency === 'USD' || savedCurrency === 'KHR') {
          setCurrencyState(savedCurrency);
        } else {
          // First launch — persist the KHR default
          await AsyncStorage.setItem(CURR_KEY, 'KHR');
        }
        if (savedRate) {
          const parsed = parseFloat(savedRate);
          if (!isNaN(parsed) && parsed > 0) {
            setExchangeRateState(parsed);
          }
        } else {
          // First launch — persist the default exchange rate
          await AsyncStorage.setItem(RATE_KEY, '4000');
        }
      } catch (_) {}
      setLoaded(true);
    })();
  }, []);

  const changeLanguage = useCallback(async (newLang) => {
    if (newLang === 'km' || newLang === 'en') {
      setLocale(newLang);
      try {
        await AsyncStorage.setItem(LANG_KEY, newLang);
      } catch (_) {}
    }
  }, []);

  const changeCurrency = useCallback(async (newCur) => {
    if (newCur === 'USD' || newCur === 'KHR') {
      setCurrencyState(newCur);
      try {
        await AsyncStorage.setItem(CURR_KEY, newCur);
      } catch (_) {}
    }
  }, []);

  /**
   * Persist a new exchange rate. Accepts a number or numeric string.
   * Silently ignores invalid values (keeps the previous rate).
   */
  const changeExchangeRate = useCallback(async (newRate) => {
    const parsed = parseFloat(newRate);
    if (!isNaN(parsed) && parsed > 0) {
      setExchangeRateState(parsed);
      try {
        await AsyncStorage.setItem(RATE_KEY, String(parsed));
      } catch (_) {}
    }
  }, []);

  /**
   * Translate a key with parameter interpolation.
   * e.g., t('in_stock_label', { count: 5 })
   */
  const t = useCallback(
    (key, params = {}) => {
      const activeTranslations = translations[locale] || translations['km'];
      let text = activeTranslations[key];

      // Fallback to English if not found in active locale
      if (text === undefined) {
        text = translations['en']?.[key];
      }

      // Fallback to the key itself if not found anywhere
      if (text === undefined) {
        return key;
      }

      // Interpolate parameters
      let result = text;
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        result = result.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
      });

      return result;
    },
    [locale]
  );

  /**
   * Helper to translate standard category names.
   */
  const tCategory = useCallback(
    (categoryName) => {
      const mapping = {
        'General': 'cat_general',
        'Food & Drink': 'cat_food_drink',
        'Snacks': 'cat_snacks',
        'Electronics': 'cat_electronics',
        'Clothing': 'cat_clothing',
        'Household': 'cat_household',
        'Other': 'cat_other',
      };
      const translationKey = mapping[categoryName] || 'cat_general';
      return t(translationKey);
    },
    [t]
  );

  const formatCurrency = useCallback(
    (amount) => {
      if (amount === null || amount === undefined || isNaN(amount)) {
        return currency === 'USD' ? '$0.00' : '0 ៛';
      }
      if (currency === 'USD') {
        return `$${Number(amount).toFixed(2)}`;
      } else {
        const rielAmount = Math.round(Number(amount) * exchangeRate);
        return `${rielAmount.toLocaleString()} ៛`;
      }
    },
    [currency, exchangeRate]
  );

  if (!loaded) return null;

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLanguage: changeLanguage,
        currency,
        setCurrency: changeCurrency,
        exchangeRate,
        setExchangeRate: changeExchangeRate,
        formatCurrency,
        t,
        tCategory,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export function useCurrency() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useCurrency must be used within LanguageProvider');
  return ctx;
}
