import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Upload, Save, ArrowLeft } from 'lucide-react';
import { useToast } from './Toast';
import {
  getRecipesForBulkEditing,
  updateRecipeTitle,
  updateRecipeDescription,
  updateRecipeMetadata,
} from '../api/recipeEditor';

export default function BulkRecipeEditor({ onBack }) {
  const toast = useToast();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [needsReviewOnly, setNeedsReviewOnly] = useState(true); // Default to showing only recipes that need work
  const [editedRecipes, setEditedRecipes] = useState(new Map()); // Track changes
  const fileInputRef = useRef(null);

  // Load recipes function - memoized to prevent infinite loops
  const loadRecipes = useCallback(
    async (showToast = true) => {
      setLoading(true);
      try {
        // Load recipes for bulk editing (100 at a time)
        // If needsReviewOnly is true, only load recipes without images (likely need work)
        const result = await getRecipesForBulkEditing(100, needsReviewOnly);
        if (result.success) {
          setRecipes(result.data);
          // Only show toast if requested and we actually loaded recipes
          if (showToast && result.data.length > 0) {
            const filterText = needsReviewOnly ? ' (needing review)' : '';
            toast.success(`Loaded ${result.data.length} recipes${filterText}`);
          } else if (showToast && result.data.length === 0 && needsReviewOnly) {
            toast.info(
              'No recipes need review - all have images! Try unchecking "Only recipes needing review"'
            );
          }
        } else {
          if (showToast) {
            toast.error(`Failed to load recipes: ${result.error}`);
          }
        }
      } catch (error) {
        if (showToast) {
          toast.error(`Error loading recipes: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    },
    [toast, needsReviewOnly]
  );

  // Load recipes when filter changes
  useEffect(() => {
    loadRecipes(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsReviewOnly]); // Reload when filter changes

  // Filter recipes based on search
  const filteredRecipes = recipes.filter(recipe =>
    recipe.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle cell edit
  const handleCellEdit = (recipeId, field, value) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const key = `${recipeId}_${field}`;
    const newEdited = new Map(editedRecipes);

    if (value !== recipe[field]) {
      newEdited.set(key, { recipeId, field, value, original: recipe[field] });
    } else {
      newEdited.delete(key);
    }

    setEditedRecipes(newEdited);

    // Update local state for immediate UI feedback
    setRecipes(prev => prev.map(r => (r.id === recipeId ? { ...r, [field]: value } : r)));
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Title',
      'Description',
      'Prep Minutes',
      'Cook Minutes',
      'Servings',
      'Difficulty',
      'Author',
    ];
    const rows = filteredRecipes.map(recipe => [
      recipe.id,
      recipe.title || '',
      recipe.description || '',
      recipe.prep_minutes || '',
      recipe.cook_minutes || '',
      recipe.servings || '',
      recipe.difficulty || 'easy',
      recipe.author || 'Community',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `recipes_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${filteredRecipes.length} recipes to CSV`);
  };

  // Export incomplete recipes (ID, Image URL, Title) for data work
  const handleExportIncompleteRecipes = () => {
    if (filteredRecipes.length === 0) {
      toast.error('No recipes to export');
      return;
    }

    // Create CSV with ID, Title, Current Image URL
    const headers = ['ID', 'Title', 'Current Image URL'];
    const rows = filteredRecipes.map(recipe => [
      recipe.id,
      recipe.title || 'Untitled Recipe',
      recipe.hero_image_url || '(no image)',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `incomplete_recipes_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${filteredRecipes.length} incomplete recipe(s) to CSV`);
  };

  // Export first 5 recipes (for ChatGPT full recipe generation)
  const handleExportFirst5 = () => {
    const first5 = filteredRecipes.slice(0, 5);

    if (first5.length === 0) {
      toast.error('No recipes to copy');
      return;
    }

    // Format exactly as ChatGPT expects for full recipe generation
    const formattedText =
      first5
        .map((recipe, index) => {
          return `Recipe ${index + 1}:
Name: ${recipe.title || 'Untitled Recipe'}
ID: ${recipe.id}

`;
        })
        .join('') +
      `Please generate the complete recipe with JSON + 1024×1024 image for all ${first5.length} recipe${first5.length !== 1 ? 's' : ''} above.`;

    // Copy to clipboard
    navigator.clipboard
      .writeText(formattedText)
      .then(() => {
        toast.success(
          `Copied first ${first5.length} recipe${first5.length !== 1 ? 's' : ''} to clipboard! Ready to paste into ChatGPT.`
        );
      })
      .catch(() => {
        // Fallback: show in alert
        alert(`Copy this and paste into ChatGPT:\n\n${formattedText}`);
      });
  };

  // Import from CSV - basic format only (no ChatGPT/master format)
  const handleImportCSV = async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const text = e.target?.result;
        if (!text) return;

        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          toast.error('CSV file must have at least a header row and one data row');
          return;
        }

        // Parse CSV (simple parser - handles quoted fields)
        const parseCSVLine = line => {
          const result = [];
          let current = '';
          let inQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++; // Skip next quote
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
        const dataRows = lines.slice(1).map(parseCSVLine);

        // Map CSV columns to recipe fields
        const fieldMap = {
          id: 'id',
          title: 'title',
          description: 'description',
          prep_minutes: 'prep_minutes',
          cook_minutes: 'cook_minutes',
          servings: 'servings',
          difficulty: 'difficulty',
          author: 'author',
        };

        const importedRecipes = [];
        const errors = [];

        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          if (row.length !== headers.length) {
            errors.push(`Row ${i + 2}: Column count mismatch`);
            continue;
          }

          const recipeData = {};
          headers.forEach((header, idx) => {
            const field = fieldMap[header];
            if (field && row[idx]) {
              const value = row[idx].replace(/^"|"$/g, ''); // Remove quotes
              if (field === 'prep_minutes' || field === 'cook_minutes' || field === 'servings') {
                recipeData[field] = value ? parseFloat(value) : null;
              } else {
                recipeData[field] = value || null;
              }
            }
          });

          if (recipeData.id) {
            importedRecipes.push(recipeData);
          } else {
            errors.push(`Row ${i + 2}: Missing ID`);
          }
        }

        if (errors.length > 0) {
          toast.warning(
            `Imported ${importedRecipes.length} recipes, but ${errors.length} rows had errors`
          );
        } else {
          toast.success(`Imported ${importedRecipes.length} recipes`);
        }

        // Update local state with imported data
        setRecipes(prev =>
          prev.map(recipe => {
            const imported = importedRecipes.find(imp => imp.id === recipe.id);
            if (imported) {
              // Mark as edited
              Object.keys(imported).forEach(field => {
                if (field !== 'id' && imported[field] !== recipe[field]) {
                  const key = `${recipe.id}_${field}`;
                  const newEdited = new Map(editedRecipes);
                  newEdited.set(key, {
                    recipeId: recipe.id,
                    field,
                    value: imported[field],
                    original: recipe[field],
                  });
                  setEditedRecipes(newEdited);
                }
              });
              return { ...recipe, ...imported };
            }
            return recipe;
          })
        );

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        toast.error(`Error importing CSV: ${error.message}`);
      }
    };

    reader.readAsText(file);
  };

  // Bulk save all changes - basic fields only
  const handleBulkSave = async () => {
    if (editedRecipes.size === 0) {
      toast.info('No changes to save');
      return;
    }

    setSaving(true);
    const savedItems = [];
    const errors = [];
    let successCount = 0;
    let errorCount = 0;

    // Group changes by recipe ID
    const changesByRecipe = new Map();
    editedRecipes.forEach(change => {
      if (!changesByRecipe.has(change.recipeId)) {
        changesByRecipe.set(change.recipeId, []);
      }
      changesByRecipe.get(change.recipeId).push(change);
    });

    // Save each recipe's changes
    for (const [recipeId, changes] of changesByRecipe) {
      const recipe = recipes.find(r => r.id === recipeId);
      if (!recipe) continue;

      try {
        // Group changes by update function
        const titleChange = changes.find(c => c.field === 'title');
        const descriptionChange = changes.find(c => c.field === 'description');
        const metadataChanges = changes.filter(c => !['title', 'description'].includes(c.field));

        // Update title
        if (titleChange) {
          const result = await updateRecipeTitle(recipeId, titleChange.value);
          if (result.success) {
            successCount++;
            savedItems.push(`Title: ${recipe.title}`);
          } else {
            errorCount++;
            errors.push(`${recipe.title} - Title: ${result.error}`);
          }
        }

        // Update description
        if (descriptionChange) {
          const result = await updateRecipeDescription(recipeId, descriptionChange.value || '');
          if (result.success) {
            successCount++;
            savedItems.push(`Description: ${recipe.title}`);
          } else {
            errorCount++;
            errors.push(`${recipe.title} - Description: ${result.error}`);
          }
        }

        // Update metadata
        if (metadataChanges.length > 0) {
          const metadata = {};
          metadataChanges.forEach(change => {
            if (change.field === 'prep_minutes' || change.field === 'cook_minutes') {
              metadata[change.field] = change.value ? parseInt(change.value) : null;
            } else if (change.field === 'servings') {
              metadata[change.field] = change.value ? parseFloat(change.value) : null;
            } else {
              metadata[change.field] = change.value || null;
            }
          });

          const result = await updateRecipeMetadata(recipeId, metadata);
          if (result.success) {
            successCount++;
            savedItems.push(`Metadata: ${recipe.title}`);
          } else {
            errorCount++;
            errors.push(`${recipe.title} - Metadata: ${result.error}`);
          }
        }
      } catch (error) {
        errorCount++;
        errors.push(`${recipe.title}: ${error.message}`);
      }
    }

    setSaving(false);

    // Show results
    if (errorCount === 0 && successCount > 0) {
      const message = `✅ Successfully saved ${successCount} update${successCount !== 1 ? 's' : ''}:\n\n${savedItems.slice(0, 10).join('\n')}${savedItems.length > 10 ? `\n...and ${savedItems.length - 10} more` : ''}`;
      toast.success(message, 6000);
      setEditedRecipes(new Map()); // Clear edited recipes
      loadRecipes(false); // Reload to get latest data (no toast - already showed success)
    } else if (errorCount > 0) {
      const message = `❌ ${errorCount} error${errorCount !== 1 ? 's' : ''} occurred:\n\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n...and ${errors.length - 5} more` : ''}${successCount > 0 ? `\n\n✅ ${successCount} update${successCount !== 1 ? 's' : ''} saved successfully.` : ''}`;
      toast.error(message, 8000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Bulk Recipe Editor
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Edit multiple recipes at once or import/export CSV
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          {/* Filter: Only show recipes needing review */}
          <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            <input
              type="checkbox"
              checked={needsReviewOnly}
              onChange={e => setNeedsReviewOnly(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Only recipes needing review
            </span>
          </label>

          <div className="flex gap-2">
            <button
              onClick={handleExportIncompleteRecipes}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              title="Export incomplete recipes (ID, Title, Current Image URL) for data work"
            >
              <Download className="w-4 h-4" />
              Export Incomplete (ID, Title, Image)
            </button>

            <button
              onClick={handleExportFirst5}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              title="Copy first 5 recipes (Name + ID) formatted for ChatGPT full recipe generation"
            >
              <span>📋</span>
              Copy First 5 for ChatGPT
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>

            <label className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              Import CSV
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
              />
            </label>

            <button
              onClick={handleBulkSave}
              disabled={saving || editedRecipes.size === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : `Save All (${editedRecipes.size})`}
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading recipes...</div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 dark:bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Prep (min)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Cook (min)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Servings
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Difficulty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Author
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredRecipes.map(recipe => {
                    const isEdited = Array.from(editedRecipes.keys()).some(_key =>
                      _key.startsWith(`${recipe.id}_`)
                    );

                    return (
                      <tr
                        key={recipe.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                          isEdited ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={recipe.title || ''}
                            onChange={e => handleCellEdit(recipe.id, 'title', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <textarea
                            value={recipe.description || ''}
                            onChange={e => handleCellEdit(recipe.id, 'description', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm resize-none"
                            rows={2}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={recipe.prep_minutes || ''}
                            onChange={e =>
                              handleCellEdit(recipe.id, 'prep_minutes', e.target.value)
                            }
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={recipe.cook_minutes || ''}
                            onChange={e =>
                              handleCellEdit(recipe.id, 'cook_minutes', e.target.value)
                            }
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.1"
                            value={recipe.servings || ''}
                            onChange={e => handleCellEdit(recipe.id, 'servings', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={recipe.difficulty || 'easy'}
                            onChange={e => handleCellEdit(recipe.id, 'difficulty', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={recipe.author || ''}
                            onChange={e => handleCellEdit(recipe.id, 'author', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredRecipes.length === 0 && (
              <div className="text-center py-12 text-slate-500">No recipes found</div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          <p>
            💡 <strong>Tip:</strong> Export to CSV, edit in Excel/Google Sheets, then import back.
            Or edit directly in the table above. Changes are highlighted in yellow.
          </p>
        </div>
      </div>
    </div>
  );
}
