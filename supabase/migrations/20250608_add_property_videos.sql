-- Add property_videos table for video tours
CREATE TABLE IF NOT EXISTS property_videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration TEXT,
    views INTEGER DEFAULT 0,
    uploaded_by UUID NOT NULL REFERENCES profiles(id),
    filename TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_property_videos_property_id
ON property_videos(property_id);

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_property_videos_created
ON property_videos(created_at DESC);

-- Enable Row Level Security
ALTER TABLE property_videos ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to view videos
CREATE POLICY "Videos are viewable by everyone"
    ON property_videos
    FOR SELECT
    USING (true);

-- Policy: Only owner can insert
CREATE POLICY "Only owners can upload videos"
    ON property_videos
    FOR INSERT
    WITH CHECK (auth.uid() = uploaded_by);

-- Policy: Only owner can delete their videos
CREATE POLICY "Owners can delete their videos"
    ON property_videos
    FOR DELETE
    USING (auth.uid() = uploaded_by);

-- Create storage bucket for videos (run in Supabase dashboard)
-- Note: Execute these in Supabase SQL Editor
/*
-- Create bucket for property videos
insert into storage.buckets (id, name, public)
values ('property-videos', 'property-videos', true);

-- Set bucket policies
CREATE POLICY "Videos are publicly accessible"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'property-videos');

CREATE POLICY "Authenticated users can upload videos"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'property-videos'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete their own videos"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'property-videos'
        AND auth.uid() = owner
    );
*/

-- Trigger to update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_property_videos_updated_at
    before update on property_videos
    for each row
    execute function update_updated_at_column();
