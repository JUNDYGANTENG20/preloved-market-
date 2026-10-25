-- 05-edit-hapus-produk.sql
-- Mengizinkan penjual MENGUBAH dan MENGHAPUS barang miliknya sendiri
-- (dipakai dashboard-penjual.html dan tambah-produk.html?id=...).
-- Jalankan sekali di Supabase: SQL Editor > New query > Run.

drop policy if exists "Users can update their own products" on public.products;
create policy "Users can update their own products"
  on public.products
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own products" on public.products;
create policy "Users can delete their own products"
  on public.products
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant update, delete on public.products to authenticated;
