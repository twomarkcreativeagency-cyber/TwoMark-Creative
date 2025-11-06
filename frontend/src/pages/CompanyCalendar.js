import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import './Calendar.css';

const localizer = momentLocalizer(moment);
const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const CompanyCalendar = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
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
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany || user?.role === 'CompanyUser') {
      fetchEvents();
    }
  }, [selectedCompany, user]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API_URL}/events`);
      let filteredEvents = response.data;

      // Filter by selected company if admin/editor
      if (user?.role !== 'CompanyUser' && selectedCompany) {
        filteredEvents = response.data.filter(
          (event) => event.assigned_company === selectedCompany
        );
      }

      const formattedEvents = filteredEvents.map((event) => ({
        ...event,
        start: new Date(`${event.date}T${event.start_time}`),
        end: new Date(`${event.date}T${event.end_time}`),
        title: event.title,
      }));
      setEvents(formattedEvents);
    } catch (error) {
      toast.error('Failed to fetch events');
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(`${API_URL}/companies`);
      setCompanies(response.data);
      if (response.data.length > 0 && user?.role !== 'CompanyUser') {
        setSelectedCompany(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const handleSelectSlot = (slotInfo) => {
    try {
      const date = moment(slotInfo.start).format('YYYY-MM-DD');
      const startTime = moment(slotInfo.start).format('HH:mm');
      const endTime = moment(slotInfo.end).format('HH:mm');

      const companyId = user?.role === 'CompanyUser' ? user.id : selectedCompany;
      const company = companies.find((c) => c.id === companyId);

      setNewEvent({
        ...newEvent,
        date,
        start_time: startTime,
        end_time: endTime,
        assigned_company: companyId,
        color_hex: company?.brand_color_hex || '#1CFF00',
      });
      setDialogOpen(true);
    } catch (error) {
      toast.error('Error creating event. Please try again.');
      console.error('Error in handleSelectSlot:', error);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.date || !newEvent.start_time || !newEvent.end_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await axios.post(`${API_URL}/events`, newEvent);
      toast.success('Event created successfully!');
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
      fetchEvents();
    } catch (error) {
      toast.error('Failed to create event');
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

  const currentCompany = companies.find(
    (c) => c.id === (user?.role === 'CompanyUser' ? user.id : selectedCompany)
  );

  return (
    <div className="space-y-6" data-testid="company-calendar">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Company Calendar
          </h1>
          <p className="text-slate-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            {user?.role === 'CompanyUser'
              ? 'Your company events and schedule'
              : 'Manage company-specific events'}
          </p>
        </div>

        {user?.role !== 'CompanyUser' && companies.length > 0 && (
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {currentCompany && (
        <div
          className="p-4 rounded-lg border-l-4"
          style={{
            borderColor: currentCompany.brand_color_hex,
            backgroundColor: `${currentCompany.brand_color_hex}10`,
          }}
        >
          <h3 className="font-semibold text-lg" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {currentCompany.name}
          </h3>
          <p className="text-sm text-slate-600">Events are color-coded with company brand color</p>
        </div>
      )}

      <Card className="p-6">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          selectable
          onSelectSlot={handleSelectSlot}
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day']}
          defaultView="month"
        />
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Company Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Title</Label>
              <Input
                data-testid="company-event-title-input"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Event title"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Event description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                />
              </div>
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newEvent.start_time}
                  onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={newEvent.end_time}
                  onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Location</Label>
              <Input
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                placeholder="Event location"
              />
            </div>

            <Button onClick={handleCreateEvent} className="w-full" data-testid="company-event-submit-button">
              Create Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyCalendar;
