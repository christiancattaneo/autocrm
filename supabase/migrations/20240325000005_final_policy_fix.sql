-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;
DROP POLICY IF EXISTS "Customers can create tickets" ON tickets;
DROP POLICY IF EXISTS "Staff can create tickets" ON tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON tickets;
DROP POLICY IF EXISTS "Staff can create tickets for others" ON tickets;
DROP POLICY IF EXISTS "Users can update their own tickets or staff can update all" ON tickets;
DROP POLICY IF EXISTS "Users can view their own tickets or staff can view all" ON tickets;

-- Disable and re-enable RLS
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Create fresh policies
CREATE POLICY "ticket_select_policy"
    ON tickets FOR SELECT
    TO authenticated
    USING (
        customer_email = auth.email() OR
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('staff', 'admin')
        )
    );

CREATE POLICY "ticket_insert_policy"
    ON tickets FOR INSERT
    TO authenticated
    WITH CHECK (
        customer_email = auth.email() OR
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('staff', 'admin')
        )
    );

CREATE POLICY "ticket_update_policy"
    ON tickets FOR UPDATE
    TO authenticated
    USING (
        customer_email = auth.email() OR
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('staff', 'admin')
        )
    ); 