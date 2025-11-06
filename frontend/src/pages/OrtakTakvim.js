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

const OrtakTakvim = () => {
  const { t } = useLanguage();
  const [events, setEvents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    assigned_company: '',
    type: 'shared',
    color_hex: '#1CFF00',
  });

  useEffect(() => {
    fetchEvents();
    fetchCompanies();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API_URL}/events`);
      const formattedEvents = response.data.map((event) => ({
        ...event,
        start: new Date(`${event.date}T${event.start_time}`),
        end: new Date(`${event.date}T${event.end_time}`),
        title: event.title,
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error('[OrtakTakvim] Error fetching events:', error);
      toast.error('Etkinlikler yüklenemedi');
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(`${API_URL}/companies`);
      setCompanies(response.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
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
      setSelectedSlot(slotInfo);
      setDialogOpen(true);
    } catch (error) {
      toast.error('Hata oluştu. Lütfen tekrar deneyin.');
      console.error('Error in handleSelectSlot:', error);
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.date || !newEvent.start_time || !newEvent.end_time) {
      toast.error(t('fillAllFields'));
      return;
    }

    try {
      const eventToSubmit = {
        ...newEvent,
        assigned_company: newEvent.assigned_company === 'unassigned' ? '' : newEvent.assigned_company,
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
        type: 'shared',
        color_hex: '#1CFF00',
      });
      fetchEvents();
    } catch (error) {
      console.error('[OrtakTakvim] Error creating event:', error);
      toast.error('Etkinlik oluşturulamadı');
    }
  };

  const handleEventDrop = async ({ event, start, end }) => {
    try {
      const date = moment(start).format('YYYY-MM-DD');
      const startTime = moment(start).format('HH:mm');
      const endTime = moment(end).format('HH:mm');

      await axios.put(`${API_URL}/events/${event.id}`, {
        date,
        start_time: startTime,
        end_time: endTime,
      });

      toast.success('Etkinlik güncellendi!');
      fetchEvents();
    } catch (error) {
      console.error('[OrtakTakvim] Error updating event:', error);
      toast.error('Etkinlik güncellenemedi');
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

  return (
    <div className="space-y-6" data-testid="ortak-takvim">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('ortakTakvimTitle')}</h1>
        <p className="text-gray-600 mt-1">{t('ortakTakvimSubtitle')}</p>
      </div>

      <Card className="p-6">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          onEventDrop={handleEventDrop}
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
            <DialogTitle>Yeni Takvim Etkinliği</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>{t('title')}</Label>
              <Input
                data-testid="event-title-input"
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
                  data-testid="event-date-input"
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                />
              </div>
              <div>
                <Label>{t('startTime')}</Label>
                <Input
                  data-testid="event-start-time-input"
                  type="time"
                  value={newEvent.start_time}
                  onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label>{t('endTime')}</Label>
                <Input
                  data-testid="event-end-time-input"
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
              <Label>Firma (Opsiyonel)</Label>
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
                  <SelectValue placeholder="Yok" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Yok</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <Button onClick={handleCreateEvent} className="w-full" data-testid="event-submit-button">
              {t('create')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrtakTakvim;
