-- Drop the existing insert policies
DROP POLICY IF EXISTS "Customers can create tickets" ON tickets;
DROP POLICY IF EXISTS "Staff can create tickets" ON tickets;

-- Create a single, simpler insert policy
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
        (
            NOT EXISTS (
                SELECT 1 FROM user_roles
                WHERE user_id = auth.uid()
                AND role IN ('staff', 'admin')
            )
            AND customer_email = auth.email()
        )
    ); 