import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from '../components/ui/card';

const FirmaTakvimi = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('firmaTakvimiTitle')}</h1>
        <p className="text-gray-600 mt-1">{t('firmaTakvimiSubtitle')}</p>
      </div>

      <Card className="p-6">
        <p className="text-gray-700">Firma Takvimi - Firma renkleri ile etkinlikler gösterilecek</p>
      </Card>
    </div>
  );
};

export default FirmaTakvimi;
