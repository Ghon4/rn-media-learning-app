import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

import { en, es } from './translations';

const i18n = new I18n({ en, es });

const locale = Localization.getLocales()[0]?.languageCode ?? 'en';
i18n.locale = locale === 'es' ? 'es' : 'en';
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export { i18n };
