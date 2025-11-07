import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import './Calendar.css';

const localizer = momentLocalizer(moment);
const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const FirmaTakvimi = () => {
  const { t } = useLanguage();
  const [events, setEvents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    assigned_company: '',
    type: 'company',
    color_hex: '#1CFF00',
  });

  useEffect(() => {
    fetchEvents();
    fetchCompanies();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API_URL}/events`);
      const companyEvents = response.data.filter(e => e.type === 'company');
      const formattedEvents = companyEvents.map((event) => ({
        ...event,
        start: new Date(`${event.date}T${event.start_time}`),
        end: new Date(`${event.date}T${event.end_time}`),
        title: event.title,
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error('[FirmaTakvimi] Error fetching events:', error);
      toast.error('Etkinlikler yüklenemedi');
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(`${API_URL}/companies`);
      setCompanies(response.data);
      console.log('[FirmaTakvimi] Companies loaded:', response.data.length, 'companies');
    } catch (error) {
      console.error('[FirmaTakvimi] Error fetching companies:', error);
      toast.error('Firmalar yüklenemedi');
    }
  };

  const handleSelectSlot = (slotInfo) => {
    try {
      const date = moment(slotInfo.start).format('YYYY-MM-DD');
      const startTime = moment(slotInfo.start).format('HH:mm');
      const endTime = moment(slotInfo.end).format('HH:mm');

      setNewEvent({
        ...newEvent,
        date,
        start_time: startTime,
        end_time: endTime,
      });
      setDialogOpen(true);
    } catch (error) {
      toast.error('Hata oluştu. Lütfen tekrar deneyin.');
      console.error('Error in handleSelectSlot:', error);
    }
  };

  const handleCreateEvent = async () => {
    // Validate required fields - company must be selected and not 'unassigned'
    if (!newEvent.title || !newEvent.date || !newEvent.start_time || !newEvent.end_time) {
      toast.error(t('fillAllFields'));
      return;
    }

    if (!newEvent.assigned_company || newEvent.assigned_company === 'unassigned') {
      toast.error('Lütfen bir firma seçin');
      return;
    }

    try {
      const eventToSubmit = {
        ...newEvent,
        type: 'company',
      };
      await axios.post(`${API_URL}/events`, eventToSubmit);
      toast.success('Etkinlik oluşturuldu!');
      setDialogOpen(false);
      setNewEvent({
        title: '',
        description: '',
        date: '',
        start_time: '',
        end_time: '',
        location: '',
        assigned_company: '',
        type: 'company',
        color_hex: '#1CFF00',
      });
      // Refresh both events and companies
      await Promise.all([fetchEvents(), fetchCompanies()]);
    } catch (error) {
      console.error('[FirmaTakvimi] Error creating event:', error);
      toast.error('Etkinlik oluşturulamadı');
    }
  };

  const eventStyleGetter = (event) => {
    const backgroundColor = event.color_hex || '#1CFF00';
    return {
      style: {
        backgroundColor,
        borderLeft: `4px solid ${backgroundColor}`,
        opacity: 0.9,
      },
    };
  };

  const filteredEvents = selectedCompany === 'all' 
    ? events 
    : events.filter(e => e.assigned_company === selectedCompany);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('firmaTakvimiTitle')}</h1>
          <p className="text-gray-600 mt-1">{t('firmaTakvimiSubtitle')}</p>
        </div>

        <div className="flex gap-3 items-center">
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Firma seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Firmalar</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="p-6">
        <Calendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          selectable
          onSelectSlot={handleSelectSlot}
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day']}
          defaultView="month"
          messages={{
            next: 'İleri',
            previous: 'Geri',
            today: 'Bugün',
            month: 'Ay',
            week: 'Hafta',
            day: 'Gün',
          }}
        />
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yeni Firma Etkinliği</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>{t('title')}</Label>
              <Input
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Etkinlik başlığı"
              />
            </div>

            <div>
              <Label>{t('description')}</Label>
              <Textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Etkinlik açıklaması"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>{t('date')}</Label>
                <Input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                />
              </div>
              <div>
                <Label>{t('startTime')}</Label>
                <Input
                  type="time"
                  value={newEvent.start_time}
                  onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label>{t('endTime')}</Label>
                <Input
                  type="time"
                  value={newEvent.end_time}
                  onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>{t('location')}</Label>
              <Input
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                placeholder="Konum"
              />
            </div>

            <div>
              <Label>{t('company')} *</Label>
              {companies.length === 0 ? (
                <div className="text-sm text-gray-500 p-2 bg-gray-50 rounded">
                  Henüz firma bulunmuyor. Önce bir firma ekleyin.
                </div>
              ) : (
                <Select
                  value={newEvent.assigned_company || 'unassigned'}
                  onValueChange={(value) => {
                    const company = companies.find((c) => c.id === value);
                    setNewEvent({
                      ...newEvent,
                      assigned_company: value === 'unassigned' ? '' : value,
                      color_hex: value === 'unassigned' ? '#1CFF00' : (company?.brand_color_hex || '#1CFF00'),
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Firma seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Firma Seçin</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label>Renk</Label>
              <div className="flex gap-2">
                <Input
                  value={newEvent.color_hex}
                  onChange={(e) => setNewEvent({ ...newEvent, color_hex: e.target.value })}
                  placeholder="#1CFF00"
                />
                <div
                  className="w-12 h-10 rounded border-2 border-gray-200"
                  style={{ backgroundColor: newEvent.color_hex }}
                ></div>
              </div>
            </div>

            <Button onClick={handleCreateEvent} className="w-full">
              {t('create')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FirmaTakvimi;
