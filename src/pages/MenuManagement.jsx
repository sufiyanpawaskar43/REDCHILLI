import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit3, Plus, RefreshCw, Search, Tags, Utensils } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/ui/Modal';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { StatusBadge } from '@/components/ui/Badges';
import { formatCurrency } from '@/utils/helpers';
import { useToast } from '@/hooks/useToast';

const TABS = ['Categories', 'Items', 'Variants'];

export default function MenuManagement() {
  const toast = useToast();

  const [tab, setTab] = useState('Categories');
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [catRes, itemRes, variantRes] = await Promise.all([
        supabase
          .from('menu_categories')
          .select('*')
          .order('display_order')
          .order('name'),

        supabase
          .from('menu_items')
          .select('*')
          .order('display_order')
          .order('name'),

        supabase
          .from('menu_item_variants')
          .select('*')
          .order('menu_item_id')
          .order('price'),
      ]);

      if (catRes.error) throw catRes.error;
      if (itemRes.error) throw itemRes.error;
      if (variantRes.error) throw variantRes.error;

      setCategories(catRes.data || []);
      setItems(itemRes.data || []);
      setVariants(variantRes.data || []);
    } catch (err) {
      console.error('Menu load error:', err);
      setError('Unable to load menu management.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categoryName = (id) =>
    categories.find((category) => category.id === id)?.name || '—';

  const itemName = (id) =>
    items.find((item) => item.id === id)?.name || '—';

  const filteredCategories = useMemo(() => {
    const query = search.toLowerCase();

    return categories.filter((category) =>
      (category.name || '').toLowerCase().includes(query)
    );
  }, [categories, search]);

  const filteredItems = useMemo(() => {
    const query = search.toLowerCase();

    return items.filter((item) =>
      (item.name || '').toLowerCase().includes(query)
    );
  }, [items, search]);

  const filteredVariants = useMemo(() => {
    const query = search.toLowerCase();

    return variants.filter((variant) => {
      const menuItemName =
        items.find((item) => item.id === variant.menu_item_id)?.name || '—';

      return (
        menuItemName.toLowerCase().includes(query) ||
        (variant.name || '').toLowerCase().includes(query)
      );
    });
  }, [variants, search, items]);

  const toggleCategory = async (row) => {
    if (!row?.id) return;

    const { error: err } = await supabase
      .from('menu_categories')
      .update({
        is_active: !row.is_active,
      })
      .eq('id', row.id);

    if (err) {
      console.error(err);
      toast.error('Unable to update category.');
    } else {
      toast.success('Category updated.');
      load();
    }
  };

  const toggleItem = async (row) => {
    if (!row?.id) return;

    const { error: err } = await supabase
      .from('menu_items')
      .update({
        is_active: !row.is_active,
      })
      .eq('id', row.id);

    if (err) {
      console.error(err);
      toast.error('Unable to update item.');
    } else {
      toast.success('Item updated.');
      load();
    }
  };

  const toggleAvailability = async (row) => {
    if (!row?.id) return;

    const next =
      row.availability === 'AVAILABLE'
        ? 'UNAVAILABLE'
        : 'AVAILABLE';

    const { error: err } = await supabase
      .from('menu_items')
      .update({
        availability: next,
      })
      .eq('id', row.id);

    if (err) {
      console.error(err);
      toast.error('Unable to update availability.');
    } else {
      toast.success('Availability updated.');
      load();
    }
  };

  const toggleVariant = async (row) => {
    if (!row?.id) return;

    const { error: err } = await supabase
      .from('menu_item_variants')
      .update({
        is_active: !row.is_active,
      })
      .eq('id', row.id);

    if (err) {
      console.error(err);
      toast.error('Unable to update variant.');
    } else {
      toast.success('Variant updated.');
      load();
    }
  };

  const openAddModal = () => {
    setModal(tab.toLowerCase());
  };

  const openEditModal = (type, row) => {
    if (!row) return;

    setModal({
      type,
      row,
    });
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold-400 font-semibold">
            Admin
          </p>

          <h1 className="text-2xl font-bold mt-1">
            Menu Management
          </h1>

          <p className="text-sm text-charcoal-500 mt-1">
            Manage categories, items, variants, prices and availability.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="btn-ghost"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={openAddModal}
          >
            <Plus className="w-4 h-4" />
            Add {tab.slice(0, -1)}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((name) => (
          <button
            type="button"
            key={name}
            onClick={() => {
              setTab(name);
              setSearch('');
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              tab === name
                ? 'bg-chilli-600 text-white'
                : 'bg-charcoal-800 text-charcoal-400 hover:text-charcoal-100'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-500" />

        <input
          className="input pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${tab.toLowerCase()}...`}
        />
      </div>

      {/* Content */}
      {error ? (
        <ErrorState
          message={error}
          onRetry={load}
        />
      ) : loading ? (
        <div className="card h-72 animate-pulse" />
      ) : (
        <div className="card overflow-hidden">

          {tab === 'Categories' && (
            <CategoriesTable
              rows={filteredCategories}
              onEdit={(row) => openEditModal('category', row)}
              onToggle={toggleCategory}
            />
          )}

          {tab === 'Items' && (
            <ItemsTable
              rows={filteredItems}
              categoryName={categoryName}
              onEdit={(row) => openEditModal('item', row)}
              onToggle={toggleItem}
              onAvailability={toggleAvailability}
            />
          )}

          {tab === 'Variants' && (
            <VariantsTable
              rows={filteredVariants}
              itemName={itemName}
              onEdit={(row) => openEditModal('variant', row)}
              onToggle={toggleVariant}
            />
          )}

        </div>
      )}

      {/* Modal */}
      <MenuModal
        modal={modal}
        setModal={setModal}
        categories={categories}
        items={items}
        onSaved={load}
        toast={toast}
      />
    </div>
  );
}


/* =========================================================
   CATEGORIES TABLE
========================================================= */

function CategoriesTable({ rows, onEdit, onToggle }) {
  if (!rows.length) {
    return (
      <EmptyState
        icon={Tags}
        title="No categories"
        message="Create your first menu category."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr>
            <th className="table-header">Name</th>
            <th className="table-header">Slug</th>
            <th className="table-header">Order</th>
            <th className="table-header">Status</th>
            <th className="table-header" />
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="table-row"
            >
              <td className="table-cell font-semibold">
                {row.name}
              </td>

              <td className="table-cell text-charcoal-500">
                {row.slug}
              </td>

              <td className="table-cell">
                {row.display_order}
              </td>

              <td className="table-cell">
                <StatusBadge
                  status={
                    row.is_active
                      ? 'ACTIVE'
                      : 'INACTIVE'
                  }
                />
              </td>

              <td className="table-cell text-right">
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={() => onEdit(row)}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>

                <button
                  type="button"
                  className="btn-ghost btn-sm ml-2"
                  onClick={() => onToggle(row)}
                >
                  {row.is_active
                    ? 'Deactivate'
                    : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


/* =========================================================
   ITEMS TABLE
========================================================= */

function ItemsTable({
  rows,
  categoryName,
  onEdit,
  onToggle,
  onAvailability,
}) {
  if (!rows.length) {
    return (
      <EmptyState
        icon={Utensils}
        title="No menu items"
        message="Create a menu item."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr>
            <th className="table-header">Item</th>
            <th className="table-header">Category</th>
            <th className="table-header">Food</th>
            <th className="table-header">Availability</th>
            <th className="table-header">Active</th>
            <th className="table-header" />
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="table-row"
            >
              <td className="table-cell font-semibold">
                {row.name}
              </td>

              <td className="table-cell">
                {categoryName(row.category_id)}
              </td>

              <td className="table-cell">
                {row.food_type}
              </td>

              <td className="table-cell">
                <button
                  type="button"
                  onClick={() => onAvailability(row)}
                >
                  <StatusBadge
                    status={row.availability}
                  />
                </button>
              </td>

              <td className="table-cell">
                <StatusBadge
                  status={
                    row.is_active
                      ? 'ACTIVE'
                      : 'INACTIVE'
                  }
                />
              </td>

              <td className="table-cell text-right">
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={() => onEdit(row)}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>

                <button
                  type="button"
                  className="btn-ghost btn-sm ml-2"
                  onClick={() => onToggle(row)}
                >
                  {row.is_active
                    ? 'Deactivate'
                    : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


/* =========================================================
   VARIANTS TABLE
========================================================= */

function VariantsTable({
  rows,
  itemName,
  onEdit,
  onToggle,
}) {
  if (!rows.length) {
    return (
      <EmptyState
        icon={Utensils}
        title="No variants"
        message="Create a variant for a menu item."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr>
            <th className="table-header">Item</th>
            <th className="table-header">Variant</th>
            <th className="table-header">Price</th>
            <th className="table-header">Default</th>
            <th className="table-header">Active</th>
            <th className="table-header" />
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="table-row"
            >
              <td className="table-cell font-semibold">
                {itemName(row.menu_item_id)}
              </td>

              <td className="table-cell">
                {row.name}
              </td>

              <td className="table-cell text-gold-400 font-semibold">
                {formatCurrency(row.price)}
              </td>

              <td className="table-cell">
                {row.is_default ? 'Yes' : 'No'}
              </td>

              <td className="table-cell">
                <StatusBadge
                  status={
                    row.is_active
                      ? 'ACTIVE'
                      : 'INACTIVE'
                  }
                />
              </td>

              <td className="table-cell text-right">
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={() => onEdit(row)}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>

                <button
                  type="button"
                  className="btn-ghost btn-sm ml-2"
                  onClick={() => onToggle(row)}
                >
                  {row.is_active
                    ? 'Deactivate'
                    : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


/* =========================================================
   MENU MODAL
========================================================= */

function MenuModal({
  modal,
  setModal,
  categories,
  items,
  onSaved,
  toast,
}) {
  const isOpen = Boolean(modal);

  /*
   * IMPORTANT:
   * typeof null === 'object'
   * इसलिए सीधे modal.row करने पर crash होता था.
   */
  const kind =
    typeof modal === 'string'
      ? modal
      : modal?.type ?? null;

  const row =
    modal && typeof modal === 'object'
      ? modal.row ?? null
      : null;

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [foodType, setFoodType] = useState('VEG');
  const [availability, setAvailability] = useState('AVAILABLE');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setName(row?.name || '');
    setSlug(row?.slug || '');

    /*
     * For item:
     * categoryId = category UUID
     *
     * For variant:
     * categoryId = menu item UUID
     */
    if (kind === 'variant' || kind === 'variants') {
      setCategoryId(
        row?.menu_item_id ||
        items[0]?.id ||
        ''
      );
    } else {
      setCategoryId(
        row?.category_id ||
        categories[0]?.id ||
        ''
      );
    }

    setFoodType(
      row?.food_type || 'VEG'
    );

    setAvailability(
      row?.availability || 'AVAILABLE'
    );

    setDescription(
      row?.description || ''
    );

    setPrice(
      row?.price ?? ''
    );

    setIsDefault(
      Boolean(row?.is_default)
    );
  }, [
    isOpen,
    row,
    kind,
    categories,
    items,
  ]);

  const save = async () => {
    if (!name.trim()) {
      toast.error('Name is required.');
      return;
    }

    if (
      (kind === 'items' || kind === 'item') &&
      !categoryId
    ) {
      toast.error('Please select a category.');
      return;
    }

    if (
      (kind === 'variants' || kind === 'variant') &&
      !categoryId
    ) {
      toast.error('Please select a menu item.');
      return;
    }

    if (
      (kind === 'variants' || kind === 'variant') &&
      (price === '' || Number(price) < 0)
    ) {
      toast.error('Please enter a valid price.');
      return;
    }

    setSaving(true);

    try {
      let result;

      /* ================= CATEGORY ================= */

      if (kind === 'category') {
        const finalSlug =
          (
            slug.trim() ||
            name.trim()
          )
            .toLowerCase()
            .replace(
              /[^a-z0-9]+/g,
              '-'
            )
            .replace(
              /^-|-$/g,
              ''
            );

        const payload = {
          name: name.trim(),
          slug: finalSlug,
          display_order:
            row?.display_order ?? 0,
          is_active:
            row?.is_active ?? true,
        };

        if (row?.id) {
          result = await supabase
            .from('menu_categories')
            .update(payload)
            .eq('id', row.id);
        } else {
          result = await supabase
            .from('menu_categories')
            .insert(payload);
        }
      }

      /* ================= MENU ITEM ================= */

      else if (
        kind === 'items' ||
        kind === 'item'
      ) {
        const payload = {
          name: name.trim(),
          category_id: categoryId,
          food_type: foodType,
          availability,
          description:
            description.trim() || null,
          is_active:
            row?.is_active ?? true,
          display_order:
            row?.display_order ?? 0,
        };

        if (row?.id) {
          result = await supabase
            .from('menu_items')
            .update(payload)
            .eq('id', row.id);
        } else {
          result = await supabase
            .from('menu_items')
            .insert(payload);
        }
      }

      /* ================= VARIANT ================= */

      else if (
        kind === 'variants' ||
        kind === 'variant'
      ) {
        const payload = {
          menu_item_id: categoryId,
          name: name.trim(),
          price: Number(price),
          is_default: isDefault,
          is_active:
            row?.is_active ?? true,
        };

        if (row?.id) {
          result = await supabase
            .from('menu_item_variants')
            .update(payload)
            .eq('id', row.id);
        } else {
          result = await supabase
            .from('menu_item_variants')
            .insert(payload);
        }
      }

      if (result?.error) {
        throw result.error;
      }

      const savedType =
        kind === 'variants' ||
        kind === 'variant'
          ? 'Variant'
          : kind === 'items' ||
              kind === 'item'
            ? 'Item'
            : 'Category';

      toast.success(
        `${savedType} saved successfully.`
      );

      setModal(null);

      if (onSaved) {
        await onSaved();
      }
    } catch (err) {
      console.error(
        'Menu save error:',
        err
      );

      toast.error(
        err?.message ||
          'Unable to save changes. Check permissions and values.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const title =
    kind === 'category' ||
    kind === 'categories'
      ? `${row ? 'Edit' : 'Add'} Category`
      : kind === 'item' ||
          kind === 'items'
        ? `${row ? 'Edit' : 'Add'} Menu Item`
        : `${row ? 'Edit' : 'Add'} Variant`;

  const isCategory =
    kind === 'category' ||
    kind === 'categories';

  const isItem =
    kind === 'item' ||
    kind === 'items';

  const isVariant =
    kind === 'variant' ||
    kind === 'variants';

  return (
    <Modal
      open={isOpen}
      onClose={() => setModal(null)}
      title={title}
      size="md"
    >
      <div className="space-y-4">

        {/* Name */}
        <div>
          <label className="label">
            {isVariant
              ? 'Variant Name'
              : 'Name'}
          </label>

          <input
            className="input"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder={
              isVariant
                ? 'e.g. Full'
                : 'Enter name'
            }
          />
        </div>

        {/* Category slug */}
        {isCategory && (
          <div>
            <label className="label">
              Slug
            </label>

            <input
              className="input"
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value)
              }
              placeholder="auto-generated if empty"
            />
          </div>
        )}

        {/* Menu item fields */}
        {isItem && (
          <>
            <div>
              <label className="label">
                Category
              </label>

              <select
                className="input"
                value={categoryId}
                onChange={(e) =>
                  setCategoryId(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Select category
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="label">
                Food Type
              </label>

              <select
                className="input"
                value={foodType}
                onChange={(e) =>
                  setFoodType(
                    e.target.value
                  )
                }
              >
                <option value="VEG">
                  VEG
                </option>

                <option value="NON_VEG">
                  NON_VEG
                </option>

                <option value="EGG">
                  EGG
                </option>
              </select>
            </div>

            <div>
              <label className="label">
                Availability
              </label>

              <select
                className="input"
                value={availability}
                onChange={(e) =>
                  setAvailability(
                    e.target.value
                  )
                }
              >
                <option value="AVAILABLE">
                  AVAILABLE
                </option>

                <option value="UNAVAILABLE">
                  UNAVAILABLE
                </option>
              </select>
            </div>

            <div>
              <label className="label">
                Description
              </label>

              <textarea
                className="input resize-none"
                rows={3}
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                placeholder="Optional description"
              />
            </div>
          </>
        )}

        {/* Variant fields */}
        {isVariant && (
          <>
            <div>
              <label className="label">
                Menu Item
              </label>

              <select
                className="input"
                value={categoryId}
                onChange={(e) =>
                  setCategoryId(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Select menu item
                </option>

                {items.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">
                Price (₹)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={price}
                onChange={(e) =>
                  setPrice(
                    e.target.value
                  )
                }
                placeholder="0.00"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-charcoal-300">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) =>
                  setIsDefault(
                    e.target.checked
                  )
                }
              />

              Default variant
            </label>
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            className="btn-ghost"
            onClick={() =>
              setModal(null)
            }
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn-primary"
            disabled={saving}
            onClick={save}
          >
            {saving
              ? 'Saving...'
              : 'Save'}
          </button>
        </div>

      </div>
    </Modal>
  );
}