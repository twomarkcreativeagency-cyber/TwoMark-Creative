import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from '../components/ui/card';

const Ayarlar = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('ayarlar')}</h1>
        <p className="text-gray-600 mt-1">Sistem ayarları</p>
      </div>

      <Card className="p-6">
        <p className="text-gray-700">Ayarlar sayfası</p>
      </Card>
    </div>
  );
};

export default Ayarlar;
