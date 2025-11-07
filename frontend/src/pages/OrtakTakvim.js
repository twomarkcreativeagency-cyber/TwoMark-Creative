import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Edit2, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import './Calendar.css';

const localizer = momentLocalizer(moment);
const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const OrtakTakvim = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [editors, setEditors] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dailyEvents, setDailyEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    assigned_company: '',
    assigned_editors: [],
    type: 'shared',
    color_hex: '#1CFF00',
  });
  const [editEvent, setEditEvent] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    assigned_company: '',
    assigned_editors: [],
    color_hex: '#1CFF00',
  });

  useEffect(() => {
    fetchEvents();
    fetchCompanies();
    fetchEditors();
  }, []);

  useEffect(() => {
    updateDailyEvents(selectedDate);
  }, [events, selectedDate]);

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

  const fetchEditors = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`);
      const editorsList = response.data.filter(u => u.role === 'Editör');
      setEditors(editorsList);
    } catch (error) {
      console.error('Error fetching editors:', error);
    }
  };

  const updateDailyEvents = (date) => {
    const dateStr = moment(date).format('YYYY-MM-DD');
    const dayEvents = events.filter(event => event.date === dateStr);
    setDailyEvents(dayEvents);
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

  const handleNavigate = (date) => {
    setCurrentDate(date);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(moment(currentDate).subtract(1, 'month').toDate());
  };

  const handleNextMonth = () => {
    setCurrentDate(moment(currentDate).add(1, 'month').toDate());
  };

  const handleTodayClick = () => {
    setCurrentDate(new Date());
  };

  const handleSelectEvent = (event) => {
    setSelectedDate(new Date(event.date));
    updateDailyEvents(new Date(event.date));
  };

  const handleDayClick = (date) => {
    setSelectedDate(date);
    updateDailyEvents(date);
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.date || !newEvent.start_time || !newEvent.end_time) {
      toast.error(t('fillAllFields'));
      return;
    }

    try {
      await axios.post(`${API_URL}/events`, newEvent);
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
        assigned_editors: [],
        type: 'shared',
        color_hex: '#1CFF00',
      });
      await fetchEvents();
    } catch (error) {
      console.error('[OrtakTakvim] Error creating event:', error);
      toast.error('Etkinlik oluşturulamadı');
    }
  };

  const handleEditClick = (event) => {
    setEditingEvent(event);
    setEditEvent({
      title: event.title,
      description: event.description || '',
      date: event.date,
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location || '',
      assigned_company: event.assigned_company || '',
      assigned_editors: event.assigned_editors || [],
      color_hex: event.color_hex || '#1CFF00',
    });
    setEditDialogOpen(true);
  };

  const handleUpdateEvent = async () => {
    try {
      if (!editEvent.title || !editEvent.date || !editEvent.start_time || !editEvent.end_time) {
        toast.error(t('fillAllFields'));
        return;
      }

      await axios.put(`${API_URL}/events/${editingEvent.id}`, editEvent);
      toast.success('Etkinlik güncellendi!');
      setEditDialogOpen(false);
      setEditingEvent(null);
      await fetchEvents();
    } catch (error) {
      console.error('[OrtakTakvim] Error updating event:', error);
      toast.error('Etkinlik güncellenemedi');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      if (!window.confirm('Bu etkinliği silmek istediğinizden emin misiniz?')) return;

      await axios.delete(`${API_URL}/events/${eventId}`);
      toast.success('Etkinlik silindi');
      await fetchEvents();
    } catch (error) {
      console.error('[OrtakTakvim] Error deleting event:', error);
      toast.error('Etkinlik silinemedi');
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

  const handleEditorToggle = (editorId) => {
    setNewEvent(prev => ({
      ...prev,
      assigned_editors: prev.assigned_editors.includes(editorId)
        ? prev.assigned_editors.filter(id => id !== editorId)
        : [...prev.assigned_editors, editorId]
    }));
  };

  const handleEditEditorToggle = (editorId) => {
    setEditEvent(prev => ({
      ...prev,
      assigned_editors: prev.assigned_editors.includes(editorId)
        ? prev.assigned_editors.filter(id => id !== editorId)
        : [...prev.assigned_editors, editorId]
    }));
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

  const getEditorNames = (editorIds) => {
    if (!editorIds || editorIds.length === 0) return 'Atanmadı';
    return editorIds.map(id => {
      const editor = editors.find(e => e.id === id);
      return editor ? editor.full_name : 'Bilinmeyen';
    }).join(', ');
  };

  const getCompanyName = (companyId) => {
    if (!companyId) return '-';
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : '-';
  };

  return (
    <div className="space-y-6" data-testid="ortak-takvim">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('ortakTakvimTitle')}</h1>
        <p className="text-gray-600 mt-1">{t('ortakTakvimSubtitle')}</p>
      </div>

      {/* Calendar Navigation */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={handleTodayClick}>
            Bugün
          </Button>
          <Button variant="outline" onClick={handleNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-lg font-semibold">
          {moment(currentDate).format('MMMM YYYY')}
        </div>
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
          onNavigate={handleNavigate}
          date={currentDate}
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

      {/* Günün Özeti (Daily Summary) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Günün Özeti - {moment(selectedDate).format('DD MMMM YYYY')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dailyEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Bu gün için etkinlik bulunmamaktadır.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Saat</TableHead>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead>Editörler</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {event.start_time} - {event.end_time}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{event.title}</p>
                        {event.description && (
                          <p className="text-xs text-gray-500">{event.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getCompanyName(event.assigned_company)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {event.assigned_editors?.map(editorId => {
                          const editor = editors.find(e => e.id === editorId);
                          return editor ? (
                            <Badge key={editorId} variant="secondary" className="text-xs">
                              {editor.full_name}
                            </Badge>
                          ) : null;
                        })}
                        {(!event.assigned_editors || event.assigned_editors.length === 0) && (
                          <span className="text-xs text-gray-400">Atanmadı</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {user?.role === 'Yönetici' && (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(event)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteEvent(event.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yeni Takvim Etkinliği</DialogTitle>
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
              <Label>Editör Ata (Çoklu Seçim)</Label>
              <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                {editors.length === 0 ? (
                  <p className="text-sm text-gray-500">Henüz editör bulunmuyor</p>
                ) : (
                  editors.map((editor) => (
                    <div key={editor.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`editor-${editor.id}`}
                        checked={newEvent.assigned_editors.includes(editor.id)}
                        onChange={() => handleEditorToggle(editor.id)}
                        className="w-4 h-4"
                      />
                      <label htmlFor={`editor-${editor.id}`} className="text-sm cursor-pointer">
                        {editor.full_name}
                      </label>
                    </div>
                  ))
                )}
              </div>
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

      {/* Edit Event Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Etkinlik Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>{t('title')}</Label>
              <Input
                value={editEvent.title}
                onChange={(e) => setEditEvent({ ...editEvent, title: e.target.value })}
                placeholder="Etkinlik başlığı"
              />
            </div>

            <div>
              <Label>{t('description')}</Label>
              <Textarea
                value={editEvent.description}
                onChange={(e) => setEditEvent({ ...editEvent, description: e.target.value })}
                placeholder="Etkinlik açıklaması"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>{t('date')}</Label>
                <Input
                  type="date"
                  value={editEvent.date}
                  onChange={(e) => setEditEvent({ ...editEvent, date: e.target.value })}
                />
              </div>
              <div>
                <Label>{t('startTime')}</Label>
                <Input
                  type="time"
                  value={editEvent.start_time}
                  onChange={(e) => setEditEvent({ ...editEvent, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label>{t('endTime')}</Label>
                <Input
                  type="time"
                  value={editEvent.end_time}
                  onChange={(e) => setEditEvent({ ...editEvent, end_time: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>{t('location')}</Label>
              <Input
                value={editEvent.location}
                onChange={(e) => setEditEvent({ ...editEvent, location: e.target.value })}
                placeholder="Konum"
              />
            </div>

            <div>
              <Label>Firma</Label>
              <Select
                value={editEvent.assigned_company || 'unassigned'}
                onValueChange={(value) => {
                  const company = companies.find((c) => c.id === value);
                  setEditEvent({
                    ...editEvent,
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
              <Label>Editör Ata (Çoklu Seçim)</Label>
              <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                {editors.length === 0 ? (
                  <p className="text-sm text-gray-500">Henüz editör bulunmuyor</p>
                ) : (
                  editors.map((editor) => (
                    <div key={editor.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`edit-editor-${editor.id}`}
                        checked={editEvent.assigned_editors.includes(editor.id)}
                        onChange={() => handleEditEditorToggle(editor.id)}
                        className="w-4 h-4"
                      />
                      <label htmlFor={`edit-editor-${editor.id}`} className="text-sm cursor-pointer">
                        {editor.full_name}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <Label>Renk</Label>
              <div className="flex gap-2">
                <Input
                  value={editEvent.color_hex}
                  onChange={(e) => setEditEvent({ ...editEvent, color_hex: e.target.value })}
                  placeholder="#1CFF00"
                />
                <div
                  className="w-12 h-10 rounded border-2 border-gray-200"
                  style={{ backgroundColor: editEvent.color_hex }}
                ></div>
              </div>
            </div>

            <Button onClick={handleUpdateEvent} className="w-full">
              Güncelle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrtakTakvim;
