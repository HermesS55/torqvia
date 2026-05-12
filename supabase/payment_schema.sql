-- iyzico ödeme tamamlandıktan sonra server-side'da plan güncellenir (service role ile).
-- Bu fonksiyon yedek olarak client-side çağrı için de kullanılabilir.

CREATE OR REPLACE FUNCTION update_my_plan(new_plan text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF new_plan NOT IN ('free', 'turbo', 'elite') THEN
    RETURN json_build_object('error', 'invalid plan');
  END IF;

  UPDATE profiles SET plan = new_plan WHERE id = auth.uid();

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'profile not found');
  END IF;

  RETURN json_build_object('success', true, 'plan', new_plan);
END;
$$;

-- Sadece oturum açmış kullanıcılar çağırabilir
REVOKE ALL ON FUNCTION update_my_plan(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_my_plan(text) TO authenticated;
