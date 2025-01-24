-- Create a function to get user role without RLS
CREATE OR REPLACE FUNCTION get_user_role(user_id_param uuid)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM user_roles WHERE user_id = user_id_param;
$$; 