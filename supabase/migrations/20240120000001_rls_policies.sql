-- Enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Tickets policies
CREATE POLICY "Users can view their own tickets"
    ON tickets FOR SELECT
    USING (
        customer_email = auth.jwt()->>'email' OR
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('staff', 'admin')
        )
    );

CREATE POLICY "Customers can create tickets"
    ON tickets FOR INSERT
    WITH CHECK (
        customer_email = auth.jwt()->>'email'
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
        customer_email = auth.jwt()->>'email' OR
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('staff', 'admin')
        )
    );

-- User roles policies - simplified to avoid recursion
CREATE POLICY "Users can read roles"
    ON user_roles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin can insert roles"
    ON user_roles FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin can update roles"
    ON user_roles FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin can delete roles"
    ON user_roles FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Teams policies
CREATE POLICY "Staff can view teams"
    ON teams FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('staff', 'admin')
        )
    );

CREATE POLICY "Admin can manage teams"
    ON teams FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    ); 