import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from '../components/ui/card';

const Gorsellik = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('gorsellikTitle')}</h1>
        <p className="text-gray-600 mt-1">{t('gorsellikSubtitle')}</p>
      </div>

      <Card className="p-6">
        <p className="text-gray-700">Görsellik - Logo yükleme ve renk özelleştirme</p>
      </Card>
    </div>
  );
};

export default Gorsellik;
