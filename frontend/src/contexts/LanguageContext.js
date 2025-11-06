import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  tr: {
    // Auth
    signIn: 'Giriş Yap',
    username: 'Kullanıcı Adı',
    password: 'Şifre',
    enterUsername: 'Kullanıcı adınızı girin',
    enterPassword: 'Şifrenizi girin',
    signingIn: 'Giriş yapılıyor...',
    loginSuccessful: 'Giriş başarılı!',
    
    // Dashboard
    dashboard: 'Gösterge Paneli',
    adminDashboard: 'Yönetici Paneli',
    editorDashboard: 'Editör Paneli',
    companyDashboard: 'Firma Paneli',
    
    // Sidebar Menu
    mainFeed: 'Ana Akış',
    authorization: 'Yetkilendirme',
    profitTable: 'Kazanç Tablosu',
    companyCreate: 'Firmalar',
    companyFeed: 'Firma Akışı',
    companyCalendar: 'Firma Takvimi',
    sharedCalendar: 'Ortak Takvim',
    payments: 'Firma Ödemeleri',
    visuals: 'Görsellik',
    settings: 'Ayarlar',
    
    // Common
    create: 'Oluştur',
    edit: 'Düzenle',
    delete: 'Sil',
    save: 'Kaydet',
    cancel: 'İptal',
    search: 'Ara',
    filter: 'Filtrele',
    actions: 'İşlemler',
    status: 'Durum',
    date: 'Tarih',
    startDate: 'Başlangıç Tarihi',
    endDate: 'Bitiş Tarihi',
    amount: 'Tutar',
    description: 'Açıklama',
    notes: 'Notlar',
    company: 'Firma',
    companies: 'Firmalar',
    title: 'Başlık',
    content: 'İçerik',
    loading: 'Yükleniyor...',
    noData: 'Veri bulunamadı',
    
    // Main Feed
    mainFeedTitle: 'Ana Akış',
    mainFeedSubtitle: 'Paylaşılan güncellemeler ve duyurular',
    createPost: 'Gönderi Oluştur',
    newPost: 'Yeni Gönderi',
    feedType: 'Akış Tipi',
    targetCompanies: 'Hedef Firmalar',
    selectCompanies: 'Firma seçin',
    postTitle: 'Gönderi Başlığı',
    postContent: 'İçerik',
    whatsOnYourMind: 'Ne düşünüyorsunuz?',
    noPosts: 'Henüz gönderi yok. İlk gönderinizi oluşturun!',
    
    // Authorization
    authorizationTitle: 'Yetkilendirme',
    authorizationSubtitle: 'Kullanıcıları ve yetkileri yönetin',
    createUser: 'Kullanıcı Oluştur',
    newUser: 'Yeni Kullanıcı',
    fullName: 'Ad Soyad',
    role: 'Rol',
    permissions: 'Yetkiler',
    users: 'Kullanıcılar',
    noUsers: 'Henüz kullanıcı yok. İlk kullanıcınızı oluşturun!',
    admin: 'Yönetici',
    editor: 'Editör',
    companyUser: 'Firma Kullanıcısı',
    
    // Profit Table
    profitTableTitle: 'Kazanç Tablosu',
    profitTableSubtitle: 'Gelir ve giderlerinizi takip edin',
    addRecord: 'Kayıt Ekle',
    addProfitRecord: 'Gelir/Gider Kaydı Ekle',
    type: 'Tip',
    income: 'Gelir',
    expense: 'Gider',
    totalIncome: 'Toplam Gelir',
    totalExpense: 'Toplam Gider',
    netProfit: 'Net Kar',
    allRecords: 'Tüm Kayıtlar',
    monthlyView: 'Aylık Görünüm',
    yearlyView: 'Yıllık Görünüm',
    month: 'Ay',
    year: 'Yıl',
    net: 'Net',
    companyOptional: 'Firma (İsteğe Bağlı)',
    companyNameFreeText: 'Firma Adı (Serbest Metin)',
    selectCompanyOrLeaveBlank: 'Firma seçin veya boş bırakın',
    none: 'Yok',
    
    // Company Create
    companyManagement: 'Firma Yönetimi',
    companyManagementSubtitle: 'Firma hesaplarını oluşturun ve yönetin',
    createCompany: 'Firma Oluştur',
    newCompany: 'Yeni Firma',
    companyName: 'Firma Adı',
    brandColor: 'Marka Rengi (Hex)',
    contactInfo: 'İletişim Bilgisi',
    contactInfoOptional: 'İletişim Bilgisi (İsteğe Bağlı)',
    noCompanies: 'Henüz firma yok. İlk firmanızı oluşturun!',
    usedForCalendarAndTags: 'Takvim etkinlikleri ve etiketler için kullanılır',
    
    // Company Feed
    companyFeedTitle: 'Firma Akışı',
    companyFeedSubtitle: 'Firmanıza özel güncellemeler',
    companyFeedSubtitleAdmin: 'Firmaya özel güncellemeler ve duyurular',
    noCompanyPosts: 'Henüz firma gönderisi yok.',
    
    // Calendar
    sharedCalendarTitle: 'Ortak Takvim',
    sharedCalendarSubtitle: 'Ajans genelinde firma etkinlikleri takvimi',
    companyCalendarTitle: 'Firma Takvimi',
    companyCalendarSubtitle: 'Firmanızın etkinlikleri ve programı',
    companyCalendarSubtitleAdmin: 'Firmaya özel etkinlikleri yönetin',
    createEvent: 'Etkinlik Oluştur',
    createCalendarEvent: 'Takvim Etkinliği Oluştur',
    createCompanyEvent: 'Firma Etkinliği Oluştur',
    eventTitle: 'Etkinlik Başlığı',
    eventDescription: 'Etkinlik Açıklaması',
    startTime: 'Başlangıç Saati',
    endTime: 'Bitiş Saati',
    location: 'Konum',
    eventLocation: 'Etkinlik konumu',
    assignToCompany: 'Firmaya Ata (İsteğe Bağlı)',
    assignEditor: 'Editör Ata (İsteğe Bağlı)',
    eventColor: 'Etkinlik Rengi',
    eventsColorCoded: 'Etkinlikler firma marka rengi ile kodlanmıştır',
    
    // Payments
    paymentsTitle: 'Firma Ödemeleri',
    paymentsSubtitle: 'Firma ödemelerini yönetin',
    paymentsSubtitleCompany: 'Ödeme bilgileriniz',
    createPayment: 'Ödeme Oluştur',
    newPayment: 'Yeni Ödeme',
    paymentTitle: 'Ödeme Başlığı',
    totalToPay: 'Toplam Ödenecek',
    totalPaid: 'Toplam Ödenen',
    totalPayments: 'Toplam Ödemeler',
    toPay: 'Ödenecek',
    paid: 'Ödendi',
    markAsPaid: 'Ödendi Olarak İşaretle',
    markAsUnpaid: 'Ödenmedi Olarak İşaretle',
    noPendingPayments: 'Bekleyen ödeme yok',
    noPaidPayments: 'Ödenen ödeme yok',
    payments_count: 'ödeme',
    
    // Visuals
    visualsTitle: 'Görsellik',
    visualsSubtitle: 'Marka görünümünüzü ve temanızı özelleştirin',
    logoSettings: 'Logo Ayarları',
    uploadLogo: 'Logo Yükle',
    width: 'Genişlik (px)',
    height: 'Yükseklik (px)',
    preserveAspectRatio: 'En Boy Oranını Koru',
    logoPreview: 'Logo Önizleme',
    themeColors: 'Tema Renkleri',
    primaryColor: 'Ana Renk',
    secondaryColor: 'İkincil Renk',
    accentColor: 'Vurgu Rengi',
    mainBrandColor: 'Ana marka rengi ve vurgular',
    supportingBackgrounds: 'Destekleyici arka planlar ve metin',
    highlightsAndInteractive: 'Vurgular ve etkileşimli öğeler',
    colorContrastCheck: 'Renk Kontrast Kontrolü',
    primaryOnSecondary: 'İkincil Üzerinde Ana',
    accentWithWhite: 'Beyaz ile Vurgu',
    sampleText: 'Kontrast kontrolü için örnek metin',
    saveAndApply: 'Kaydet ve Uygula',
    
    // Notifications
    loginSuccessMsg: 'Giriş başarılı!',
    postCreated: 'Gönderi başarıyla oluşturuldu!',
    userCreated: 'Kullanıcı başarıyla oluşturuldu!',
    companyCreated: 'Firma başarıyla oluşturuldu!',
    recordCreated: 'Kayıt başarıyla oluşturuldu!',
    eventCreated: 'Etkinlik başarıyla oluşturuldu!',
    paymentCreated: 'Ödeme başarıyla oluşturuldu!',
    visualsUpdated: 'Görseller başarıyla güncellendi!',
    logoUploaded: 'Logo başarıyla yüklendi!',
    deleteConfirm: 'Silmek istediğinizden emin misiniz?',
    deleted: 'başarıyla silindi',
    fillAllFields: 'Lütfen tüm gerekli alanları doldurun',
    invalidHexColor: 'Geçersiz hex renk formatı',
    errorCreating: 'Oluşturulurken hata oluştu',
    errorFetching: 'Veriler alınırken hata oluştu',
    errorUpdating: 'Güncellenirken hata oluştu',
    newPostPublished: 'Yeni gönderi yayınlandı!',
    newEventCreated: 'Yeni takvim etkinliği oluşturuldu!',
    newPaymentCreated: 'Yeni ödeme oluşturuldu!',
    eventRescheduled: 'Etkinlik yeniden planlandı!',
    live: 'Canlı',
    logout: 'Çıkış',
    profile: 'Profil',
    notifications: 'Bildirimler',
  },
  en: {
    // Auth
    signIn: 'Sign In',
    username: 'Username',
    password: 'Password',
    enterUsername: 'Enter your username',
    enterPassword: 'Enter your password',
    signingIn: 'Signing in...',
    loginSuccessful: 'Login successful!',
    
    // Dashboard
    dashboard: 'Dashboard',
    adminDashboard: 'Admin Dashboard',
    editorDashboard: 'Editor Dashboard',
    companyDashboard: 'Company Dashboard',
    
    // Sidebar Menu
    mainFeed: 'Main Feed',
    authorization: 'Authorization',
    profitTable: 'Profit Table',
    companyCreate: 'Companies',
    companyFeed: 'Company Feed',
    companyCalendar: 'Company Calendar',
    sharedCalendar: 'Shared Calendar',
    payments: 'Company Payments',
    visuals: 'Visuals',
    settings: 'Settings',
    
    // Common
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search',
    filter: 'Filter',
    actions: 'Actions',
    status: 'Status',
    date: 'Date',
    startDate: 'Start Date',
    endDate: 'End Date',
    amount: 'Amount',
    description: 'Description',
    notes: 'Notes',
    company: 'Company',
    companies: 'Companies',
    title: 'Title',
    content: 'Content',
    loading: 'Loading...',
    noData: 'No data found',
    
    // Main Feed
    mainFeedTitle: 'Main Feed',
    mainFeedSubtitle: 'Shared updates and announcements',
    createPost: 'Create Post',
    newPost: 'New Post',
    feedType: 'Feed Type',
    targetCompanies: 'Target Companies',
    selectCompanies: 'Select companies',
    postTitle: 'Post Title',
    postContent: 'Content',
    whatsOnYourMind: "What's on your mind?",
    noPosts: 'No posts yet. Create your first post!',
    
    // Authorization
    authorizationTitle: 'Authorization',
    authorizationSubtitle: 'Manage users and permissions',
    createUser: 'Create User',
    newUser: 'New User',
    fullName: 'Full Name',
    role: 'Role',
    permissions: 'Permissions',
    users: 'Users',
    noUsers: 'No users yet. Create your first user!',
    admin: 'Admin',
    editor: 'Editor',
    companyUser: 'Company User',
    
    // Profit Table
    profitTableTitle: 'Profit Table',
    profitTableSubtitle: 'Track your income and expenses',
    addRecord: 'Add Record',
    addProfitRecord: 'Add Profit/Expense Record',
    type: 'Type',
    income: 'Income',
    expense: 'Expense',
    totalIncome: 'Total Income',
    totalExpense: 'Total Expense',
    netProfit: 'Net Profit',
    allRecords: 'All Records',
    monthlyView: 'Monthly View',
    yearlyView: 'Yearly View',
    month: 'Month',
    year: 'Year',
    net: 'Net',
    companyOptional: 'Company (Optional)',
    companyNameFreeText: 'Company Name (Free Text)',
    selectCompanyOrLeaveBlank: 'Select company or leave blank',
    none: 'None',
    
    // Company Create
    companyManagement: 'Company Management',
    companyManagementSubtitle: 'Create and manage company accounts',
    createCompany: 'Create Company',
    newCompany: 'New Company',
    companyName: 'Company Name',
    brandColor: 'Brand Color (Hex)',
    contactInfo: 'Contact Info',
    contactInfoOptional: 'Contact Info (Optional)',
    noCompanies: 'No companies yet. Create your first company!',
    usedForCalendarAndTags: 'Used for calendar events and tags',
    
    // Company Feed
    companyFeedTitle: 'Company Feed',
    companyFeedSubtitle: 'Updates specifically for your company',
    companyFeedSubtitleAdmin: 'Company-specific updates and announcements',
    noCompanyPosts: 'No company posts yet.',
    
    // Calendar
    sharedCalendarTitle: 'Shared Calendar',
    sharedCalendarSubtitle: 'Agency-wide calendar with company events',
    companyCalendarTitle: 'Company Calendar',
    companyCalendarSubtitle: 'Your company events and schedule',
    companyCalendarSubtitleAdmin: 'Manage company-specific events',
    createEvent: 'Create Event',
    createCalendarEvent: 'Create Calendar Event',
    createCompanyEvent: 'Create Company Event',
    eventTitle: 'Event Title',
    eventDescription: 'Event Description',
    startTime: 'Start Time',
    endTime: 'End Time',
    location: 'Location',
    eventLocation: 'Event location',
    assignToCompany: 'Assign to Company (Optional)',
    assignEditor: 'Assign Editor (Optional)',
    eventColor: 'Event Color',
    eventsColorCoded: 'Events are color-coded with company brand color',
    
    // Payments
    paymentsTitle: 'Company Payments',
    paymentsSubtitle: 'Manage company payments',
    paymentsSubtitleCompany: 'Your payment information',
    createPayment: 'Create Payment',
    newPayment: 'New Payment',
    paymentTitle: 'Payment Title',
    totalToPay: 'Total To Pay',
    totalPaid: 'Total Paid',
    totalPayments: 'Total Payments',
    toPay: 'To Pay',
    paid: 'Paid',
    markAsPaid: 'Mark as Paid',
    markAsUnpaid: 'Mark as Unpaid',
    noPendingPayments: 'No pending payments',
    noPaidPayments: 'No paid payments',
    payments_count: 'payments',
    
    // Visuals
    visualsTitle: 'Visuals',
    visualsSubtitle: 'Customize your brand appearance and theme',
    logoSettings: 'Logo Settings',
    uploadLogo: 'Upload Logo',
    width: 'Width (px)',
    height: 'Height (px)',
    preserveAspectRatio: 'Preserve Aspect Ratio',
    logoPreview: 'Logo Preview',
    themeColors: 'Theme Colors',
    primaryColor: 'Primary Color',
    secondaryColor: 'Secondary Color',
    accentColor: 'Accent Color',
    mainBrandColor: 'Main brand color and accents',
    supportingBackgrounds: 'Supporting backgrounds and text',
    highlightsAndInteractive: 'Highlights and interactive elements',
    colorContrastCheck: 'Color Contrast Check',
    primaryOnSecondary: 'Primary on Secondary',
    accentWithWhite: 'Accent with White',
    sampleText: 'Sample text for contrast check',
    saveAndApply: 'Save & Apply Changes',
    
    // Notifications
    loginSuccessMsg: 'Login successful!',
    postCreated: 'Post created successfully!',
    userCreated: 'User created successfully!',
    companyCreated: 'Company created successfully!',
    recordCreated: 'Record created successfully!',
    eventCreated: 'Event created successfully!',
    paymentCreated: 'Payment created successfully!',
    visualsUpdated: 'Visuals updated successfully!',
    logoUploaded: 'Logo uploaded successfully!',
    deleteConfirm: 'Are you sure you want to delete?',
    deleted: 'deleted successfully',
    fillAllFields: 'Please fill in all required fields',
    invalidHexColor: 'Invalid hex color format',
    errorCreating: 'Error creating',
    errorFetching: 'Error fetching data',
    errorUpdating: 'Error updating',
    newPostPublished: 'New post published!',
    newEventCreated: 'New calendar event created!',
    newPaymentCreated: 'New payment created!',
    eventRescheduled: 'Event rescheduled!',
    live: 'Live',
    logout: 'Logout',
    profile: 'Profile',
    notifications: 'Notifications',
  }
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'tr';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'tr' ? 'en' : 'tr'));
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
