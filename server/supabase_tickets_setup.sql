-- Supabase Schema for Classgrid Support Tickets

-- 1. Create the Support Tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number SERIAL UNIQUE,
    requester_name TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    module TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'low',
    description TEXT NOT NULL,
    college_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open',
    attachments TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the Ticket Messages table (for replies and live chat)
CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin', 'system')),
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Row Level Security (RLS) Policies
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (so users on the marketing site can raise a ticket without logging in)
CREATE POLICY "Allow public to insert tickets" ON public.support_tickets FOR INSERT WITH CHECK (true);

-- Allow users to read their own tickets (if you implement auth later, you can restrict this by email)
CREATE POLICY "Allow public to read tickets" ON public.support_tickets FOR SELECT USING (true);

-- Realtime Setup
-- Enable real-time for tickets and messages so the Super Admin dashboard gets instant updates
ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_messages;
