-- Drop the old policies again to be safe
DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;
DROP POLICY IF EXISTS "Customers can create tickets" ON tickets;
DROP POLICY IF EXISTS "Staff can create tickets" ON tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON tickets;

-- Recreate policies with the correct auth.jwt() syntax
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

CREATE POLICY "Customers can create tickets"
    ON tickets FOR INSERT
    WITH CHECK (
        customer_email = auth.email()
    );

CREATE POLICY "Staff can create tickets"
    ON tickets FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('staff', 'admin')
        )
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