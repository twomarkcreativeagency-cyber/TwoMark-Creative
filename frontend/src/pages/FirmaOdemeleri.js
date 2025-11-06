import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';

const FirmaOdemeleri = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('firmaOdemeleriTitle')}</h1>
          <p className="text-gray-600 mt-1">{t('firmaOdemeleriSubtitle')}</p>
        </div>
        <Button className="bg-accent hover:bg-accent/90 text-black">
          <Plus className="w-4 h-4 mr-2" />
          {t('yeniOdeme')}
        </Button>
      </div>

      <Card className="p-6">
        <p className="text-gray-700">Firma Ödemeleri sayfası - Tüm tutarlar ₺ olarak gösterilecek</p>
      </Card>
    </div>
  );
};

export default FirmaOdemeleri;
