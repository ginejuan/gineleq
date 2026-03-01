-- ============================================================
-- GineLeq — Migración: Sistema de Roles
-- ============================================================
-- Ejecutar en Supabase SQL Editor (una sola vez).
-- ============================================================

-- 1. Enum de roles
CREATE TYPE app_role AS ENUM ('admin', 'gestor', 'consulta');

-- 2. Tabla de perfiles (1-a-1 con auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre     TEXT,
    rol        app_role NOT NULL DEFAULT 'consulta',
    activo     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Trigger: crea perfil automáticamente al registrar un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.profiles (id, nombre)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Cada usuario puede leer su propio perfil
DROP POLICY IF EXISTS "Own profile read" ON public.profiles;
CREATE POLICY "Own profile read" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Solo admins pueden leer todos los perfiles y modificarlos
DROP POLICY IF EXISTS "Admin full access" ON public.profiles;
CREATE POLICY "Admin full access" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.rol = 'admin'
        )
    );

-- 5. Insertar el perfil del primer usuario existente como admin
--    (Ajustar el email si fuera necesario)
-- INSERT INTO public.profiles (id, nombre, rol)
-- SELECT id, email, 'admin'::app_role FROM auth.users LIMIT 1
-- ON CONFLICT (id) DO UPDATE SET rol = 'admin';
