export interface OrganizerEvent {
  id: string;
  organizer_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  venue: string;
  location: string;
  capacity: number;
  category: string;
  status: 'active' | 'cancelled';
  created_at: string;
  rsvp_count: number;
}

export interface OrganizerEventsResponse {
  upcoming?: OrganizerEvent[];
  past?: OrganizerEvent[];
}
