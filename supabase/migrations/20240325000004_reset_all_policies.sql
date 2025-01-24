-- First, drop all existing policies
DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;
DROP POLICY IF EXISTS "Customers can create tickets" ON tickets;
DROP POLICY IF EXISTS "Staff can create tickets" ON tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON tickets;

-- Disable and re-enable RLS to ensure clean state
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Create the policies fresh
CREATE POLICY "Users can view their own tickets"
    ON tickets FOR SELECT
    USING (
        customer_email = auth.email() OR
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('staff', 'admin')
        )
    );

CREATE POLICY "Users can create tickets"
    ON tickets FOR INSERT
    WITH CHECK (
        -- Staff/admin can create tickets for anyone
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('staff', 'admin')
        )
        OR
        -- Regular users can only create tickets with their own email
        customer_email = auth.email()
    );

CREATE POLICY "Users can update their own tickets"
    ON tickets FOR UPDATE
    USING (
        customer_email = auth.email() OR
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('staff', 'admin')
        )
    ); 